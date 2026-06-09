import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  leads: defineTable({
    // Contact info
    fullName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    businessType: v.optional(v.string()),
    requirements: v.optional(v.string()),

    // Source & status
    source: v.string(),
    status: v.union(
      v.literal("new"),
      v.literal("qualified"),
      v.literal("nurturing"),
      v.literal("hot"),
      v.literal("meeting_booked"),
      v.literal("converted"),
      v.literal("lost")
    ),
    leadScore: v.number(),
    leadTag: v.union(
      v.literal("hot"),
      v.literal("warm"),
      v.literal("cold")
    ),

    // Qualification answers
    monthlyBudget: v.optional(v.string()),
    timeline: v.optional(v.string()),
    triedBefore: v.optional(v.string()),
    successVision: v.optional(v.string()),

    // Qualification progress
    qualificationStep: v.optional(v.number()),
    qualificationComplete: v.optional(v.boolean()),

    // AI context
    lastAiMessage: v.optional(v.string()),
    lastActivityAt: v.number(),
    conversationHistory: v.optional(v.array(v.object({
      role: v.union(v.literal("ai"), v.literal("lead"), v.literal("system")),
      content: v.string(),
      timestamp: v.number(),
    }))),

    // Follow-up tracking
    followUpSequence: v.optional(v.string()),
    followUpStep: v.optional(v.number()),
    nextFollowUpAt: v.optional(v.number()),
    followUpCount: v.optional(v.number()),

    // Calendar / booking
    meetingScheduled: v.optional(v.boolean()),
    meetingTime: v.optional(v.string()),
    calendarLink: v.optional(v.string()),

    // Objection handling
    objectionRaised: v.optional(v.string()),
    objectionHandled: v.optional(v.boolean()),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_tag", ["leadTag"])
    .index("by_lastActivity", ["lastActivityAt"]),

  // Business settings
  settings: defineTable({
    businessName: v.string(),
    businessEmail: v.string(),
    calendarLink: v.optional(v.string()),
    welcomeEmailTemplate: v.optional(v.string()),
    dailyDigest: v.optional(v.boolean()),
    aiModel: v.optional(v.string()),
    openAiKey: v.optional(v.string()),
    emailApiKey: v.optional(v.string()),
  }).index("by_name", ["businessName"]),
});