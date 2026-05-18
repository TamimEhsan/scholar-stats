# Scholar Stats

Generate dynamic SVG cards and badges showing academic statistics — embeddable in GitHub READMEs, websites, and anywhere that renders images. Powered by [OpenAlex](https://openalex.org/).

## Cards

### Profile Card

Shows a researcher's name, affiliation, interests, citation count, h-index, and i10-index.

```markdown
![Scholar Stats](https://scholar-badge.scholar-stats.workers.dev/card/profile?orcid=0000-0002-9322-3515)
```

### Paper Card

Shows a paper's title, authors, venue, year, and citation count.

```markdown
![Paper Stats](https://scholar-badge.scholar-stats.workers.dev/card/paper?paper=W2919115771)
```

## Badges

Shields.io-style flat badges for individual stats.

### Profile Badges

```markdown
![Citations](https://scholar-badge.scholar-stats.workers.dev/badge/profile/citations?orcid=0000-0002-9322-3515)
![h-index](https://scholar-badge.scholar-stats.workers.dev/badge/profile/h-index?orcid=0000-0002-9322-3515)
![i10-index](https://scholar-badge.scholar-stats.workers.dev/badge/profile/i10-index?orcid=0000-0002-9322-3515)
```

### Paper Badge

```markdown
![Citations](https://scholar-badge.scholar-stats.workers.dev/badge/paper/citations?paper=W2919115771)
```

## Finding Your IDs

**ORCID** — Go to [orcid.org](https://orcid.org/) and sign in. Your ORCID iD is in the URL:
```
https://orcid.org/0000-0002-9322-3515
                  ^^^^^^^^^^^^^^^^^^^
                  This is your ORCID
```

**OpenAlex Author ID** — If you don't have an ORCID, you can use your OpenAlex author ID instead (starts with `A`). Search for your name at [OpenAlex](https://openalex.org/):
```
A5023888391    ← OpenAlex author ID
```

**Paper ID** — Use an OpenAlex work ID (starts with `W`) or a DOI. You can search for papers at [OpenAlex](https://openalex.org/):
```
W2919115771                    ← OpenAlex work ID
10.1038/s41586-020-2649-2      ← DOI
```

## Parameters

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `orcid` | ORCID iD | *required (or use `id`)* | e.g. `0000-0002-9322-3515` |
| `id` | OpenAlex author ID | *required (or use `orcid`)* | e.g. `A5023888391` |
| `paper` | Work ID or DOI | *required for paper endpoints* | e.g. `W2919115771` |
| `theme` | `light`, `dark` | `light` | Card color theme |
| `color` | Hex color (no #) | `4285f4` | Accent color |
| `format` | `json` | `svg` | Response format |

## Examples

### Profile Card

[![Scholar Stats](https://scholar-badge.scholar-stats.workers.dev/card/profile?orcid=0000-0002-9322-3515)](https://orcid.org/0000-0002-9322-3515)

```markdown
[![Scholar Stats](https://scholar-badge.scholar-stats.workers.dev/card/profile?orcid=0000-0002-9322-3515)](https://orcid.org/0000-0002-9322-3515)
```

### Dark Theme

![Scholar Stats](https://scholar-badge.scholar-stats.workers.dev/card/profile?orcid=0000-0002-9322-3515&theme=dark)

```markdown
![Scholar Stats](https://scholar-badge.scholar-stats.workers.dev/card/profile?orcid=0000-0002-9322-3515&theme=dark)
```

### Custom Accent Color

![Scholar Stats](https://scholar-badge.scholar-stats.workers.dev/card/profile?orcid=0000-0002-9322-3515&color=e91e63)

```markdown
![Scholar Stats](https://scholar-badge.scholar-stats.workers.dev/card/profile?orcid=0000-0002-9322-3515&color=e91e63)
```

### Paper Card

![Paper](https://scholar-badge.scholar-stats.workers.dev/card/paper?paper=W2919115771)

```markdown
![Paper](https://scholar-badge.scholar-stats.workers.dev/card/paper?paper=W2919115771)
```

### Badges in a Row

![Citations](https://scholar-badge.scholar-stats.workers.dev/badge/profile/citations?orcid=0000-0002-9322-3515) ![h-index](https://scholar-badge.scholar-stats.workers.dev/badge/profile/h-index?orcid=0000-0002-9322-3515) ![i10-index](https://scholar-badge.scholar-stats.workers.dev/badge/profile/i10-index?orcid=0000-0002-9322-3515)

```markdown
![Citations](https://scholar-badge.scholar-stats.workers.dev/badge/profile/citations?orcid=0000-0002-9322-3515)
![h-index](https://scholar-badge.scholar-stats.workers.dev/badge/profile/h-index?orcid=0000-0002-9322-3515)
![i10-index](https://scholar-badge.scholar-stats.workers.dev/badge/profile/i10-index?orcid=0000-0002-9322-3515)
```

### JSON Response

```
https://scholar-badge.scholar-stats.workers.dev/card/profile?orcid=0000-0002-9322-3515&format=json
```

Returns:
```json
{
  "name": "Geoffrey Hinton",
  "affiliation": "University of Toronto",
  "interests": ["Deep Learning", "Neural Networks", "Machine Learning"],
  "citations": 894234,
  "hIndex": 186,
  "i10Index": 520,
  "worksCount": 823,
  "fetchedAt": 1778491696994
}
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/card/profile?orcid=ORCID` | Profile stats card (SVG) |
| `/card/paper?paper=ID` | Paper stats card (SVG) |
| `/badge/profile/citations?orcid=ORCID` | Citations badge |
| `/badge/profile/h-index?orcid=ORCID` | h-index badge |
| `/badge/profile/i10-index?orcid=ORCID` | i10-index badge |
| `/badge/paper/citations?paper=ID` | Paper citations badge |

## Self-Hosting

Scholar Stats supports two deployment platforms: **Cloudflare Workers** and **Vercel**.

### Option 1: Cloudflare Workers

```bash
npm install

# Create KV namespace
npx wrangler kv namespace create CACHE
# Update wrangler.toml with the KV namespace ID from the output

# Run locally
npm run dev:cf

# Deploy
npm run deploy:cf
```

**Caching**: Two-layer — Edge Cache API (per-location, fast) + Workers KV (global, persistent). Data is cached for 24 hours with stale-while-revalidate.

### Option 2: Vercel

```bash
npm install

# Link to your Vercel project
npx vercel link

# Run locally
npm run dev:vercel

# Deploy
npm run deploy:vercel
```

**Caching**: In-memory Map (persists across requests in warm serverless instances) + CDN edge caching via `Cache-Control` headers. No external storage needed.

### Rate Limits

- **Per-IP**: 30 requests/minute
- **Cache TTL**: 24 hours (data is fetched at most once per author per day)
- **Browser cache**: 1 hour

## Tech Stack

- **Runtime**: Cloudflare Workers or Vercel (TypeScript)
- **Data Source**: [OpenAlex API](https://docs.openalex.org/) (free, no key required)
- **Author Lookup**: [ORCID](https://orcid.org/)
- **Cache**: Platform-abstracted (CF: Edge Cache + KV, Vercel: in-memory + CDN)
- **Rendering**: SVG via string templates

## Why not Google Scholar?

Google Scholar does not provide a public API and actively blocks automated requests (returning 403/CAPTCHA responses from cloud server IPs). Scholar Stats uses [OpenAlex](https://openalex.org/) instead, which offers a free, open API with no authentication required.

**Why do the numbers differ from Google Scholar?** Google Scholar counts citations more aggressively — it indexes books, theses, preprints, patents, and even some non-peer-reviewed sources. OpenAlex primarily covers peer-reviewed literature using data from Crossref, PubMed, DOAJ, and institutional repositories. As a result, Google Scholar typically reports higher citation counts and h-index values. Both are legitimate metrics; they just measure slightly different things.

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repo and clone it
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev:cf` (Cloudflare) or `npm run dev:vercel` (Vercel)
4. Make your changes and test locally
5. Open a pull request

### Ideas for Contributions

- New card layouts or badge types
- Support for additional data sources
- Themes and customization options
- Documentation improvements

## License

MIT
