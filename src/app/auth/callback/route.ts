import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL("/?error=auth_failed", request.url)
    );
  }

  // Upsert member record so the bot can DM them by discord_id
  const discordId = data.user.user_metadata.provider_id as string;
  const discordUsername = (data.user.user_metadata.full_name ??
    data.user.user_metadata.user_name) as string;

  await supabase.from("members").upsert(
    {
      id: data.user.id,
      discord_id: discordId,
      discord_username: discordUsername,
    },
    { onConflict: "id" }
  );

  return NextResponse.redirect(new URL(next, request.url));
}
