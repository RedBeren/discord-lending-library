import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  type ListingRow = {
    id: string;
    status: string;
    pickup_notes: string | null;
    created_at: string;
    books: { title: string; author: string; cover_url: string | null } | null;
    members: { discord_username: string } | null;
  };

  const { data: listingsRaw } = await supabase
    .from("listings")
    .select(
      `
      id,
      status,
      pickup_notes,
      created_at,
      books ( title, author, cover_url ),
      members!offered_by ( discord_username )
    `
    )
    .eq("status", "available")
    .order("created_at", { ascending: false });

  const listings = listingsRaw as ListingRow[] | null;

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Available Books</h1>
        <form action="/auth/sign-out" method="POST">
          <button type="submit" style={{ cursor: "pointer" }}>
            Sign out
          </button>
        </form>
      </header>

      {!listings?.length && (
        <p style={{ color: "#6b7280" }}>
          No books available yet. Use <code>/offer</code> in Discord to add one.
        </p>
      )}

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "1rem" }}>
        {listings?.map((listing) => (
          <li
            key={listing.id}
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              padding: "1rem",
              display: "flex",
              gap: "1rem",
            }}
          >
            {listing.books?.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.books.cover_url}
                alt=""
                width={60}
                style={{ objectFit: "contain" }}
              />
            )}
            <div>
              <strong>{listing.books?.title ?? "Unknown"}</strong>
              <p style={{ margin: "0.25rem 0", color: "#6b7280", fontSize: "0.875rem" }}>
                {listing.books?.author ?? ""}
              </p>
              {listing.pickup_notes && (
                <p style={{ margin: 0, fontSize: "0.875rem" }}>
                  {listing.pickup_notes}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
