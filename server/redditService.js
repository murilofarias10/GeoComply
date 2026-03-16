const axios = require("axios");
const { XMLParser } = require("fast-xml-parser");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// RSS feeds from fetchrss.com mapped to their subreddit names
const RSS_FEEDS = [
  {
    url: "https://fetchrss.com/feed/1w0Yww9gdF1u1w0Z2e9AP8e2.rss",
    subreddit: "onlinegambling",
  },
  {
    url: "https://fetchrss.com/feed/1w0Yww9gdF1u1w0Z56494E4Y.rss",
    subreddit: "sportsbetting",
  },
  {
    url: "https://fetchrss.com/feed/1w0Yww9gdF1u1w0Z7N2og4FH.rss",
    subreddit: "poker",
  },
  {
    url: "https://fetchrss.com/feed/1w0Yww9gdF1u1w0ZAEBQ24dn.rss",
    subreddit: "gamblingaddiction",
  },
  {
    url: "https://fetchrss.com/feed/1w0Yww9gdF1u1w0ZBL9WED9G.rss",
    subreddit: "sportsbook",
  },
];

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "__cdata",
});

/**
 * Strip HTML tags from a string and return plain text.
 */
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#32;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract a clean post ID from the RSS guid field.
 * guid can be "t3_1rr73rm" → returns "1rr73rm"
 */
function extractId(guid) {
  if (!guid) return `post_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  if (typeof guid === "object") guid = guid["#text"] || guid.__cdata || String(guid);
  return String(guid).replace(/^t\d+_/, "");
}

/**
 * Parse a pubDate string (RFC 2822) into a UTC Unix timestamp.
 */
function parseDate(pubDate) {
  if (!pubDate) return Math.floor(Date.now() / 1000);
  const ms = Date.parse(pubDate);
  return isNaN(ms) ? Math.floor(Date.now() / 1000) : Math.floor(ms / 1000);
}

/**
 * Extract the author username from dc:creator field.
 * Format is usually "/u/username"
 */
function parseAuthor(creator) {
  if (!creator) return "unknown";
  return String(creator).replace(/^\/u\//, "").trim();
}

/**
 * Get the description text from an RSS item.
 * fetchrss wraps content in CDATA.
 */
function parseDescription(desc) {
  if (!desc) return "";
  if (typeof desc === "object") {
    const raw = desc.__cdata || desc["#text"] || "";
    return stripHtml(raw);
  }
  return stripHtml(String(desc));
}

/**
 * Fetch and parse one RSS feed URL into an array of post objects.
 */
async function fetchFeed({ url, subreddit }) {
  const response = await axios.get(url, {
    timeout: 15000,
    headers: { "User-Agent": "GeoComplyMonitor/1.0" },
  });

  const parsed = xmlParser.parse(response.data);
  const channel = parsed?.rss?.channel;
  if (!channel) return [];

  const items = Array.isArray(channel.item)
    ? channel.item
    : channel.item
    ? [channel.item]
    : [];

  return items.map((item) => ({
    id: extractId(item.guid),
    title: String(item.title || "").trim(),
    text: parseDescription(item.description),
    subreddit,
    author: parseAuthor(item["dc:creator"]),
    created_utc: parseDate(item.pubDate),
    url: String(item.link || "").trim(),
    classification: null,
    alert_level: null,
    reason: null,
    analyzed_at: null,
    state: null,
  }));
}

/**
 * Main entry point: fetch all RSS feeds, merge with existing data,
 * deduplicate by post id, persist to Supabase.
 */
async function fetchAndSavePosts() {
  let allNewPosts = [];

  for (const feed of RSS_FEEDS) {
    try {
      const posts = await fetchFeed(feed);
      allNewPosts = allNewPosts.concat(posts);
      console.log(`  Fetched ${posts.length} posts from r/${feed.subreddit}`);
    } catch (err) {
      console.warn(
        `  Warning: Could not fetch r/${feed.subreddit} – ${err.message}`
      );
    }
  }

  // Get existing IDs so we don't overwrite classifications
  const incomingIds = allNewPosts.map((p) => p.id);
  const { data: existingRows } = await supabase
    .from("reddit_posts")
    .select("id")
    .in("id", incomingIds);

  const existingIds = new Set((existingRows || []).map((r) => r.id));
  const newOnly = allNewPosts.filter((p) => !existingIds.has(p.id));

  if (newOnly.length > 0) {
    const { error } = await supabase.from("reddit_posts").insert(newOnly);
    if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  }

  const { count } = await supabase
    .from("reddit_posts")
    .select("*", { count: "exact", head: true });

  return {
    total: count || 0,
    new_posts: newOnly.length,
    subreddits: RSS_FEEDS.map((f) => f.subreddit),
  };
}

/**
 * Read all stored posts from Supabase, ordered by newest first.
 */
async function readPosts() {
  const { data, error } = await supabase
    .from("reddit_posts")
    .select("*")
    .order("created_utc", { ascending: false });

  if (error) throw new Error(`Supabase read failed: ${error.message}`);
  return data || [];
}

/**
 * Persist an updated posts array to Supabase (upsert by id).
 */
async function savePosts(posts) {
  if (posts.length === 0) {
    const { error } = await supabase
      .from("reddit_posts")
      .delete()
      .neq("id", "");
    if (error) throw new Error(`Supabase clear failed: ${error.message}`);
    return;
  }

  const { error } = await supabase
    .from("reddit_posts")
    .upsert(posts, { onConflict: "id" });

  if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
}

module.exports = { fetchAndSavePosts, readPosts, savePosts };
