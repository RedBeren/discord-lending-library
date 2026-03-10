const BASE = "https://www.googleapis.com/books/v1";

export interface BookResult {
  google_id: string;
  title: string;
  author: string;
  isbn_13: string | null;
  cover_url: string | null;
  avg_rating: number | null;
  description: string | null;
  year_published: number | null;
}

export async function searchBooks(query: string): Promise<BookResult[]> {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  const params = new URLSearchParams({ q: query, maxResults: "5" });
  if (key) params.set("key", key);

  const res = await fetch(`${BASE}/volumes?${params}`);
  if (!res.ok) return [];

  const json = await res.json();
  return (json.items ?? []).map((item: Record<string, unknown>) => {
    const info = item.volumeInfo as Record<string, unknown>;
    const isbn13 = ((info.industryIdentifiers as Array<{ type: string; identifier: string }>) ?? [])
      .find((x) => x.type === "ISBN_13")?.identifier ?? null;

    const thumb = (info.imageLinks as Record<string, string> | undefined)?.thumbnail ?? null;

    return {
      google_id: item.id as string,
      title: (info.title as string) ?? "Unknown",
      author: ((info.authors as string[]) ?? []).join(", ") || "Unknown",
      isbn_13: isbn13,
      cover_url: thumb?.replace("http:", "https:") ?? null,
      avg_rating: (info.averageRating as number) ?? null,
      description: (info.description as string) ?? null,
      year_published: info.publishedDate
        ? parseInt((info.publishedDate as string).slice(0, 4))
        : null,
    };
  });
}
