import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { getSupabase } from "../lib/supabase";

export const data = new SlashCommandBuilder()
  .setName("claim")
  .setDescription("Claim an available book from the lending library")
  .addStringOption((opt) =>
    opt
      .setName("listing")
      .setDescription("Book you want to borrow")
      .setRequired(true)
      .setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focused = interaction.options.getFocused();

  try {
    const { data: listings } = await getSupabase()
      .from("listings")
      .select("id, books(title, author)")
      .eq("status", "available")
      .limit(25);

    const choices = (listings ?? [])
      .filter((l) => {
        if (!focused) return true;
        const book = l.books as unknown as { title: string; author: string } | null;
        return book?.title.toLowerCase().includes(focused.toLowerCase());
      })
      .map((l) => {
        const book = l.books as unknown as { title: string; author: string } | null;
        return {
          name: `${book?.title ?? "Unknown"} — ${book?.author ?? ""}`.slice(0, 100),
          value: l.id,
        };
      });

    return interaction.respond(choices);
  } catch (err) {
    console.error("claim autocomplete error:", err);
    return interaction.respond([]);
  }
}

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const listingId = interaction.options.getString("listing", true);
  const supabase = getSupabase();

  // Resolve claimant member
  const { data: claimant } = await supabase
    .from("members")
    .select("id")
    .eq("discord_id", interaction.user.id)
    .single();

  if (!claimant) {
    return interaction.editReply(
      "You need to sign in at the web app first so we can link your Discord account."
    );
  }

  // Fetch listing + offerer info in one query
  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, status, pickup_notes, offered_by, books(title, author), members!offered_by(discord_id)"
    )
    .eq("id", listingId)
    .single();

  if (!listing || listing.status !== "available") {
    return interaction.editReply("That listing is no longer available.");
  }

  // Insert claim + mark listing as claimed in a transaction-like pair
  const { error: claimError } = await supabase.from("claims").insert({
    listing_id: listingId,
    claimant_member_id: claimant.id,
  });

  if (claimError) {
    return interaction.editReply(
      claimError.code === "23505"
        ? "Someone else just claimed that book. Try another!"
        : "Failed to claim the listing. Please try again."
    );
  }

  await supabase
    .from("listings")
    .update({ status: "claimed" })
    .eq("id", listingId);

  const book = listing.books as unknown as { title: string; author: string } | null;
  const offerer = listing.members as unknown as { discord_id: string } | null;

  await interaction.editReply(
    `You've claimed **${book?.title}**! The offerer has been notified.`
  );

  // DM the offerer
  if (offerer?.discord_id) {
    try {
      const offererUser = await interaction.client.users.fetch(offerer.discord_id);
      await offererUser.send(
        `📬 <@${interaction.user.id}> (**${interaction.user.username}**) has claimed your copy of **${book?.title}**!\n` +
          (listing.pickup_notes ? `Pickup notes: ${listing.pickup_notes}` : "Arrange pickup directly.")
      );
    } catch {
      // User may have DMs disabled — silently continue
    }
  }

  // DM the claimant
  try {
    await interaction.user.send(
      `You've claimed **${book?.title}** by ${book?.author}. ` +
        (offerer?.discord_id
          ? `Contact <@${offerer.discord_id}> to arrange pickup.`
          : "Contact the offerer to arrange pickup.") +
        (listing.pickup_notes ? `\nPickup notes: ${listing.pickup_notes}` : "")
    );
  } catch {
    // DMs disabled
  }
}
