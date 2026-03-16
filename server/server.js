require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { fetchAndSavePosts, readPosts, savePosts } = require("./redditService");
const { analyzePosts } = require("./openaiService");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// POST /auth/verify  – Validate action password
// ─────────────────────────────────────────────
app.post("/auth/verify", (req, res) => {
  const { password } = req.body;
  const expected = process.env.PASSWORD_PROTECTION;

  if (!expected) {
    return res.status(500).json({ success: false, error: "Password protection is not configured on the server." });
  }

  if (!password || password !== expected) {
    return res.status(401).json({ success: false, error: "Incorrect password." });
  }

  res.json({ success: true });
});

// ─────────────────────────────────────────────
// GET /posts  – Return all stored posts
// ─────────────────────────────────────────────
app.get("/posts", async (req, res) => {
  try {
    const posts = await readPosts();
    res.json({ success: true, posts, total: posts.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /fetch  – Pull posts from Reddit API
// ─────────────────────────────────────────────
app.post("/fetch", async (req, res) => {
  try {
    console.log("📡 Fetching posts from Reddit...");
    const result = await fetchAndSavePosts();
    console.log(`✅ Saved ${result.total} total posts.`);
    res.json({
      success: true,
      message: `Fetched ${result.new_posts} posts from ${result.subreddits.length} RSS feeds (${result.subreddits.map((s) => "r/" + s).join(", ")}).`,
      total: result.total,
      new_posts: result.new_posts,
    });
  } catch (err) {
    console.error("Reddit fetch error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /analyze  – Classify posts with OpenAI
// ─────────────────────────────────────────────
app.post("/analyze", async (req, res) => {
  try {
    const posts = await readPosts();

    if (posts.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No posts found. Please fetch Reddit posts first.",
      });
    }

    const unanalyzed = posts.filter((p) => !p.classification);
    if (unanalyzed.length === 0) {
      return res.json({
        success: true,
        message: "All posts are already analyzed.",
        stats: { analyzed: 0, skipped: posts.length, total_posts: posts.length },
      });
    }

    console.log(`🤖 Analyzing ${unanalyzed.length} posts with OpenAI...`);

    const { updated, stats } = await analyzePosts(posts, (current, total) => {
      process.stdout.write(`\r  Progress: ${current}/${total}`);
    });

    await savePosts(updated);
    console.log(`\n✅ Analysis complete. ${stats.analyzed} posts classified.`);

    res.json({
      success: true,
      message: `Analyzed ${stats.analyzed} posts successfully.`,
      stats,
    });
  } catch (err) {
    console.error("Analysis error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /stats  – Aggregate KPI data for dashboard
// ─────────────────────────────────────────────
app.get("/stats", async (req, res) => {
  try {
    const posts = await readPosts();

    const stats = {
      total_posts: posts.length,
      geolocation_issues: posts.filter(
        (p) => p.classification === "Geolocation error"
      ).length,
      high_alerts: posts.filter((p) => p.alert_level === "HIGH").length,
      medium_alerts: posts.filter((p) => p.alert_level === "MEDIUM").length,
      low_alerts: posts.filter((p) => p.alert_level === "LOW").length,
      subreddits_monitored: [
        ...new Set(posts.map((p) => p.subreddit)),
      ].length,
      analyzed_posts: posts.filter((p) => p.classification).length,
      unanalyzed_posts: posts.filter((p) => !p.classification).length,
      by_classification: {
        "Geolocation error": posts.filter(
          (p) => p.classification === "Geolocation error"
        ).length,
        "App bug": posts.filter((p) => p.classification === "App bug").length,
        "User confusion": posts.filter(
          (p) => p.classification === "User confusion"
        ).length,
        "Other not relevant": posts.filter(
          (p) => p.classification === "Other not relevant"
        ).length,
      },
    };

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /posts/clear  – Clear all stored posts
// ─────────────────────────────────────────────
app.delete("/posts/clear", async (req, res) => {
  try {
    await savePosts([]);
    res.json({ success: true, message: "All posts cleared." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 GeoComply Reddit Monitor server running on port ${PORT}`);
  console.log(`   http://localhost:${PORT}\n`);
});
