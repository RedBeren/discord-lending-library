import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>
        Lending Library
      </h1>
      <p style={{ color: "#6b7280", margin: 0 }}>
        Borrow and share books with your Discord community.
      </p>
      <form action="/auth/sign-in" method="POST">
        <button
          type="submit"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            background: "#5865F2",
            color: "#fff",
            border: "none",
            borderRadius: "0.5rem",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Sign in with Discord
        </button>
      </form>
    </main>
  );
}
