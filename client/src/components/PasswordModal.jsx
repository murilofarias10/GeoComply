import React, { useEffect, useRef, useState } from "react";

const ACTION_LABELS = {
  fetch:   { title: "Fetch Reddit Posts", color: "blue",   icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )},
  analyze: { title: "Analyze with AI",    color: "orange", icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )},
};

const CONFIRM_STYLES = {
  blue:   "bg-gc-blue hover:bg-gc-blue/80 disabled:bg-gc-blue/20 disabled:text-gc-blue/40",
  orange: "bg-gc-orange hover:bg-gc-orange/80 disabled:bg-gc-orange/20 disabled:text-gc-orange/40",
};

export default function PasswordModal({ action, onConfirm, onCancel, loading, error }) {
  const [password, setPassword] = useState("");
  const inputRef = useRef(null);
  const meta = ACTION_LABELS[action] ?? ACTION_LABELS.fetch;

  useEffect(() => {
    setPassword("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [action]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password) onConfirm(password);
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
          <div className={`p-2 rounded-lg ${action === "analyze" ? "bg-gc-orange/10 text-gc-orange" : "bg-gc-blue/10 text-gc-blue"}`}>
            {meta.icon}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{meta.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter the password to continue</p>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Password</label>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`w-full bg-gray-50 dark:bg-slate-800 border rounded-lg px-3 py-2.5 text-sm
                text-slate-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600
                focus:outline-none transition-colors
                ${error
                  ? "border-red-500/70 focus:border-red-500"
                  : "border-gray-300 dark:border-slate-700 focus:border-gc-blue"}`}
            />
            {error && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700
                text-sm text-slate-600 dark:text-slate-400
                hover:bg-gray-100 dark:hover:bg-slate-800
                hover:text-slate-800 dark:hover:text-slate-200
                disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!password || loading}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white
                flex items-center justify-center gap-2
                cursor-pointer disabled:cursor-not-allowed transition-colors
                ${CONFIRM_STYLES[meta.color]}`}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying...
                </>
              ) : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
