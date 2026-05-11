# Scholar Badge

Generate dynamic SVG cards showing Google Scholar statistics — embeddable in GitHub READMEs, websites, and anywhere that renders images.

## Cards

### Profile Card

Shows a researcher's name, affiliation, interests, citation count, h-index, and i10-index.

```markdown
![Scholar Stats](https://scholar-badge.<your-domain>/profile?user=SCHOLAR_ID)
```

### Paper Card

Shows a paper's title, authors, venue, year, and citation count.

```markdown
![Paper Stats](https://scholar-badge.<your-domain>/paper?user=USER_ID&paper=PAPER_ID)
```

## Finding Your IDs

**Scholar ID** — Go to your [Google Scholar profile](https://scholar.google.com/). Your URL looks like:
```
https://scholar.google.com/citations?user=kukA0LcAAAAJ
                                          ^^^^^^^^^^^^
                                          This is your Scholar ID
```

**Paper ID** — Click on a paper in your Scholar profile. The URL looks like:
```
https://scholar.google.com/citations?view_op=view_citation&citation_for_view=kukA0LcAAAAJ:u5HHmVD_uO8C
                                                                              ^^^^^^^^^^^^  ^^^^^^^^^^^^
                                                                              User ID       Paper ID
```

## Parameters

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `user` | Scholar ID | *required* | Google Scholar user ID |
| `paper` | Paper ID | *required for /paper* | Paper ID (from citation_for_view) |
| `theme` | `light`, `dark` | `light` | Card color theme |
| `color` | Hex color (no #) | `4285f4` | Accent color |
| `format` | `json` | `svg` | Response format |

## Examples

### Light theme (default)
```markdown
[![Scholar Stats](https://scholar-badge.<your-domain>/profile?user=kukA0LcAAAAJ)](https://scholar.google.com/citations?user=kukA0LcAAAAJ)
```

### Dark theme
```markdown
![Scholar Stats](https://scholar-badge.<your-domain>/profile?user=kukA0LcAAAAJ&theme=dark)
```

### Custom accent color
```markdown
![Scholar Stats](https://scholar-badge.<your-domain>/profile?user=kukA0LcAAAAJ&color=e91e63)
```

### Paper card
```markdown
![Paper](https://scholar-badge.<your-domain>/paper?user=kukA0LcAAAAJ&paper=u5HHmVD_uO8C)
```

### JSON response
```
https://scholar-badge.<your-domain>/profile?user=kukA0LcAAAAJ&format=json
```

Returns:
```json
{
  "name": "Yoshua Bengio",
  "affiliation": "Professor of computer science, University of Montreal, Mila, IVADO, CIFAR",
  "interests": ["Machine learning", "deep learning", "artificial intelligence"],
  "citations": 1094450,
  "hIndex": 255,
  "i10Index": 1039,
  "scrapedAt": 1778491696994
}
```

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

1. A request comes in (e.g. `/profile?user=kukA0LcAAAAJ`)
2. Check Cloudflare Workers KV cache for existing data
3. **Cache hit** — return immediately. If data is >6 hours old, trigger a background refresh
4. **Cache miss** — scrape Google Scholar, cache the result, return the card
5. SVG is rendered from the scraped data with the requested theme/color

### Rate Limits

- **Per-IP**: 30 requests/minute
- **Cache TTL**: 6 hours (data is scraped at most once per user per 6 hours)
- **Browser cache**: 1 hour

## Tech Stack

- **Runtime**: Cloudflare Workers (TypeScript)
- **Cache**: Workers KV
- **Rendering**: SVG via string templates
- **DDoS Protection**: Cloudflare (built-in)

## License

MIT
