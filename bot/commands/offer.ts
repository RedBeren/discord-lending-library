import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { supabase } from "../lib/supabase";
import { searchBooks } from "../lib/google-books";

export const data = new SlashCommandBuilder()
  .setName("offer")
  .setDescription("Offer a book to the lending library")
  .addStringOption((opt) =>
    opt
      .setName("book")
      .setDescription("Title (or title + author) of the book")
      .setRequired(true)
      .setAutocomplete(true)
  )
  .addStringOption((opt) =>
    opt
      .setName("pickup_notes")
      .setDescription("Where/how to arrange pickup (optional)")
      .setRequired(false)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focused = interaction.options.getFocused();
  if (!focused) return interaction.respond([]);

  // 1. Check existing books table with pg_trgm similarity
  const { data: books } = await supabase
    .from("books")
    .select("id, title, author")
    .textSearch("title", focused, { type: "websearch", config: "english" })
    .limit(5);

  if (books?.length) {
    return interaction.respond(
      books.map((b) => ({ name: `${b.title} — ${b.author}`, value: b.id }))
    );
  }

  // 2. Fall back to Google Books API
  const results = await searchBooks(focused);
  return interaction.respond(
    results.map((b) => ({
      name: `${b.title} — ${b.author}`.slice(0, 100),
      value: b.google_id,
    }))
  );
}

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const bookValue = interaction.options.getString("book", true);
  const pickupNotes = interaction.options.getString("pickup_notes");

  // Resolve member record
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("discord_id", interaction.user.id)
    .single();

  if (!member) {
    return interaction.editReply(
      "You need to sign in at the web app first so we can link your Discord account."
    );
  }

  // Resolve book — value is either a DB uuid or a Google Books id
  let bookId: string;

  const { data: existingBook } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookValue)
    .maybeSingle();

  if (existingBook) {
    bookId = existingBook.id;
  } else {
    // Look up by google_id
    const { data: byGoogleId } = await supabase
      .from("books")
      .select("id")
      .eq("google_id", bookValue)
      .maybeSingle();

    if (byGoogleId) {
      bookId = byGoogleId.id;
    } else {
      // Insert from Google Books
      const results = await searchBooks(bookValue);
      const match = results.find((b) => b.google_id === bookValue) ?? results[0];

      if (!match) {
        return interaction.editReply("Could not find that book. Try a different search.");
      }

      const { data: inserted, error } = await supabase
        .from("books")
        .insert(match)
        .select("id")
        .single();

      if (error || !inserted) {
        return interaction.editReply("Failed to add the book. Please try again.");
      }

      bookId = inserted.id;
    }
  }

  // Create listing
  const { error } = await supabase.from("listings").insert({
    book_id: bookId,
    offered_by: member.id,
    pickup_notes: pickupNotes ?? null,
  });

  if (error) {
    return interaction.editReply("Failed to create listing. Please try again.");
  }

  await interaction.editReply("Your book has been listed! Others can now claim it with `/claim`.");

  // Notify via webhook
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (webhookUrl) {
    const { data: book } = await supabase
      .from("books")
      .select("title, author")
      .eq("id", bookId)
      .single();

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `📚 **${book?.title}** by ${book?.author} is now available, offered by <@${interaction.user.id}>!`,
      }),
    }).catch(() => null);
  }
}
