import React, { useState } from "react";

const ALERT_STYLES = {
  HIGH:   "bg-gc-orange/20 text-gc-orange border border-gc-orange/30",
  MEDIUM: "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30",
  LOW:    "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
};

const CLASS_STYLES = {
  "Geolocation error":  "bg-gc-blue/20 text-gc-blue",
  "App bug":            "bg-gc-blue/10 text-gc-blue/80",
  "User confusion":     "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  "Other not relevant": "bg-slate-200 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400",
};

const PAGE_SIZE = 20;

export default function PostsTable({ posts }) {
  const [page, setPage]         = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  const totalPages = Math.ceil(posts.length / PAGE_SIZE);
  const paginated  = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatDate = (utc) => {
    if (!utc) return "—";
    return new Date(utc * 1000).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Reddit Posts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {posts.length} posts matching current filters
          </p>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 rounded border border-gray-300 dark:border-slate-700
                hover:border-gray-400 dark:hover:border-slate-500 disabled:opacity-40 cursor-pointer"
            >
              ‹
            </button>
            <span>{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2 py-1 rounded border border-gray-300 dark:border-slate-700
                hover:border-gray-400 dark:hover:border-slate-500 disabled:opacity-40 cursor-pointer"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-3">📭</div>
          <p className="font-medium">No posts found</p>
          <p className="text-sm mt-1">Try fetching Reddit posts or adjusting your filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/2">
                  Post
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Subreddit
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Classification
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Alert
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Link
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
              {paginated.map((post) => (
                <React.Fragment key={post.id}>
                  <tr
                    onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white line-clamp-2 text-sm leading-snug">
                        {post.title}
                      </div>
                      {post.author && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          u/{post.author}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        r/{post.subreddit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {post.classification ? (
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${CLASS_STYLES[post.classification] || "bg-gray-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>
                          {post.classification}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-600 italic">Unanalyzed</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {post.alert_level ? (
                        <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${ALERT_STYLES[post.alert_level] || ""}`}>
                          {post.alert_level}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(post.created_utc)}
                    </td>
                    <td className="px-4 py-3">
                      {post.state ? (
                        <span className="text-xs font-mono font-semibold bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                          {post.state}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-gc-blue hover:text-gc-blue/70 underline"
                      >
                        View ↗
                      </a>
                    </td>
                  </tr>

                  {expandedId === post.id && post.reason && (
                    <tr className="bg-gray-50 dark:bg-slate-800/30">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span className="text-gc-orange text-sm mt-0.5">🤖</span>
                          <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                              AI Analysis Reason
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{post.reason}</p>
                            {post.text && (
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-3">
                                {post.text}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
