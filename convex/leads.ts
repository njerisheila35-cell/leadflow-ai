import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Create a new lead from capture form
export const createLead = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    businessType: v.optional(v.string()),
    requirements: v.optional(v.string()),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("leads", {
      fullName: args.fullName,
      email: args.email,
      phone: args.phone,
      businessType: args.businessType,
      requirements: args.requirements,
      source: args.source,
      status: "new",
      leadScore: 0,
      leadTag: "cold",
      qualificationStep: 0,
      qualificationComplete: false,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
      meetingScheduled: false,
      objectionHandled: false,
      followUpStep: 0,
      followUpCount: 0,
      conversationHistory: [
        {
          role: "system",
          content: `Lead captured via ${args.source}. Name: ${args.fullName}, Business: ${args.businessType || "N/A"}, Requirements: ${args.requirements || "N/A"}`,
          timestamp: now,
        },
      ],
    });
    return id;
  },
});

// Get all leads (for dashboard)
export const getAllLeads = query({
  handler: async (ctx) => {
    const leads = await ctx.db.query("leads").order("desc").collect();
    return leads;
  },
});

// Get lead by ID
export const getLead = query({
  args: { id: v.id("leads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update lead status
export const updateStatus = mutation({
  args: {
    id: v.id("leads"),
    status: v.union(
      v.literal("new"),
      v.literal("qualified"),
      v.literal("nurturing"),
      v.literal("hot"),
      v.literal("meeting_booked"),
      v.literal("converted"),
      v.literal("lost")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Update lead score
export const updateScore = mutation({
  args: {
    id: v.id("leads"),
    score: v.number(),
    tag: v.union(v.literal("hot"), v.literal("warm"), v.literal("cold")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      leadScore: args.score,
      leadTag: args.tag,
      updatedAt: Date.now(),
    });
  },
});

// Manually override lead score/status
export const manualOverride = mutation({
  args: {
    id: v.id("leads"),
    score: v.optional(v.number()),
    tag: v.optional(v.union(v.literal("hot"), v.literal("warm"), v.literal("cold"))),
    status: v.optional(
      v.union(
        v.literal("new"),
        v.literal("qualified"),
        v.literal("nurturing"),
        v.literal("hot"),
        v.literal("meeting_booked"),
        v.literal("converted"),
        v.literal("lost")
      )
    ),
  },
  handler: async (ctx, args) => {
    const patch: any = { updatedAt: Date.now() };
    if (args.score !== undefined) patch.leadScore = args.score;
    if (args.tag !== undefined) patch.leadTag = args.tag;
    if (args.status !== undefined) patch.status = args.status;
    await ctx.db.patch(args.id, patch);
  },
});

// Add conversation to lead history
export const addConversation = mutation({
  args: {
    id: v.id("leads"),
    role: v.union(v.literal("ai"), v.literal("lead"), v.literal("system")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.id);
    if (!lead) throw new Error("Lead not found");

    const history = lead.conversationHistory || [];
    history.push({
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
    });

    await ctx.db.patch(args.id, {
      conversationHistory: history,
      lastAiMessage: args.role === "ai" ? args.content : lead.lastAiMessage,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update qualification progress
export const updateQualification = mutation({
  args: {
    id: v.id("leads"),
    step: v.number(),
    complete: v.boolean(),
    budget: v.optional(v.string()),
    timeline: v.optional(v.string()),
    triedBefore: v.optional(v.string()),
    successVision: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: any = {
      qualificationStep: args.step,
      qualificationComplete: args.complete,
      updatedAt: Date.now(),
    };
    if (args.budget !== undefined) patch.monthlyBudget = args.budget;
    if (args.timeline !== undefined) patch.timeline = args.timeline;
    if (args.triedBefore !== undefined) patch.triedBefore = args.triedBefore;
    if (args.successVision !== undefined) patch.successVision = args.successVision;
    await ctx.db.patch(args.id, patch);
  },
});

// Set meeting booked
export const bookMeeting = mutation({
  args: {
    id: v.id("leads"),
    meetingTime: v.string(),
    calendarLink: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      meetingScheduled: true,
      meetingTime: args.meetingTime,
      calendarLink: args.calendarLink,
      status: "meeting_booked",
      updatedAt: Date.now(),
    });
  },
});

// Update follow-up tracking
export const updateFollowUp = mutation({
  args: {
    id: v.id("leads"),
    sequence: v.string(),
    step: v.number(),
    nextAt: v.number(),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      followUpSequence: args.sequence,
      followUpStep: args.step,
      nextFollowUpAt: args.nextAt,
      followUpCount: args.count,
      updatedAt: Date.now(),
    });
  },
});

// Handle objection
export const handleObjection = mutation({
  args: {
    id: v.id("leads"),
    objection: v.string(),
    handled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      objectionRaised: args.objection,
      objectionHandled: args.handled,
      updatedAt: Date.now(),
    });
  },
});

// Dashboard stats
export const getDashboardStats = query({
  handler: async (ctx) => {
    const allLeads = await ctx.db.query("leads").collect();
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const totalLeads = allLeads.length;
    const hotLeadsThisWeek = allLeads.filter(
      (l) => l.leadTag === "hot" && l.createdAt > oneWeekAgo
    ).length;
    const callsBooked = allLeads.filter((l) => l.status === "meeting_booked").length;
    const qualified = allLeads.filter((l) => l.qualificationComplete).length;
    const conversionRate = totalLeads > 0 ? Math.round((callsBooked / totalLeads) * 100) : 0;
    const hotLeadsTotal = allLeads.filter((l) => l.leadTag === "hot").length;
    const warmLeads = allLeads.filter((l) => l.leadTag === "warm").length;
    const coldLeads = allLeads.filter((l) => l.leadTag === "cold").length;
    const newLeadsToday = allLeads.filter(
      (l) => l.createdAt > now - 24 * 60 * 60 * 1000
    ).length;
    const qualifiedRate = totalLeads > 0 ? Math.round((qualified / totalLeads) * 100) : 0;

    return {
      totalLeads,
      hotLeadsThisWeek,
      callsBooked,
      conversionRate,
      hotLeadsTotal,
      warmLeads,
      coldLeads,
      newLeadsToday,
      qualified,
      qualifiedRate,
    };
  },
});