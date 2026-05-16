export interface RawArticle {
  title: string;
  content: string;
  url: string;
  publishedAt: string;
  source: string;
  imageUrl?: string;
}

const NIGERIA_NEWS_RSS_FEEDS = [
  "https://www.vanguardngr.com/feed/",
  "https://punchng.com/feed/",
  "https://www.premiumtimesng.com/feed",
  "https://thenationonlineng.net/feed/",
  "https://dailypost.ng/feed/",
];

const POLITICS_KEYWORDS = [
  "Nigeria",
  "Abuja",
  "INEC",
  "president",
  "governor",
  "senate",
  "house of reps",
  "PDP",
  "APC",
  "election",
  "minister",
  "government",
  "Tinubu",
  "naira",
  "NNPC",
  "CBN",
];

/**
 * Parses an RSS feed XML string and returns structured articles
 */
function parseRSSFeed(xml: string, sourceUrl: string): RawArticle[] {
  const articles: RawArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];

    const title = decodeXMLEntities(extractTag(item, "title"));
    const link = extractTag(item, "link") || extractTag(item, "guid");
    const description = decodeXMLEntities(
      stripHTML(extractTag(item, "description") || extractTag(item, "content:encoded") || "")
    );
    const pubDate = extractTag(item, "pubDate");
    const imageUrl =
      item.match(/<media:content[^>]*url="([^"]+)"/)?.[1] ||
      item.match(/<enclosure[^>]*url="([^"]+)"/)?.[1] ||
      undefined;

    if (title && link && description) {
      articles.push({
        title: title.trim(),
        content: description.trim().slice(0, 2000),
        url: link.trim(),
        publishedAt: pubDate || new Date().toISOString(),
        source: new URL(sourceUrl).hostname.replace("www.", ""),
        imageUrl,
      });
    }
  }

  return articles;
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function stripHTML(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeXMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * Scores an article's relevance to Nigerian politics/trending news
 */
function scoreRelevance(article: RawArticle): number {
  const text = `${article.title} ${article.content}`.toLowerCase();
  return POLITICS_KEYWORDS.filter((kw) => text.includes(kw.toLowerCase())).length;
}

/**
 * Fetches fresh articles from all RSS feeds and returns the top stories
 */
export async function scanNewsFeeds(limit = 5): Promise<RawArticle[]> {
  const allArticles: RawArticle[] = [];
  const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h

  const feedFetches = NIGERIA_NEWS_RSS_FEEDS.map(async (feedUrl) => {
    try {
      const response = await fetch(feedUrl, {
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "In-Naija News Scanner/1.0" },
      });

      if (!response.ok) return;
      const xml = await response.text();
      const articles = parseRSSFeed(xml, feedUrl);

      // Filter to recent articles only
      const recent = articles.filter((a) => {
        const pub = new Date(a.publishedAt);
        return !isNaN(pub.getTime()) && pub > cutoffTime;
      });

      allArticles.push(...recent);
    } catch (err) {
      console.warn(`Feed scan failed for ${feedUrl}:`, err);
    }
  });

  await Promise.allSettled(feedFetches);

  // Deduplicate by URL, sort by relevance score, return top N
  const seen = new Set<string>();
  const unique = allArticles.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  return unique
    .sort((a, b) => scoreRelevance(b) - scoreRelevance(a))
    .slice(0, limit);
}
