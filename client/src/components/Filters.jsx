import React from "react";

export default function Filters({
  filters,
  setFilters,
  subreddits,
  classifications,
  alertLevels,
  resultCount,
  totalCount,
}) {
  const update = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const clearAll = () =>
    setFilters((prev) => ({ ...prev, subreddit: "", classification: "", alert_level: "" }));

  const hasActiveFilters = [filters.subreddit, filters.classification, filters.alert_level].some((v) => v !== "");

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Subreddit */}
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Subreddit</label>
        <select
          value={filters.subreddit}
          onChange={(e) => update("subreddit", e.target.value)}
          className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700
            rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200
            focus:outline-none focus:border-gc-blue"
        >
          <option value="">All subreddits</option>
          {subreddits.map((s) => (
            <option key={s} value={s}>r/{s}</option>
          ))}
        </select>
      </div>

      {/* Classification */}
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Classification</label>
        <select
          value={filters.classification}
          onChange={(e) => update("classification", e.target.value)}
          className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700
            rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200
            focus:outline-none focus:border-gc-blue"
        >
          <option value="">All categories</option>
          {classifications.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Alert Level */}
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Alert Level</label>
        <div className="flex gap-2">
          {["", ...alertLevels].map((level) => {
            const colors = {
              "":     "border-gray-300 dark:border-slate-600 text-slate-500 dark:text-slate-400",
              HIGH:   "border-gc-orange/50 text-gc-orange",
              MEDIUM: "border-amber-500/50 text-amber-600 dark:text-amber-400",
              LOW:    "border-emerald-500/50 text-emerald-600 dark:text-emerald-400",
            };
            const active = {
              "":     "bg-gray-200 dark:bg-slate-700",
              HIGH:   "bg-gc-orange/20",
              MEDIUM: "bg-amber-500/20",
              LOW:    "bg-emerald-500/20",
            };
            const isActive = filters.alert_level === level;
            return (
              <button
                key={level}
                onClick={() => update("alert_level", level)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-medium cursor-pointer
                  ${colors[level]}
                  ${isActive ? active[level] : "bg-transparent hover:bg-gray-100 dark:hover:bg-slate-800"}
                `}
              >
                {level || "All"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div className="mt-auto pt-3 border-t border-gray-200 dark:border-slate-800 text-xs text-slate-500">
        Showing{" "}
        <span className="text-slate-700 dark:text-slate-300 font-medium">{resultCount}</span> of{" "}
        <span className="text-slate-700 dark:text-slate-300 font-medium">{totalCount}</span> posts
      </div>
    </div>
  );
}
