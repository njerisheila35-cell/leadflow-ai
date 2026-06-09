"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Bot,
  MessageSquare,
  Calendar,
  Send,
  Zap,
  User,
  Clock,
  TrendingUp,
} from "lucide-react";

export default function LeadDetail() {
  const params = useParams();
  const router = useRouter();
  const lead: any = useQuery(api.leads.getLead, {
    id: params.id as string,
  });
  const updateStatus = useMutation(api.leads.manualOverride);
  const addConversation = useMutation(api.leads.addConversation);

  const [newMessage, setNewMessage] = useState("");
  const [editScore, setEditScore] = useState(false);
  const [scoreValue, setScoreValue] = useState(0);
  const [scoreTag, setScoreTag] = useState<"hot" | "warm" | "cold">("cold");
  const [editStatus, setEditStatus] = useState(false);
  const [statusValue, setStatusValue] = useState("new");
  const [sending, setSending] = useState(false);

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading lead...</p>
        </div>
      </div>
    );
  }

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-amber-600";
    return "text-gray-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-50 border-green-200";
    if (score >= 50) return "bg-amber-50 border-amber-200";
    return "bg-gray-50 border-gray-200";
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "hot": return "bg-red-500";
      case "warm": return "bg-amber-500";
      case "cold": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await addConversation({
        id: params.id as string,
        role: "ai",
        content: newMessage.trim(),
      });
      toast.success("Message sent to lead");
      setNewMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleOverride = async () => {
    try {
      await updateStatus({
        id: params.id as string,
        score: scoreValue,
        tag: scoreTag,
        status: statusValue as any,
      });
      toast.success("Lead updated successfully");
      setEditScore(false);
      setEditStatus(false);
    } catch (error) {
      toast.error("Failed to update lead");
    }
  };

  const history = lead.conversationHistory || [];
  const scoreBarWidth = Math.min(lead.leadScore, 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {lead.fullName}
              </h1>
              <p className="text-sm text-gray-500">{lead.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${getTagColor(lead.leadTag)}`}
            />
            <span className="text-sm font-medium text-gray-600 capitalize">
              {lead.leadTag}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Conversation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Conversation History */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Conversation History
                </h2>
                <span className="text-xs text-gray-400 ml-auto">
                  {history.length} messages
                </span>
              </div>

              <div className="max-h-[500px] overflow-y-auto p-4 space-y-4">
                {history.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No conversation yet
                  </p>
                )}
                {history.map((msg: any, i: number) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "lead" ? "justify-end" : msg.role === "ai" ? "justify-start" : "justify-center"
                    }`}
                  >
                    {msg.role === "system" ? (
                      <div className="bg-gray-100 text-gray-500 text-xs rounded-lg px-3 py-2 italic max-w-[90%] text-center">
                        {msg.content}
                      </div>
                    ) : (
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                          msg.role === "lead"
                            ? "bg-purple-600 text-white rounded-br-md"
                            : msg.role === "ai"
                            ? "bg-white text-gray-700 border border-gray-100 rounded-bl-md shadow-sm"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {msg.role === "ai" && (
                            <Bot className="w-3 h-3 text-purple-500" />
                          )}
                          {msg.role === "lead" && (
                            <User className="w-3 h-3 text-white/70" />
                          )}
                          <span className="text-[10px] opacity-60">
                            {formatDate(msg.timestamp)}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Manual message input */}
              <div className="border-t border-gray-100 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Send a manual message to this lead..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Lead Info */}
          <div className="space-y-6">
            {/* Score Card */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Lead Score
              </h3>
              <div className="text-center mb-4">
                <div
                  className={`text-4xl font-bold ${getScoreColor(
                    lead.leadScore
                  )}`}
                >
                  {lead.leadScore}
                </div>
                <span
                  className={`inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full ${
                    lead.leadTag === "hot"
                      ? "bg-red-100 text-red-700"
                      : lead.leadTag === "warm"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {lead.leadTag.toUpperCase()}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    lead.leadScore >= 80
                      ? "bg-green-500"
                      : lead.leadScore >= 50
                      ? "bg-amber-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${scoreBarWidth}%` }}
                />
              </div>

              {/* Score Override */}
              <button
                onClick={() => {
                  setEditScore(!editScore);
                  setScoreValue(lead.leadScore);
                  setScoreTag(lead.leadTag);
                }}
                className="mt-4 text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                {editScore ? "Cancel" : "Override Score"}
              </button>

              {editScore && (
                <div className="mt-3 space-y-2">
                  <input
                    type="number"
                    value={scoreValue}
                    onChange={(e) => setScoreValue(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  <select
                    value={scoreTag}
                    onChange={(e) =>
                      setScoreTag(e.target.value as "hot" | "warm" | "cold")
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="hot">Hot</option>
                    <option value="warm">Warm</option>
                    <option value="cold">Cold</option>
                  </select>
                  <button
                    onClick={handleOverride}
                    className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    Update Score
                  </button>
                </div>
              )}
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Status
              </h3>
              <span
                className={`inline-block px-3 py-1.5 text-sm font-medium rounded-full ${
                  lead.status === "new"
                    ? "bg-purple-100 text-purple-700"
                    : lead.status === "qualified"
                    ? "bg-green-100 text-green-700"
                    : lead.status === "nurturing"
                    ? "bg-blue-100 text-blue-700"
                    : lead.status === "hot"
                    ? "bg-red-100 text-red-700"
                    : lead.status === "meeting_booked"
                    ? "bg-emerald-100 text-emerald-700"
                    : lead.status === "converted"
                    ? "bg-teal-100 text-teal-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {lead.status.replace("_", " ")}
              </span>

              <button
                onClick={() => setEditStatus(!editStatus)}
                className="mt-3 text-xs text-purple-600 hover:text-purple-700 font-medium block"
              >
                {editStatus ? "Cancel" : "Change Status"}
              </button>

              {editStatus && (
                <div className="mt-3 space-y-2">
                  <select
                    value={statusValue}
                    onChange={(e) => setStatusValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    {[
                      "new",
                      "qualified",
                      "nurturing",
                      "hot",
                      "meeting_booked",
                      "converted",
                      "lost",
                    ].map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleOverride}
                    className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    Update Status
                  </button>
                </div>
              )}
            </div>

            {/* Details Card */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Lead Details
              </h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Phone", value: lead.phone || "—" },
                  { label: "Business", value: lead.businessType || "—" },
                  { label: "Source", value: lead.source },
                  {
                    label: "Created",
                    value: formatDate(lead.createdAt),
                  },
                  {
                    label: "Last Active",
                    value: formatDate(lead.lastActivityAt),
                  },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="text-gray-900 font-medium">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Qualification Answers */}
            {(lead.monthlyBudget ||
              lead.timeline ||
              lead.triedBefore ||
              lead.successVision) && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Qualification Answers
                </h3>
                <div className="space-y-3 text-sm">
                  {lead.monthlyBudget && (
                    <div>
                      <p className="text-gray-500 text-xs">Monthly Budget</p>
                      <p className="text-gray-900 font-medium">
                        {lead.monthlyBudget}
                      </p>
                    </div>
                  )}
                  {lead.timeline && (
                    <div>
                      <p className="text-gray-500 text-xs">Timeline</p>
                      <p className="text-gray-900 font-medium">
                        {lead.timeline}
                      </p>
                    </div>
                  )}
                  {lead.triedBefore && (
                    <div>
                      <p className="text-gray-500 text-xs">
                        Previous Experience
                      </p>
                      <p className="text-gray-900">{lead.triedBefore}</p>
                    </div>
                  )}
                  {lead.successVision && (
                    <div>
                      <p className="text-gray-500 text-xs">90-Day Vision</p>
                      <p className="text-gray-900">{lead.successVision}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Meeting Info */}
            {lead.meetingScheduled && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-emerald-900">
                    Meeting Booked
                  </h3>
                </div>
                {lead.meetingTime && (
                  <p className="text-sm text-emerald-700">
                    {formatDate(new Date(lead.meetingTime).getTime())}
                  </p>
                )}
                {lead.calendarLink && (
                  <a
                    href={lead.calendarLink}
                    target="_blank"
                    className="mt-2 inline-block text-sm text-emerald-600 underline"
                  >
                    View calendar →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}