import React, { useState, useEffect, useCallback } from "react";
import { getPosts, fetchRedditPosts, analyzeWithAI, getStats } from "./api";
import KpiCards from "./components/KpiCards";
import PostsTable from "./components/PostsTable";
import Filters from "./components/Filters";
import UsMap from "./components/UsMap";
import ActionButtons from "./components/ActionButtons";
import Toast from "./components/Toast";

const SUBREDDITS = [
  "onlinegambling",
  "sportsbetting",
  "poker",
  "gamblingaddiction",
  "sportsbook",
];

const CLASSIFICATIONS = [
  "Geolocation error",
  "App bug",
  "User confusion",
  "Other not relevant",
];

const ALERT_LEVELS = ["HIGH", "MEDIUM", "LOW"];

export default function App() {
  const [posts, setPosts]   = useState([]);
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState({ fetch: false, analyze: false, refresh: false });
  const [toast, setToast]   = useState(null);
  const [filters, setFilters] = useState({
    subreddit: "", classification: "", alert_level: "", search: "",
  });

  // Theme — default dark, persisted in localStorage
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("gc-theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    localStorage.setItem("gc-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [postsRes, statsRes] = await Promise.all([getPosts(), getStats()]);
      setPosts(postsRes.posts || []);
      setStats(statsRes.stats || null);
    } catch {
      showToast("Failed to load data from server. Is the backend running?", "error");
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFetch = async () => {
    setLoading((l) => ({ ...l, fetch: true }));
    try {
      const result = await fetchRedditPosts();
      showToast(`Fetched ${result.new_posts} new posts from ${SUBREDDITS.length} subreddits.`, "success");
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.error || "Reddit fetch failed. Check your API credentials.", "error");
    } finally {
      setLoading((l) => ({ ...l, fetch: false }));
    }
  };

  const handleAnalyze = async () => {
    setLoading((l) => ({ ...l, analyze: true }));
    try {
      const result = await analyzeWithAI();
      showToast(result.message || "Analysis complete.", "success");
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.error || "AI analysis failed. Check your OpenAI API key.", "error");
    } finally {
      setLoading((l) => ({ ...l, analyze: false }));
    }
  };

  const handleRefresh = async () => {
    setLoading((l) => ({ ...l, refresh: true }));
    try {
      await loadData();
      showToast("Dashboard refreshed.", "info");
    } finally {
      setLoading((l) => ({ ...l, refresh: false }));
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (filters.subreddit && post.subreddit !== filters.subreddit) return false;
    if (filters.classification && post.classification !== filters.classification) return false;
    if (filters.alert_level && post.alert_level !== filters.alert_level) return false;
    if (
      filters.search &&
      !post.title.toLowerCase().includes(filters.search.toLowerCase()) &&
      !post.text?.toLowerCase().includes(filters.search.toLowerCase())
    ) return false;
    return true;
  });

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {/* GeoComply brand top stripe */}
        <div className="h-1 bg-gc-orange" />

        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4">
          <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gc-blue flex items-center justify-center text-white font-extrabold text-sm tracking-tight select-none">
                GC
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">GeoComply iGaming Monitor</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Reddit intelligence dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                <span className="w-2 h-2 rounded-full bg-gc-orange animate-pulse inline-block" />
                {stats ? `${stats.total_posts} posts tracked` : "Loading..."}
              </div>

              {/* Theme toggle */}
              <button
                onClick={() => setIsDark((d) => !d)}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="p-2 rounded-lg border border-gray-200 dark:border-slate-700
                  bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700
                  text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
              >
                {isDark ? (
                  /* Sun icon */
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                ) : (
                  /* Moon icon */
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
          <ActionButtons loading={loading} onFetch={handleFetch} onAnalyze={handleAnalyze} onRefresh={handleRefresh} />
          <KpiCards stats={stats} />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2"><UsMap posts={posts} /></div>
            <div>
              <Filters
                filters={filters}
                setFilters={setFilters}
                subreddits={SUBREDDITS}
                classifications={CLASSIFICATIONS}
                alertLevels={ALERT_LEVELS}
                resultCount={filteredPosts.length}
                totalCount={posts.length}
              />
            </div>
          </div>
          <PostsTable posts={filteredPosts} />
        </main>

        {toast && <Toast message={toast.message} type={toast.type} />}
      </div>
    </div>
  );
}
