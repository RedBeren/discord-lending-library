import { createServerClient } from "@supabase/ssr";
import type { Database } from "./src/lib/supabase/types";

const supabase = createServerClient<Database>("url", "key", {
  cookies: {
    getAll() { return []; },
    setAll(_: { name: string; value: string; options: object }[]) {},
  }
});

// Does this work?
const test = supabase.from("members").upsert({ id: "a", discord_id: "b", discord_username: "c" });
