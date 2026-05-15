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

**Paper ID** — Use an OpenAlex work ID (starts with `W`) or a DOI. You can search for papers at [OpenAlex](https://openalex.org/):
```
W2919115771                    ← OpenAlex work ID
10.1038/s41586-020-2649-2      ← DOI
```

## Parameters

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `orcid` | ORCID iD | *required for profile endpoints* | e.g. `0000-0002-9322-3515` |
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

### Prerequisites

- Node.js 18+
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)

### Setup

```bash
# Install dependencies
npm install

# Create KV namespace
npx wrangler kv namespace create CACHE

# Update wrangler.toml with the KV namespace ID from the output above

# Run locally
npx wrangler dev

# Deploy
npx wrangler deploy
```

### How It Works

1. A request comes in (e.g. `/card/profile?orcid=0000-0002-9322-3515`)
2. Check Edge Cache (per-location, free, no limits)
3. On miss, check Workers KV (persistent, global)
4. On miss, fetch from OpenAlex API and cache in both layers
5. If cached data is >24 hours old, serve stale and refresh in background
6. SVG is rendered from the fetched data with the requested theme/color

### Rate Limits

- **Per-IP**: 30 requests/minute
- **Cache TTL**: 24 hours (data is fetched at most once per author per day)
- **Browser cache**: 1 hour

## Tech Stack

- **Runtime**: Cloudflare Workers (TypeScript)
- **Data Source**: [OpenAlex API](https://docs.openalex.org/) (free, no key required)
- **Author Lookup**: [ORCID](https://orcid.org/)
- **Cache**: Edge Cache API + Workers KV (two-layer)
- **Rendering**: SVG via string templates
- **DDoS Protection**: Cloudflare (built-in)

## Why not Google Scholar?

Google Scholar does not provide a public API and actively blocks automated requests (returning 403/CAPTCHA responses from cloud server IPs). Scholar Stats uses [OpenAlex](https://openalex.org/) instead, which offers a free, open API with no authentication required.

**Why do the numbers differ from Google Scholar?** Google Scholar counts citations more aggressively — it indexes books, theses, preprints, patents, and even some non-peer-reviewed sources. OpenAlex primarily covers peer-reviewed literature using data from Crossref, PubMed, DOAJ, and institutional repositories. As a result, Google Scholar typically reports higher citation counts and h-index values. Both are legitimate metrics; they just measure slightly different things.

## License

MIT
