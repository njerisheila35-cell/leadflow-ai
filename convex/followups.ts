import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { api } from "./_generated/api";

// Schedule follow-ups for a lead based on their tag
export const scheduleFollowUps = action({
  args: {
    leadId: v.id("leads"),
    tag: v.union(v.literal("hot"), v.literal("warm"), v.literal("cold")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const intervals: number[] = [];

    switch (args.tag) {
      case "hot":
        // Every 24 hours for 3 days
        intervals.push(now + 24 * 60 * 60 * 1000);
        intervals.push(now + 48 * 60 * 60 * 1000);
        intervals.push(now + 72 * 60 * 60 * 1000);
        break;
      case "warm":
        // Day 1, 3, 7
        intervals.push(now + 1 * 24 * 60 * 60 * 1000);
        intervals.push(now + 3 * 24 * 60 * 60 * 1000);
        intervals.push(now + 7 * 24 * 60 * 60 * 1000);
        break;
      case "cold":
        // Day 7, 14, 30
        intervals.push(now + 7 * 24 * 60 * 60 * 1000);
        intervals.push(now + 14 * 24 * 60 * 60 * 1000);
        intervals.push(now + 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Store the follow-up schedule in the lead record
    await ctx.runMutation(api.leads.updateFollowUp, {
      id: args.leadId,
      sequence: args.tag,
      step: 0,
      nextAt: intervals[0] || now,
      count: intervals.length,
    });

    return { intervals };
  },
});

// Get leads that need follow-ups (called by cron)
export const getLeadsNeedingFollowUp = query({
  handler: async (ctx) => {
    const now = Date.now();
    const leads = await ctx.db.query("leads").collect();

    return leads.filter((lead) => {
      // Only leads that have completed qualification or are in nurturing
      if (lead.status === "lost" || lead.status === "converted" || lead.status === "meeting_booked") {
        return false;
      }

      // Check if it's time for next follow-up
      if (lead.nextFollowUpAt && lead.nextFollowUpAt <= now) {
        // Check if we haven't exceeded the max follow-ups
        const maxSteps = lead.followUpCount || 3;
        if ((lead.followUpStep || 0) < maxSteps) {
          return true;
        }
      }

      return false;
    });
  },
});

// Process follow-up for a lead
export const processFollowUp = action({
  args: {
    leadId: v.id("leads"),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.runQuery(api.leads.getLead, { id: args.leadId });
    if (!lead) throw new Error("Lead not found");

    const currentStep = lead.followUpStep || 0;
    const sequence = (lead.followUpSequence || "warm") as "hot" | "warm" | "cold";

    // Generate the follow-up message
    const followUpResult = await ctx.runAction(api.ai.generateFollowUp, {
      leadId: args.leadId,
      type: sequence,
      step: currentStep,
    });

    // Calculate next follow-up time
    const now = Date.now();
    let nextInterval: number;

    switch (sequence) {
      case "hot":
        nextInterval = now + 24 * 60 * 60 * 1000;
        break;
      case "warm":
        const warmIntervals = [1, 3, 7];
        const nextWarmStep = currentStep + 1;
        nextInterval = now + (warmIntervals[nextWarmStep] || warmIntervals[warmIntervals.length - 1]) * 24 * 60 * 60 * 1000;
        break;
      case "cold":
        const coldIntervals = [7, 14, 30];
        const nextColdStep = currentStep + 1;
        nextInterval = now + (coldIntervals[nextColdStep] || coldIntervals[coldIntervals.length - 1]) * 24 * 60 * 60 * 1000;
        break;
      default:
        nextInterval = now + 7 * 24 * 60 * 60 * 1000;
    }

    // Update follow-up progress
    await ctx.runMutation(api.leads.updateFollowUp, {
      id: args.leadId,
      sequence,
      step: currentStep + 1,
      nextAt: nextInterval,
      count: lead.followUpCount || 3,
    });

    // If this was the last hot follow-up (step 3+), flag for human review
    if (sequence === "hot" && currentStep >= 2) {
      await ctx.runMutation(api.leads.addConversation, {
        id: args.leadId,
        role: "system",
        content: "⚠️ Hot lead has not responded after 3 follow-ups. Flagged for human review.",
      });
    }

    return { success: true, step: currentStep + 1 };
  },
});