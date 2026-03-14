import React, { useState, useEffect, useCallback } from "react";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function formatDate(utc) {
  return new Date(utc * 1000).toISOString().slice(0, 10);
}

function buildTimeline(posts) {
  const counts = {};
  posts.forEach((p) => {
    if (!p.created_utc) return;
    const d = formatDate(p.created_utc);
    counts[d] = (counts[d] || 0) + 1;
  });
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

/* ─────────────────────────────────────────────
   Modal wrapper
───────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* panel */}
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-700
          bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Subreddits modal content
───────────────────────────────────────────── */
const SUBREDDIT_META = {
  onlinegambling:    { color: "text-purple-400",   bg: "bg-purple-500/10 border-purple-500/30" },
  sportsbetting:     { color: "text-blue-400",     bg: "bg-blue-500/10 border-blue-500/30"   },
  poker:             { color: "text-emerald-400",  bg: "bg-emerald-500/10 border-emerald-500/30" },
  gamblingaddiction: { color: "text-rose-400",     bg: "bg-rose-500/10 border-rose-500/30"   },
  sportsbook:        { color: "text-amber-400",    bg: "bg-amber-500/10 border-amber-500/30" },
};

function SubredditsModal({ subreddits, posts, onClose }) {
  const countBySubreddit = {};
  posts.forEach((p) => {
    if (p.subreddit) countBySubreddit[p.subreddit] = (countBySubreddit[p.subreddit] || 0) + 1;
  });

  return (
    <Modal title="Monitored Subreddits" onClose={onClose}>
      <p className="text-xs text-slate-400 mb-4">
        These are the active Reddit communities being scanned for iGaming intelligence.
      </p>
      <div className="flex flex-col gap-3">
        {subreddits.map((sub) => {
          const meta = SUBREDDIT_META[sub] ?? { icon: "📌", color: "text-slate-400", bg: "bg-slate-700/30 border-slate-600/30" };
          const postCount = countBySubreddit[sub] ?? 0;
          return (
            <div
              key={sub}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${meta.bg}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{meta.icon}</span>
                <div>
                  <div className={`text-sm font-semibold ${meta.color}`}>r/{sub}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    <a
                      href={`https://reddit.com/r/${sub}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline hover:text-slate-300 transition-colors"
                    >
                      reddit.com/r/{sub} ↗
                    </a>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${meta.color}`}>{postCount}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">posts</div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   Posts timeline modal content
───────────────────────────────────────────── */
function TimelineModal({ posts, onClose }) {
  const timeline = buildTimeline(posts);
  const max = Math.max(...timeline.map((d) => d.count), 1);

  return (
    <Modal title="Posts Scanned — Timeline" onClose={onClose}>
      <p className="text-xs text-slate-400 mb-5">
        Total posts fetched per day across all monitored subreddits.
      </p>

      {timeline.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">No data yet.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
          {timeline.map(({ date, count }) => {
            const pct = Math.round((count / max) * 100);
            return (
              <div key={date} className="flex items-center gap-3">
                {/* date label */}
                <span className="w-24 shrink-0 text-xs text-slate-400 font-mono">{date}</span>

                {/* bar */}
                <div className="flex-1 h-6 bg-slate-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-gc-blue/70 rounded transition-all duration-500 flex items-center pl-2"
                    style={{ width: `${Math.max(pct, 4)}%` }}
                  />
                </div>

                {/* count */}
                <span className="w-8 shrink-0 text-right text-xs font-semibold text-gc-blue">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* summary footer */}
      {timeline.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-500">
          <span>{timeline.length} day{timeline.length !== 1 ? "s" : ""} tracked</span>
          <span>
            Peak: <strong className="text-gc-blue">{max}</strong> posts on{" "}
            <strong className="text-slate-300">
              {timeline.find((d) => d.count === max)?.date}
            </strong>
          </span>
        </div>
      )}
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   Card config + colour maps
───────────────────────────────────────────── */
const simpleCards = [
  {
    key: "subreddits_monitored",
    label: "Subreddits Monitored",
    color: "gc-blue",
    description: "Active subreddit channels",
    clickable: true,
  },
  {
    key: "total_posts",
    label: "Total Posts Scanned",
    color: "gc-blue",
    description: "All Reddit posts fetched",
    clickable: true,
  },
  {
    key: "analyzed_posts",
    label: "Analyzed Posts",
    color: "green",
    description: "Posts classified by AI",
    clickable: false,
  },
  {
    key: "unanalyzed_posts",
    label: "Pending Analysis",
    color: "amber",
    description: "Posts awaiting AI review",
    clickable: false,
  },
];

const colorMap = {
  "gc-blue": "border-gc-blue/30 bg-gc-blue/10 text-gc-blue",
  green:     "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber:     "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const valueColorMap = {
  "gc-blue": "text-gc-blue",
  green:     "text-emerald-600 dark:text-emerald-300",
  amber:     "text-amber-600 dark:text-amber-300",
};

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function KpiCards({ stats, posts = [], subreddits = [] }) {
  const [modal, setModal] = useState(null); // "subreddits" | "timeline" | null
  const close = useCallback(() => setModal(null), []);

  const high   = stats?.high_alerts   ?? 0;
  const medium = stats?.medium_alerts ?? 0;
  const low    = stats?.low_alerts    ?? 0;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Subreddits Monitored — position 1 */}
        {[simpleCards[0]].map((card) => (
          <div
            key={card.key}
            onClick={() => setModal("subreddits")}
            className={`rounded-xl border p-4 ${colorMap[card.color]} flex flex-col gap-2
              cursor-pointer hover:brightness-110 hover:scale-[1.02] transition-all duration-150
              group select-none`}
            title="Click to view monitored subreddits"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">{card.icon}</span>
              <svg className="w-3.5 h-3.5 opacity-40 group-hover:opacity-80 transition-opacity"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className={`text-3xl font-bold ${valueColorMap[card.color]}`}>
              {stats ? (stats[card.key] ?? 0).toLocaleString() : "—"}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{card.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{card.description}</div>
            </div>
          </div>
        ))}

        {/* Alerts — combined H / M / L — position 2 */}
        <div className="rounded-xl border p-4 border-gc-orange/30 bg-gc-orange/10 flex flex-col gap-3">


          <div className="grid grid-cols-3 gap-1.5">

            <div className="col-span-3">
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">Alerts</div>
            </div>

            <div className="flex flex-col items-center bg-gc-orange/15 rounded-lg py-2 px-1">
              <span className="text-xl font-bold text-gc-orange leading-none">{high}</span>
              <span className="text-[10px] font-semibold text-gc-orange/70 tracking-widest mt-1.5 uppercase">High</span>
            </div>

            <div className="flex flex-col items-center bg-amber-500/15 rounded-lg py-2 px-1">
              <span className="text-xl font-bold text-amber-500 dark:text-amber-400 leading-none">{medium}</span>
              <span className="text-[10px] font-semibold text-amber-500/70 tracking-widest mt-1.5 uppercase">Med</span>
            </div>

            <div className="flex flex-col items-center bg-emerald-500/15 rounded-lg py-2 px-1">
              <span className="text-xl font-bold text-emerald-500 dark:text-emerald-400 leading-none">{low}</span>
              <span className="text-[10px] font-semibold text-emerald-500/70 tracking-widest mt-1.5 uppercase">Low</span>
            </div>


            </div>
          </div>



        {/* Total Posts — position 3 (clickable) */}
        {[simpleCards[1]].map((card) => (
          <div
            key={card.key}
            onClick={() => setModal("timeline")}
            className={`rounded-xl border p-4 ${colorMap[card.color]} flex flex-col gap-2
              cursor-pointer hover:brightness-110 hover:scale-[1.02] transition-all duration-150
              group select-none`}
            title="Click to view posts timeline"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">{card.icon}</span>
              <svg className="w-3.5 h-3.5 opacity-40 group-hover:opacity-80 transition-opacity"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className={`text-3xl font-bold ${valueColorMap[card.color]}`}>
              {stats ? (stats[card.key] ?? 0).toLocaleString() : "—"}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{card.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{card.description}</div>
            </div>
          </div>
        ))}

        {/* Analyzed Posts + Pending Analysis — positions 4-5 */}
        {simpleCards.slice(2).map((card) => (
          <div
            key={card.key}
            className={`rounded-xl border p-4 ${colorMap[card.color]} flex flex-col gap-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">{card.icon}</span>
            </div>
            <div className={`text-3xl font-bold ${valueColorMap[card.color]}`}>
              {stats ? (stats[card.key] ?? 0).toLocaleString() : "—"}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{card.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{card.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {modal === "subreddits" && (
        <SubredditsModal subreddits={subreddits} posts={posts} onClose={close} />
      )}
      {modal === "timeline" && (
        <TimelineModal posts={posts} onClose={close} />
      )}
    </>
  );
}
