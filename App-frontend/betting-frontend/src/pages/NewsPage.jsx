import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["FINANCE", "TECHNOLOGY", "SPORTS", "POLITICS"];
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "https://api.pryzm.ca" : "http://localhost:8080");

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState("FINANCE");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE}/api/v1/news/${category}`);
        if (!response.ok) {
          throw new Error(`News request failed (${response.status})`);
        }
        const data = await response.json();
        setArticles(data.articles || []);
      } catch (error) {
        console.error("Error fetching news:", error);
        setError(error?.message || "Unable to load news right now.");
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [category]);

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Market News</h1>

          {/* Category Chips */}
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  category === cat
                    ? "bg-amber-500 text-black"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* News Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div>
          </div>
        ) : error ? (
          <div className="text-center bg-slate-900 border border-rose-500/40 text-rose-300 rounded-xl p-6">
            <p className="font-semibold">Could not load news</p>
            <p className="text-sm mt-2">{error}</p>
            <p className="text-xs text-slate-400 mt-3">
              Check that the backend API is running and reachable at {API_BASE}.
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {articles.map((article, index) => (
                <motion.a
                  key={article.url}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={article.urlToImage || 'https://via.placeholder.com/400x225?text=Pryzm+News'}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                        {article.source.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-slate-400 text-sm line-clamp-3">
                      {article.description}
                    </p>
                  </div>
                </motion.a>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}