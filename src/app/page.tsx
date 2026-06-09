"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Sparkles,
  Zap,
  MessageSquare,
  CheckCircle2,
  Calendar,
  TrendingUp,
  ArrowRight,
  Bot,
  Send,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Home() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    businessType: "",
    requirements: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { role: "ai" | "user"; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [qualifying, setQualifying] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      toast.error("Please fill in your name and email");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/capture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Something went wrong");
      }

      setLeadId(data.leadId);
      setSubmitted(true);

      // Start chat with welcome message
      setChatMessages([
        {
          role: "ai",
          content:
            data.welcomeMessage ||
            `Hi ${formData.fullName}! Thanks for reaching out. I'd love to learn more about your needs. What's the biggest challenge you're facing with lead follow-up right now?`,
        },
      ]);

      toast.success("Welcome to LeadFlow AI! 🎉");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || !leadId) return;

    const userMessage = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setQualifying(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, message: userMessage }),
      });

      const data = await res.json();

      if (data.success && data.result?.message) {
        setChatMessages((prev) => [
          ...prev,
          { role: "ai", content: data.result.message },
        ]);

        // If qualification complete with high score, show booking link
        if (data.result.type === "qualification_complete" && data.result.tag === "hot") {
          setTimeout(() => {
            setChatMessages((prev) => [
              ...prev,
              {
                role: "ai",
                content:
                  "Would you like to book a quick call to get started? Just let me know! 📅",
              },
            ]);
          }, 1000);
        }
      }
    } catch (error) {
      toast.error("Connection issue. Please try again.");
    } finally {
      setQualifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header / Nav */}
      <header className="border-b border-purple-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">
              LeadFlow <span className="text-purple-600">AI</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-purple-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-purple-600 transition-colors">
              How It Works
            </a>
            <a
              href="/dashboard"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Dashboard
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-purple-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-Powered Lead Activation
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Never Lose a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-800">
                  Lead Again
                </span>
              </h1>

              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                LeadFlow AI instantly engages every lead, qualifies them through
                natural conversation, scores them intelligently, and books sales
                calls — all automatically.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>&lt; 60s response time</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>24/7 autonomous</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>3x more meetings</span>
                </div>
              </div>
            </div>

            {/* Right: Capture Form */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl border border-purple-100 p-8 animate-fade-in">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Get Started Free
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Fill this form and our AI will reach out instantly
                  </p>
                </div>

                {!submitted ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="John Kamau"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+254 712 345 678"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Type
                      </label>
                      <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm bg-white"
                      >
                        <option value="">Select your business type</option>
                        <option value="Retail">Retail</option>
                        <option value="Tech / SaaS">Tech / SaaS</option>
                        <option value="Professional Services">
                          Professional Services
                        </option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                        <option value="Finance">Finance</option>
                        <option value="Hospitality">Hospitality</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        What are you looking for?
                      </label>
                      <textarea
                        name="requirements"
                        value={formData.requirements}
                        onChange={handleChange}
                        placeholder="Tell us about your lead generation needs..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Activating AI Agent...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Activate My AI Agent
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      You're in! 🎉
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Our AI agent is already reaching out below. Say hello!
                    </p>
                    <button
                      onClick={() => setChatOpen(true)}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      Open Chat
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to{" "}
              <span className="text-purple-600">Convert Leads</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From first touch to booked meeting — fully autonomous.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Instant Response",
                desc: "Engage every lead within 60 seconds with a personalized AI conversation.",
              },
              {
                icon: MessageSquare,
                title: "Smart Qualification",
                desc: "Ask qualifying questions naturally and score leads based on their responses.",
              },
              {
                icon: TrendingUp,
                title: "Intelligent Scoring",
                desc: "Hot, Warm, or Cold — know exactly who to prioritize with AI-powered scoring.",
              },
              {
                icon: Calendar,
                title: "Auto-Book Meetings",
                desc: "When a lead is ready, present a calendar link and send confirmations automatically.",
              },
              {
                icon: Bot,
                title: "Objection Handling",
                desc: "AI responds to objections like pricing, timing, and comparisons intelligently.",
              },
              {
                icon: Sparkles,
                title: "Smart Follow-ups",
                desc: "Personalized nurture sequences based on lead score and behavior.",
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className={`bg-white rounded-xl p-6 border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all ${
                  i === 0
                    ? "animate-fade-in"
                    : i === 1
                    ? "animate-fade-in-delay-1"
                    : i === 2
                    ? "animate-fade-in-delay-2"
                    : ""
                }`}
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From lead capture to booked meeting in 4 simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Lead Captures",
                desc: "Your lead fills the form on your website or landing page.",
              },
              {
                step: "02",
                title: "AI Engages",
                desc: "Within 60 seconds, our AI sends a personalized welcome message.",
              },
              {
                step: "03",
                title: "Qualifies & Scores",
                desc: "Natural conversation to qualify and score each lead.",
              },
              {
                step: "04",
                title: "Books Meeting",
                desc: "Hot leads get a calendar link. You just show up.",
              },
            ].map((item, i) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-600">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} LeadFlow AI. All rights reserved.</p>
        </div>
      </footer>

      {/* Chat Widget */}
      {submitted && (
        <div className="fixed bottom-6 right-6 z-50">
          {!chatOpen ? (
            <button
              onClick={() => setChatOpen(true)}
              className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
            >
              <MessageSquare className="w-6 h-6 text-white" />
            </button>
          ) : (
            <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden animate-fade-in">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">
                    LeadFlow AI Assistant
                  </p>
                  <p className="text-white/70 text-xs">Online</p>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Chat Messages */}
              <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === "user"
                          ? "bg-purple-600 text-white rounded-br-md"
                          : "bg-white text-gray-700 border border-gray-100 rounded-bl-md shadow-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {qualifying && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex gap-1.5">
                        <span className="typing-dot" />
                        <span className="typing-dot" style={{ animationDelay: "0.2s" }} />
                        <span className="typing-dot" style={{ animationDelay: "0.4s" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={qualifying || !chatInput.trim()}
                    className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}