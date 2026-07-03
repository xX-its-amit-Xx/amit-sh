// Pull recent posts from a Substack publication's public RSS feed at build time.
// Needs only the publication subdomain (no token). Profile @handle ≠ feed —
// the feed lives at https://<publication>.substack.com/feed.
import { fetchText, log } from "./lib.mjs";

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}

function stripHtml(s) {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

// Exported so it can be unit-tested against sample XML without a network call.
export function parseFeed(xml, max = 6) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  return items.slice(0, max).map((block) => {
    const desc = tag(block, "description");
    return {
      title: stripHtml(tag(block, "title")),
      link: tag(block, "link"),
      date: tag(block, "pubDate"),
      excerpt: stripHtml(desc).slice(0, 220),
    };
  });
}

export async function fetchBlog(cfg) {
  const sub = cfg.substack || {};
  if (!sub.publication) {
    log("blog: no substack publication configured, skipping");
    return null;
  }
  const url = `https://${sub.publication}.substack.com/feed`;
  const xml = await fetchText(url);
  const posts = parseFeed(xml, sub.maxPosts || 6);
  if (!posts.length) {
    log(`blog: feed at ${url} returned 0 posts (is the publication live?)`);
    return null;
  }
  log(`blog: ${posts.length} posts from ${url}`);
  return { posts, fetchedAt: new Date().toISOString() };
}
