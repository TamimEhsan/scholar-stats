export interface Env {
  CACHE: KVNamespace;
}

export interface ProfileData {
  name: string;
  affiliation: string;
  interests: string[];
  citations: number;
  hIndex: number;
  i10Index: number;
  scrapedAt: number;
}

export interface PaperData {
  title: string;
  authors: string;
  year: string;
  citations: number;
  venue: string;
  scrapedAt: number;
}

export interface CardOptions {
  theme: "light" | "dark";
  color: string;
}
