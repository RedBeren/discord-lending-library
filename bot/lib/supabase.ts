import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/supabase/types";

// Bot uses the service role key — bypasses RLS.
// Lazy singleton so importing this module doesn't crash when env vars aren't
// set yet (e.g. when deploy-commands.ts registers slash commands).
let _client: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabase() {
  if (!_client) {
    _client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _client;
}
