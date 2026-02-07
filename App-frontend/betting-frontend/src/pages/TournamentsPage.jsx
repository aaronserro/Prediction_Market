import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const TOURNAMENT_STATUS = ["All", "Upcoming", "Active", "Completed"];

// Sample tournament data (will be replaced with API calls)
const SAMPLE_TOURNAMENTS = [
  {
    id: 1,
    name: "Championship Prediction Challenge",
    description: "Compete to predict the outcomes of major championship events across all sports categories.",
    status: "Active",
    participants: 1247,
    prize: "$10,000",
    startDate: "2026-01-15",
    endDate: "2026-03-15",
    category: "Sports",
    icon: "🏆",
    progress: 35,
    featured: true,
  },
  {
    id: 2,
    name: "Election Season Forecaster",
    description: "Test your political prediction skills across multiple election races and policy outcomes.",
    status: "Active",
    participants: 892,
    prize: "$7,500",
    startDate: "2026-01-01",
    endDate: "2026-04-30",
    category: "Politics",
    icon: "🗳️",
    progress: 48,
    featured: true,
  },
  {
    id: 3,
    name: "Tech Trends Tournament",
    description: "Predict technology sector developments, product launches, and market movements.",
    status: "Upcoming",
    participants: 0,
    prize: "$5,000",
    startDate: "2026-02-01",
    endDate: "2026-05-01",
    category: "Technology",
    icon: "💻",
    progress: 0,
    featured: false,
  },
  {
    id: 4,
    name: "Financial Markets Masters",
    description: "Navigate complex financial predictions including stocks, commodities, and economic indicators.",
    status: "Active",
    participants: 634,
    prize: "$15,000",
    startDate: "2026-01-10",
    endDate: "2026-06-30",
    category: "Finance",
    icon: "💰",
    progress: 22,
    featured: false,
  },
  {
    id: 5,
    name: "Q1 Prediction League",
    description: "General prediction tournament covering diverse topics from entertainment to world events.",
    status: "Completed",
    participants: 2103,
    prize: "$8,000",
    startDate: "2025-10-01",
    endDate: "2025-12-31",
    category: "General",
    icon: "⭐",
    progress: 100,
    featured: false,
  },
  {
    id: 6,
    name: "Summer Sports Spectacular",
    description: "Major summer sporting events prediction competition with weekly prizes.",
    status: "Upcoming",
    participants: 0,
    prize: "$12,000",
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    category: "Sports",
    icon: "🏅",
    progress: 0,
    featured: false,
  },
];

export default function TournamentsPage() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter tournaments
  const filteredTournaments = SAMPLE_TOURNAMENTS.filter((tournament) => {
    const matchesStatus = selectedStatus === "All" || tournament.status === selectedStatus;
    const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tournament.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "Upcoming":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "Completed":
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  };

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
            Tournaments
          </h1>
          <p className="text-slate-400">
            Compete against other traders in organized prediction competitions
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
            <p className="text-sm text-slate-400 mb-1">Active Tournaments</p>
            <p className="text-3xl font-bold text-white">
              {SAMPLE_TOURNAMENTS.filter(t => t.status === "Active").length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
            <p className="text-sm text-slate-400 mb-1">Total Participants</p>
            <p className="text-3xl font-bold text-white">
              {SAMPLE_TOURNAMENTS.reduce((sum, t) => sum + t.participants, 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
            <p className="text-sm text-slate-400 mb-1">Total Prize Pool</p>
            <p className="text-3xl font-bold text-amber-400">
              ${SAMPLE_TOURNAMENTS.reduce((sum, t) => sum + parseInt(t.prize.replace(/[$,]/g, "")), 0).toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
              placeholder="Search tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent backdrop-blur-sm"
            />
          </div>
        </motion.div>

        {/* Status Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 flex flex-wrap gap-2"
        >
          {TOURNAMENT_STATUS.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedStatus === status
                  ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/30"
                  : "bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-amber-400 border border-slate-700"
              }`}
            >
              {status}
            </button>
          ))}
        </motion.div>

        {/* Featured Tournaments */}
        {filteredTournaments.filter(t => t.featured).length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-amber-500">🌟</span>
              Featured Tournaments
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTournaments
                .filter(t => t.featured)
                .map((tournament, idx) => (
                  <motion.div
                    key={tournament.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="group rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900/80 to-slate-900/40 backdrop-blur-sm p-6 hover:border-amber-500/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30">
                        {tournament.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(tournament.status)}`}>
                            {tournament.status}
                          </span>
                          <span className="text-xs text-slate-500">{tournament.category}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                          {tournament.name}
                        </h3>
                      </div>
                    </div>

                    <p className="text-slate-400 mb-4 line-clamp-2">
                      {tournament.description}
                    </p>

                    {tournament.status === "Active" && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>Progress</span>
                          <span>{tournament.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all"
                            style={{ width: `${tournament.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Prize Pool</p>
                        <p className="text-sm font-bold text-amber-400">{tournament.prize}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Participants</p>
                        <p className="text-sm font-bold text-white">{tournament.participants.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Ends</p>
                        <p className="text-sm font-bold text-white">
                          {new Date(tournament.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>

                    <button
                      className={`w-full mt-4 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                        tournament.status === "Active"
                          ? "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20"
                          : tournament.status === "Upcoming"
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                      disabled={tournament.status === "Completed"}
                    >
                      {tournament.status === "Active" ? "Join Tournament" : tournament.status === "Upcoming" ? "Register Interest" : "View Results"}
                    </button>
                  </motion.div>
                ))}
            </div>
          </div>
        )}

        {/* All Tournaments */}
        {filteredTournaments.filter(t => !t.featured).length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">All Tournaments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments
                .filter(t => !t.featured)
                .map((tournament, idx) => (
                  <motion.div
                    key={tournament.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    className="group rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 hover:border-slate-700 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        {tournament.icon}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(tournament.status)}`}>
                        {tournament.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors mb-2">
                      {tournament.name}
                    </h3>

                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                      {tournament.description}
                    </p>

                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Prize:</span>
                        <span className="font-semibold text-amber-400">{tournament.prize}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Participants:</span>
                        <span className="font-semibold text-white">{tournament.participants.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Ends:</span>
                        <span className="font-semibold text-white">
                          {new Date(tournament.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>

                    <button
                      className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        tournament.status === "Active"
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : tournament.status === "Upcoming"
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                      disabled={tournament.status === "Completed"}
                    >
                      {tournament.status === "Active" ? "Join Now" : tournament.status === "Upcoming" ? "Coming Soon" : "Ended"}
                    </button>
                  </motion.div>
                ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredTournaments.length === 0 && (
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
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Tournaments Found</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              Try adjusting your search or filters to find tournaments.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
