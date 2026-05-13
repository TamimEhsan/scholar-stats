import { PaperData } from "../types";

const OPENALEX_API = "https://api.openalex.org";

interface OpenAlexWork {
  id: string;
  title: string;
  authorships: Array<{
    author: { display_name: string };
  }>;
  publication_year: number | null;
  cited_by_count: number;
  primary_location?: {
    source?: {
      display_name: string;
    };
  } | null;
}

export async function scrapePaper(paperId: string): Promise<PaperData> {
  const url = `${OPENALEX_API}/works/${encodeURIComponent(paperId)}?select=id,title,authorships,publication_year,cited_by_count,primary_location&mailto=scholar-badge@example.com`;

  const response = await fetch(url);

  if (response.status === 404) {
    throw new Error("PAPER_NOT_FOUND");
  }

  if (response.status === 429) {
    throw new Error("RATE_LIMITED");
  }

  if (!response.ok) {
    console.error(`OpenAlex HTTP ${response.status} for paper ${paperId}`);
    throw new Error(`OpenAlex returned ${response.status}`);
  }

  const data = (await response.json()) as OpenAlexWork;

  const authors = data.authorships
    .map((a) => a.author.display_name)
    .join(", ");

  const venue = data.primary_location?.source?.display_name ?? "";
  const year = data.publication_year?.toString() ?? "";

  return {
    title: data.title,
    authors,
    year,
    citations: data.cited_by_count,
    venue,
    fetchedAt: Date.now(),
  };
}
