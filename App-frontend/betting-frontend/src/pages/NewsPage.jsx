import React, { useState } from "react";
import { motion } from "framer-motion";

const NEWS_CATEGORIES = ["All", "Markets", "Sports", "Politics", "Technology", "Finance"];

// Sample news data (will be replaced with API calls)
const SAMPLE_NEWS = [
  {
    id: 1,
    title: "Major Sports Championship Betting Opens",
    excerpt: "New prediction markets now available for the upcoming championship season with record-breaking liquidity.",
    category: "Sports",
    author: "Sarah Johnson",
    date: "2026-01-22",
    image: "🏆",
    readTime: "3 min read",
    featured: true,
  },
  {
    id: 2,
    title: "Election Markets See Unprecedented Volume",
    excerpt: "Political prediction markets are experiencing all-time high trading volumes as primary season heats up.",
    category: "Politics",
    author: "Michael Chen",
    date: "2026-01-21",
    image: "🗳️",
    readTime: "5 min read",
    featured: true,
  },
  {
    id: 3,
    title: "Tech Sector Predictions Surge",
    excerpt: "AI and cryptocurrency markets dominate technology sector trading this week with major announcements expected.",
    category: "Technology",
    author: "Emily Rodriguez",
    date: "2026-01-20",
    image: "💻",
    readTime: "4 min read",
    featured: false,
  },
  {
    id: 4,
    title: "New Market Categories Launched",
    excerpt: "Pryzm introduces entertainment and cultural event prediction markets following user demand.",
    category: "Markets",
    author: "David Park",
    date: "2026-01-19",
    image: "📊",
    readTime: "2 min read",
    featured: false,
  },
  {
    id: 5,
    title: "Q1 Economic Indicators Drive Trading",
    excerpt: "Financial markets react to latest economic data with increased activity in recession prediction contracts.",
    category: "Finance",
    author: "Jennifer Adams",
    date: "2026-01-18",
    image: "💰",
    readTime: "6 min read",
    featured: false,
  },
  {
    id: 6,
    title: "Platform Reaches 100K Active Traders",
    excerpt: "Pryzm celebrates milestone achievement with special promotions and enhanced features for the community.",
    category: "Markets",
    author: "Alex Thompson",
    date: "2026-01-17",
    image: "🎉",
    readTime: "3 min read",
    featured: false,
  },
];

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter news by category and search
  const filteredNews = SAMPLE_NEWS.filter((article) => {
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredArticles = filteredNews.filter((article) => article.featured);
  const regularArticles = filteredNews.filter((article) => !article.featured);

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            News & Updates
          </h1>
          <p className="text-slate-400">
            Stay informed with the latest market insights and platform updates
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent backdrop-blur-sm"
            />
          </div>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 flex flex-wrap gap-2"
        >
          {NEWS_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === category
                  ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/30"
                  : "bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-amber-400 border border-slate-700"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-amber-500">⭐</span>
              Featured Stories
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredArticles.map((article, idx) => (
                <motion.article
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="group rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm p-6 hover:border-amber-500/50 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 flex items-center justify-center text-3xl border border-amber-500/30">
                      {article.image}
                    </div>
                    <div className="flex-1">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
                        {article.category}
                      </span>
                      <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors mb-2">
                        {article.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-slate-400 mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-3">
                      <span>{article.author}</span>
                      <span>•</span>
                      <span>{new Date(article.date).toLocaleDateString()}</span>
                    </div>
                    <span>{article.readTime}</span>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        )}

        {/* Regular Articles */}
        {regularArticles.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Latest Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularArticles.map((article, idx) => (
                <motion.article
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="group rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                    {article.image}
                  </div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 mb-3">
                    {article.category}
                  </span>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors mb-3">
                    {article.title}
                  </h3>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{article.author}</span>
                    <span>{article.readTime}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-2">
                    {new Date(article.date).toLocaleDateString()}
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredNews.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-12 text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Articles Found</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
