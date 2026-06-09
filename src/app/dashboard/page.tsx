"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import {
  Zap,
  TrendingUp,
  Calendar,
  Users,
  Search,
} from "lucide-react";

type Lead = {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  businessType?: string;
  requirements?: string;
  source: string;
  status: string;
  leadScore: number;
  leadTag: string;
  lastActivityAt: number;
  createdAt: number;
  qualificationComplete?: boolean;
  meetingScheduled?: boolean;
};

export default function Dashboard() {
  const router = useRouter();
  const leads = useQuery(api.leads.getAllLeads);
  const stats = useQuery(api.leads.getDashboardStats);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"createdAt" | "leadScore">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filteredLeads = (leads ?? [])
    .filter((l: Lead) => {
      if (filter !== "all" && l.leadTag !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.fullName.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.businessType && l.businessType.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a: Lead, b: Lead) => {
      const dir = sortDir === "desc" ? -1 : 1;
      return (a[sortField] - b[sortField]) * dir;
    });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 50) return "text-amber-600 bg-amber-100";
    return "text-gray-500 bg-gray-100";
  };

  const getTagStyle = (tag: string) => {
    switch (tag) {
      case "hot":
        return "bg-red-100 text-red-700";
      case "warm":
        return "bg-amber-100 text-amber-700";
      case "cold":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      new: "bg-purple-100 text-purple-700",
      qualified: "bg-green-100 text-green-700",
      nurturing: "bg-blue-100 text-blue-700",
      hot: "bg-red-100 text-red-700",
      meeting_booked: "bg-emerald-100 text-emerald-700",
      converted: "bg-teal-100 text-teal-700",
      lost: "bg-gray-100 text-gray-500",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">
              LeadFlow <span className="text-purple-600">AI</span>
            </span>
            <span className="text-sm text-gray-400 ml-2">Dashboard</span>
          </div>
          <a
            href="/"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to Site
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Leads",
              value: stats?.totalLeads ?? 0,
              icon: Users,
              color: "text-purple-600 bg-purple-100",
            },
            {
              label: "Hot This Week",
              value: stats?.hotLeadsThisWeek ?? 0,
              icon: TrendingUp,
              color: "text-red-600 bg-red-100",
            },
            {
              label: "Calls Booked",
              value: stats?.callsBooked ?? 0,
              icon: Calendar,
              color: "text-emerald-600 bg-emerald-100",
            },
            {
              label: "Conversion Rate",
              value: `${stats?.conversionRate ?? 0}%`,
              icon: Zap,
              color: "text-amber-600 bg-amber-100",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Hot Leads", value: stats?.hotLeadsTotal ?? 0, color: "bg-red-500" },
            { label: "Warm Leads", value: stats?.warmLeads ?? 0, color: "bg-amber-500" },
            { label: "Cold Leads", value: stats?.coldLeads ?? 0, color: "bg-blue-500" },
            { label: "New Today", value: stats?.newLeadsToday ?? 0, color: "bg-purple-500" },
            { label: "Qualified Rate", value: `${stats?.qualifiedRate ?? 0}%`, color: "bg-green-500" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-lg border border-gray-100 p-3 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <div>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-sm font-semibold text-gray-900">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Table Header */}
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">All Leads</h2>
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm w-48"
                  />
                </div>
                {/* Filter */}
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                >
                  <option value="all">All Tags</option>
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Score
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tag
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Last Activity
                  </th>
                  <th className="text-right px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                      {leads === undefined
                        ? "Loading leads..."
                        : "No leads found. Share your landing page to start capturing leads!"}
                    </td>
                  </tr>
                )}
                {filteredLeads.map((lead: Lead) => (
                  <tr
                    key={lead._id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/lead/${lead._id}`)}
                  >
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-xs font-semibold text-purple-600">
                          {lead.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {lead.fullName}
                          </p>
                          <p className="text-xs text-gray-500">{lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getScoreColor(
                          lead.leadScore
                        )}`}
                      >
                        {lead.leadScore}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${getTagStyle(
                          lead.leadTag
                        )}`}
                      >
                        {lead.leadTag}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${getStatusStyle(
                          lead.status
                        )}`}
                      >
                        {lead.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-500">
                        {formatDate(lead.lastActivityAt)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/lead/${lead._id}`);
                        }}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              Showing {filteredLeads.length} of {leads?.length ?? 0} leads
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}