import React from "react";
import { motion } from "framer-motion";

export default function TournamentsPage() {
  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-16 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/20 border border-amber-500/30 mb-6">
          <svg
            className="w-10 h-10 text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Still in Development
        </h1>
        <p className="text-lg text-slate-400 max-w-md mx-auto">
          The Tournaments feature is currently under construction. We're working hard to bring you an amazing experience. Check back soon!
        </p>
      </motion.div>
    </div>
  );
}
