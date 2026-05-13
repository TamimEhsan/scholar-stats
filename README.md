# Scholar Badge

Generate dynamic SVG cards and badges showing Google Scholar statistics — embeddable in GitHub READMEs, websites, and anywhere that renders images.

## Cards

### Profile Card

Shows a researcher's name, affiliation, interests, citation count, h-index, and i10-index.

```markdown
![Scholar Stats](https://scholar-badge.<your-domain>/card/profile?user=SCHOLAR_ID)
```

### Paper Card

Shows a paper's title, authors, venue, year, and citation count.

```markdown
![Paper Stats](https://scholar-badge.<your-domain>/card/paper?user=USER_ID&paper=PAPER_ID)
```

## Badges

Shields.io-style flat badges for individual stats.

### Profile Badges

```markdown
![Citations](https://scholar-badge.<your-domain>/badge/profile/citations?user=SCHOLAR_ID)
![h-index](https://scholar-badge.<your-domain>/badge/profile/h-index?user=SCHOLAR_ID)
![i10-index](https://scholar-badge.<your-domain>/badge/profile/i10-index?user=SCHOLAR_ID)
```

### Paper Badge

```markdown
![Citations](https://scholar-badge.<your-domain>/badge/paper/citations?user=USER_ID&paper=PAPER_ID)
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
| `paper` | Paper ID | *required for paper endpoints* | Paper ID (from citation_for_view) |
| `theme` | `light`, `dark` | `light` | Card color theme |
| `color` | Hex color (no #) | `4285f4` | Accent color |
| `format` | `json` | `svg` | Response format |

## Examples

### Profile card with link
```markdown
[![Scholar Stats](https://scholar-badge.<your-domain>/card/profile?user=kukA0LcAAAAJ)](https://scholar.google.com/citations?user=kukA0LcAAAAJ)
```

### Dark theme
```markdown
![Scholar Stats](https://scholar-badge.<your-domain>/card/profile?user=kukA0LcAAAAJ&theme=dark)
```

### Custom accent color
```markdown
![Scholar Stats](https://scholar-badge.<your-domain>/card/profile?user=kukA0LcAAAAJ&color=e91e63)
```

### Paper card
```markdown
![Paper](https://scholar-badge.<your-domain>/card/paper?user=kukA0LcAAAAJ&paper=u5HHmVD_uO8C)
```

### Badges in a row
```markdown
![Citations](https://scholar-badge.<your-domain>/badge/profile/citations?user=kukA0LcAAAAJ)
![h-index](https://scholar-badge.<your-domain>/badge/profile/h-index?user=kukA0LcAAAAJ)
![i10-index](https://scholar-badge.<your-domain>/badge/profile/i10-index?user=kukA0LcAAAAJ)
```

### JSON response
```
https://scholar-badge.<your-domain>/card/profile?user=kukA0LcAAAAJ&format=json
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

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/card/profile?user=ID` | Profile stats card (SVG) |
| `/card/paper?user=ID&paper=PID` | Paper stats card (SVG) |
| `/badge/profile/citations?user=ID` | Citations badge |
| `/badge/profile/h-index?user=ID` | h-index badge |
| `/badge/profile/i10-index?user=ID` | i10-index badge |
| `/badge/paper/citations?user=ID&paper=PID` | Paper citations badge |

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

1. A request comes in (e.g. `/card/profile?user=kukA0LcAAAAJ`)
2. Check Edge Cache (per-location, free, no limits)
3. On miss, check Workers KV (persistent, global)
4. On miss, scrape Google Scholar and cache in both layers
5. If cached data is >24 hours old, serve stale and refresh in background
6. SVG is rendered from the scraped data with the requested theme/color

### Rate Limits

- **Per-IP**: 30 requests/minute
- **Cache TTL**: 24 hours (data is scraped at most once per user per day)
- **Browser cache**: 1 hour

## Tech Stack

- **Runtime**: Cloudflare Workers (TypeScript)
- **Cache**: Edge Cache API + Workers KV (two-layer)
- **Rendering**: SVG via string templates
- **DDoS Protection**: Cloudflare (built-in)

## License

MIT
