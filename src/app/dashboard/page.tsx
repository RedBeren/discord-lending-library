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
    books: {
      title: string;
      author: string;
      cover_url: string | null;
      description: string | null;
      avg_rating: number | null;
      year_published: number | null;
      google_id: string | null;
    } | null;
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
      books ( title, author, cover_url, description, avg_rating, year_published, google_id ),
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
        {listings?.map((listing) => {
          const book = listing.books;
          const googleUrl = book?.google_id
            ? `https://books.google.com/books?id=${book.google_id}`
            : null;

          return (
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
              {book?.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.cover_url}
                  alt=""
                  width={60}
                  style={{ objectFit: "contain", flexShrink: 0 }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
                  <strong>
                    {googleUrl ? (
                      <a href={googleUrl} target="_blank" rel="noopener noreferrer">
                        {book?.title ?? "Unknown"}
                      </a>
                    ) : (
                      book?.title ?? "Unknown"
                    )}
                  </strong>
                  {book?.year_published && (
                    <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                      ({book.year_published})
                    </span>
                  )}
                </div>
                <p style={{ margin: "0.25rem 0 0", color: "#6b7280", fontSize: "0.875rem" }}>
                  {book?.author ?? ""}
                  {book?.avg_rating != null && (
                    <span style={{ marginLeft: "0.75rem" }}>
                      ★ {book.avg_rating.toFixed(1)}
                    </span>
                  )}
                </p>
                {book?.description && (
                  <p
                    style={{
                      margin: "0.5rem 0 0",
                      fontSize: "0.875rem",
                      color: "#374151",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {book.description}
                  </p>
                )}
                {listing.pickup_notes && (
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
                    Pickup: {listing.pickup_notes}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
