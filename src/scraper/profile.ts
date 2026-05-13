import { ProfileData } from "../types";

const OPENALEX_API = "https://api.openalex.org";

interface OpenAlexAuthor {
  id: string;
  display_name: string;
  cited_by_count: number;
  works_count: number;
  summary_stats: {
    h_index: number;
    i10_index: number;
  };
  last_known_institutions?: Array<{
    display_name: string;
  }>;
  topics?: Array<{
    display_name: string;
  }>;
}

export async function scrapeProfile(orcid: string): Promise<ProfileData> {
  const url = `${OPENALEX_API}/authors/https://orcid.org/${encodeURIComponent(orcid)}?select=id,display_name,cited_by_count,works_count,summary_stats,last_known_institutions,topics&mailto=scholar-badge@example.com`;

  const response = await fetch(url);

  if (response.status === 404) {
    throw new Error("USER_NOT_FOUND");
  }

  if (response.status === 429) {
    throw new Error("RATE_LIMITED");
  }

  if (!response.ok) {
    console.error(`OpenAlex HTTP ${response.status} for ORCID ${orcid}`);
    throw new Error(`OpenAlex returned ${response.status}`);
  }

  const data = (await response.json()) as OpenAlexAuthor;

  const affiliation = data.last_known_institutions?.[0]?.display_name ?? "";

  const interests = (data.topics ?? [])
    .slice(0, 5)
    .map((t) => t.display_name);

  return {
    name: data.display_name,
    affiliation,
    interests,
    citations: data.cited_by_count,
    hIndex: data.summary_stats.h_index,
    i10Index: data.summary_stats.i10_index,
    worksCount: data.works_count,
    fetchedAt: Date.now(),
  };
}
