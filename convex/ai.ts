import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import OpenAI from "openai";

// For local dev, we'll use the OpenAI key from settings
// In production, you'd use a proper API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-placeholder",
});

// Qualification questions to ask
const QUALIFICATION_QUESTIONS = [
  {
    step: 1,
    question: "What is your monthly budget for this solution?",
    options: ["Under $100", "$100 – $500", "Above $500"],
    field: "monthlyBudget",
  },
  {
    step: 2,
    question: "How soon are you looking to get started?",
    options: ["Immediately", "Within a month", "Just exploring"],
    field: "timeline",
  },
  {
    step: 3,
    question: "Have you tried any similar solutions before? If yes, what didn't work?",
    options: [],
    field: "triedBefore",
  },
  {
    step: 4,
    question: "What would success look like for you in 90 days?",
    options: [],
    field: "successVision",
  },
];

// Score a lead based on qualification answers
function calculateLeadScore(lead: {
  monthlyBudget?: string;
  timeline?: string;
  triedBefore?: string;
  successVision?: string;
  requirements?: string;
}): { score: number; tag: "hot" | "warm" | "cold" } {
  let score = 0;

  // Budget scoring
  if (lead.monthlyBudget) {
    if (lead.monthlyBudget.includes("Above $500") || lead.monthlyBudget.includes("Above")) {
      score += 40;
    } else if (lead.monthlyBudget.includes("$100 – $500") || lead.monthlyBudget.includes("100 – 500")) {
      score += 25;
    } else {
      score += 10;
    }
  }

  // Timeline scoring
  if (lead.timeline) {
    if (lead.timeline.includes("Immediately")) {
      score += 35;
    } else if (lead.timeline.includes("Within a month")) {
      score += 25;
    } else {
      score += 5;
    }
  }

  // Pain points scoring (based on quality of answers)
  if (lead.triedBefore && lead.triedBefore.length > 10) {
    score += 15; // Has experience = more engaged
  }
  if (lead.successVision && lead.successVision.length > 15) {
    score += 10; // Clear vision = higher intent
  }
  if (lead.requirements && lead.requirements.length > 20) {
    score += 10; // Detailed requirements = serious
  }

  // Cap at 100
  score = Math.min(score, 100);

  // Determine tag
  let tag: "hot" | "warm" | "cold";
  if (score >= 80) tag = "hot";
  else if (score >= 50) tag = "warm";
  else tag = "cold";

  return { score, tag };
}

// Generate AI welcome email
export const generateWelcomeMessage = action({
  args: {
    leadId: v.id("leads"),
    fullName: v.string(),
    businessType: v.optional(v.string()),
    requirements: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const prompt = `Write a warm, human-sounding welcome email from LeadFlow AI to ${args.fullName}${
        args.businessType ? ` who runs a ${args.businessType} business` : ""
      }.${
        args.requirements
          ? ` They mentioned they're looking for: "${args.requirements}".`
          : ""
      }

The email should:
- Feel personal and warm, not robotic
- Be concise (3-4 short paragraphs max)
- Welcome them to LeadFlow AI
- Mention we help businesses automate lead follow-up
- Ask them to reply with their biggest challenge
- Sign off warmly from "The LeadFlow AI Team"

Return ONLY the email body text, no subject line, no JSON.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a warm, professional sales assistant. Write in a natural, human tone." },
          { role: "user", content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.8,
      });

      const message = response.choices[0]?.message?.content || "";
      
      // Save the AI message to conversation history
      await ctx.runMutation(api.leads.addConversation, {
        id: args.leadId,
        role: "ai",
        content: message,
      });

      return { success: true, message };
    } catch (error: any) {
      // Fallback to template
      const fallback = `Hi ${args.fullName},\n\nThank you for reaching out to LeadFlow AI! We're excited to have you here.\n\nWe help businesses like yours turn leads into customers — automatically. Our AI engages every lead instantly, qualifies them, and books sales calls without you lifting a finger.\n\nWe'd love to hear: what's the biggest challenge you're facing with following up on leads right now? Just hit reply and let us know!\n\nBest regards,\nThe LeadFlow AI Team`;

      await ctx.runMutation(api.leads.addConversation, {
        id: args.leadId,
        role: "ai",
        content: fallback,
      });

      return { success: true, message: fallback, fallback: true };
    }
  },
});

// Helper type for the return value
type ProcessResult = {
  type: string;
  message: string;
  score?: number;
  tag?: string;
  bookingLink?: string;
  step?: number;
  fallback?: boolean;
};

// Process a lead's reply and determine next action
export const processLeadReply = action({
  args: {
    leadId: v.id("leads"),
    reply: v.string(),
  },
  handler: async (ctx: any, args: { leadId: any; reply: string }): Promise<ProcessResult> => {
    const lead = await ctx.runQuery(api.leads.getLead, { id: args.leadId });
    if (!lead) throw new Error("Lead not found");

    // Save lead's reply to conversation
    await ctx.runMutation(api.leads.addConversation, {
      id: args.leadId,
      role: "lead",
      content: args.reply,
    });

    const step = lead.qualificationStep || 0;
    const isComplete = lead.qualificationComplete || false;

    // If qualification is complete, handle follow-up or objection
    if (isComplete) {
      return await handlePostQualification(ctx, args.leadId, lead, args.reply);
    }

    // Check if the reply answers the current qualification question
    return await handleQualification(ctx, args.leadId, lead, args.reply, step);
  },
});

async function handleQualification(
  ctx: any,
  leadId: string,
  lead: any,
  reply: string,
  currentStep: number
): Promise<ProcessResult> {
  // Save the answer for the current step
  const question = QUALIFICATION_QUESTIONS[currentStep];
  if (!question) {
    // All questions answered, complete qualification
    await ctx.runMutation(api.leads.updateQualification, {
      id: leadId,
      step: currentStep,
      complete: true,
    });

    // Score the lead
    const { score, tag } = calculateLeadScore(lead);
    await ctx.runMutation(api.leads.updateScore, {
      id: leadId,
      score,
      tag,
    });

    // Update status based on score
    if (tag === "hot") {
      await ctx.runMutation(api.leads.updateStatus, {
        id: leadId,
        status: "hot",
      });
    } else if (tag === "warm") {
      await ctx.runMutation(api.leads.updateStatus, {
        id: leadId,
        status: "nurturing",
      });
    }

    // Generate summary message
    const summaryPrompt = `Summarize the following lead qualification results conversationally for ${lead.fullName}:

Budget: ${lead.monthlyBudget || "Not specified"}
Timeline: ${lead.timeline || "Not specified"}
Previous experience: ${lead.triedBefore || "Not specified"}
90-day vision: ${lead.successVision || "Not specified"}

Their score is ${score}/100 (${tag.toUpperCase()} lead).

${
  tag === "hot"
    ? "They are a hot lead! Ask if they'd like to book a call to get started right away. Provide a friendly calendar booking invitation."
    : tag === "warm"
    ? "Let them know we'll be sending them some helpful resources over the next week to help them make the best decision. Ask if they have any other questions."
    : "Thank them for their time and let them know we'll send occasional helpful tips and resources to their inbox."
}

Keep it warm and conversational, 2-3 paragraphs.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a warm sales assistant. Be natural and helpful." },
          { role: "user", content: summaryPrompt },
        ],
        max_tokens: 400,
        temperature: 0.7,
      });

      const message = response.choices[0]?.message?.content || "";
      await ctx.runMutation(api.leads.addConversation, {
        id: leadId,
        role: "ai",
        content: message,
      });

      return {
        type: "qualification_complete",
        score,
        tag,
        message,
      };
    } catch (e) {
      const fallback = `Thank you so much for sharing all of that, ${lead.fullName}! Here's a quick summary of what we've learned:

Based on everything you've told us, you're a ${tag.toUpperCase()} lead (score: ${score}/100). ${
        tag === "hot"
          ? "This is great! You seem like a perfect fit. Would you like to book a quick call to get started? Just let us know your preferred time!"
          : tag === "warm"
          ? "We'll be sending you some helpful resources over the next week to help with your decision."
          : "No problem at all! We'll send you some helpful tips and resources from time to time."
      }`;

      await ctx.runMutation(api.leads.addConversation, {
        id: leadId,
        role: "ai",
        content: fallback,
      });

      return { type: "qualification_complete", score, tag, message: fallback };
    }
  }

  // Save the answer for the current question
  const fieldUpdate: any = { id: leadId, step: currentStep + 1, complete: false };
  fieldUpdate[question.field] = reply;

  await ctx.runMutation(api.leads.updateQualification, fieldUpdate);

  // Generate next question
  const nextQuestion = QUALIFICATION_QUESTIONS[currentStep + 1];
  if (!nextQuestion) {
    // No more questions, complete qualification
    return await handleQualification(ctx, leadId, lead, reply, currentStep + 1);
  }

  const questionPrompt = `You're having a friendly conversation with ${lead.fullName}. They just answered: "${reply}" to your previous question.

Now ask them this next question naturally:
"${nextQuestion.question}"
${nextQuestion.options.length > 0 ? `Options they can choose from: ${nextQuestion.options.join(", ")}` : ""}

Be conversational — don't just paste the question, lead into it naturally. One or two sentences maximum.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a warm, conversational sales assistant. Keep it brief and natural." },
        { role: "user", content: questionPrompt },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const message = response.choices[0]?.message?.content || nextQuestion.question;
    await ctx.runMutation(api.leads.addConversation, {
      id: leadId,
      role: "ai",
      content: message,
    });

    return { type: "qualification_question", step: currentStep + 1, message };
  } catch (e) {
    await ctx.runMutation(api.leads.addConversation, {
      id: leadId,
      role: "ai",
      content: nextQuestion.question,
    });

    return { type: "qualification_question", step: currentStep + 1, message: nextQuestion.question };
  }
}

async function handlePostQualification(
  ctx: any,
  leadId: string,
  lead: any,
  reply: string
): Promise<ProcessResult> {
  // Check for objection keywords
  const objectionKeywords = [
    "expensive", "cost", "price", "budget",
    "think about", "consider", "decide",
    "comparing", "other option", "competitor",
    "not ready", "not yet", "later", "someday",
  ];

  const lowerReply = reply.toLowerCase();
  let response: string;

  const hasObjection = objectionKeywords.some((kw) => lowerReply.includes(kw));

  if (hasObjection) {
    // Handle objection with AI
    const objectionPrompt = `${lead.fullName} said: "${reply}"

Respond to their concern naturally. 
- If they mention cost: explain ROI and value
- If they want to think about it: offer a no-pressure discovery call
- If they're comparing options: highlight key differentiators
- If they're not ready: offer to follow up at a specific date

Be warm, understanding, and helpful. Don't be pushy. 2-3 sentences.`;

    try {
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a patient, helpful sales assistant. Never pushy, always understanding." },
          { role: "user", content: objectionPrompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      response = aiResponse.choices[0]?.message?.content || "";
    } catch (e) {
      // Fallback objection handling
      if (lowerReply.includes("expensive") || lowerReply.includes("cost")) {
        response = `I completely understand, ${lead.fullName}! Many of our clients felt the same way initially, but they find that LeadFlow AI pays for itself within the first month by capturing leads they would have lost. Would you be open to a quick 10-minute call to look at the numbers for your business?`;
      } else if (lowerReply.includes("think about")) {
        response = `Of course, ${lead.fullName}! Taking time to make the right decision is smart. How about we schedule a quick, no-pressure discovery call to answer any questions? Would next week work for you?`;
      } else if (lowerReply.includes("comparing") || lowerReply.includes("other option")) {
        response = `Great question! What sets LeadFlow AI apart is our fully autonomous qualification — we engage every lead in real conversation, score them intelligently, and book meetings without any effort on your end. Would you like to see a quick demo?`;
      } else {
        response = `No worries at all, ${lead.fullName}! When would be a good time for me to follow up with you? Just let me know a date and I'll check back in then.`;
      }
    }

    await ctx.runMutation(api.leads.addConversation, {
      id: leadId,
      role: "ai",
      content: response,
    });
    await ctx.runMutation(api.leads.handleObjection, {
      id: leadId,
      objection: reply,
      handled: true,
    });

    return { type: "objection_handled", message: response };
  }

  // Check if lead wants to book a call
  if (
    lowerReply.includes("book") ||
    lowerReply.includes("schedule") ||
    lowerReply.includes("call") ||
    lowerReply.includes("meeting") ||
    lowerReply.includes("yes") ||
    lowerReply.includes("let's do it") ||
    lowerReply.includes("let's go")
  ) {
    response = `That's wonderful, ${lead.fullName}! I'm excited to help you get started. 🎉

Please pick a time that works best for you using this link:
[📅 Book a Discovery Call](https://calendly.com/leadflow-ai/discovery)

Once you book, we'll send a confirmation and a reminder before the call. Looking forward to speaking with you!`;

    await ctx.runMutation(api.leads.addConversation, {
      id: leadId,
      role: "ai",
      content: response,
    });

    return { type: "booking_offer", message: response, bookingLink: "https://calendly.com/leadflow-ai/discovery" };
  }

  // General reply
  try {
    const generalPrompt = `${lead.fullName} (a ${lead.leadTag} lead) said: "${reply}"

Respond naturally and helpfully. Keep it warm and conversational. 1-2 sentences. If relevant, offer to book a call or ask if they have questions.`;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful sales assistant. Be concise and warm." },
        { role: "user", content: generalPrompt },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    response = aiResponse.choices[0]?.message?.content || "";
  } catch (e) {
    response = `Thanks for sharing, ${lead.fullName}! Is there anything specific you'd like to know about how LeadFlow AI can help your business?`;
  }

  await ctx.runMutation(api.leads.addConversation, {
    id: leadId,
    role: "ai",
    content: response,
  });

  return { type: "general_reply", message: response };
}

// Generate follow-up email
export const generateFollowUp = action({
  args: {
    leadId: v.id("leads"),
    type: v.union(v.literal("hot"), v.literal("warm"), v.literal("cold")),
    step: v.number(),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.runQuery(api.leads.getLead, { id: args.leadId });
    if (!lead) throw new Error("Lead not found");

    let message = "";
    const { fullName, monthlyBudget, timeline, triedBefore, successVision, requirements } = lead;

    const hotMessages = [
      `Hey ${fullName}, just checking in! I know you're busy, but I wanted to make sure you got my last message. You seemed like a great fit for LeadFlow AI and I'd love to help you get started. Have any questions I can answer?`,
      `Hi ${fullName}! Following up one more time — we're here to help whenever you're ready. Quick question: what's the #1 thing holding you back from automating your lead follow-up? Happy to address any concerns!`,
      `Last check-in, ${fullName}! If I don't hear back, I'll flag this for our team to follow up personally. In the meantime, here's a quick win: businesses using LeadFlow AI see 3x more qualified meetings booked. Just something to think about! 🚀`,
    ];

    const warmMessages = [
      `Hi ${fullName}! Hope you're having a great week. Just wanted to share this quick tip: did you know that following up within 5 minutes of a lead coming in makes you 100x more likely to convert them? That's exactly what LeadFlow AI does automatically. Thought you'd find that interesting!`,
      `Hey ${fullName}! Here's a quick case study for you: ${fullName && "a business like yours"} started using LeadFlow AI last month and booked 12 qualified meetings in their first week — all completely automated. Imagine what that could do for your pipeline! 🚀`,
      `Hi ${fullName}! Just checking in one last time this week. We've put together a quick FAQ about how LeadFlow AI works — would you like us to send it over? Happy to answer any specific questions too!`,
    ];

    const coldMessages = [
      `Hi ${fullName}! Quick question for you — what's the biggest challenge you're facing with generating or following up on leads right now? We'd love to help if we can, no strings attached.`,
      `Hey ${fullName}, hope this note finds you well! Just wanted to share this: businesses that respond to leads within 60 seconds convert at 7x the rate of those who wait. LeadFlow AI does this automatically. Here's a helpful guide we put together on lead response times — let us know if you want us to send it!`,
      `Hi ${fullName}! Just a friendly check-in. Whenever you're ready to streamline your lead follow-up, we'll be here. In the meantime, here's a thought: what if every lead you captured was instantly engaged, qualified, and ready to talk — without you lifting a finger? That's what we do. No rush, just know we're here! 😊`,
    ];

    const messages = {
      hot: hotMessages,
      warm: warmMessages,
      cold: coldMessages,
    };

    message = messages[args.type][args.step % 3] || messages[args.type][0];

    // Personalize with lead details
    if (monthlyBudget) {
      message = message.replace("the numbers for your business", `the numbers for your monthly budget of ${monthlyBudget}`);
    }
    if (successVision) {
      message = message + `\n\nYou mentioned success in 90 days means: "${successVision.slice(0, 100)}" — we'd love to help you get there!`;
    }

    await ctx.runMutation(api.leads.addConversation, {
      id: args.leadId,
      role: "ai",
      content: message,
    });

    return { success: true, message };
  },
});