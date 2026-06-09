import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600 bg-green-100";
  if (score >= 50) return "text-amber-600 bg-amber-100";
  return "text-gray-500 bg-gray-100";
}

export function getTagColor(tag: string): string {
  switch (tag) {
    case "hot":
      return "bg-red-500";
    case "warm":
      return "bg-amber-500";
    case "cold":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
}

export function getStatusBadge(status: string): string {
  switch (status) {
    case "new":
      return "bg-purple-100 text-purple-700";
    case "qualified":
      return "bg-green-100 text-green-700";
    case "nurturing":
      return "bg-blue-100 text-blue-700";
    case "hot":
      return "bg-red-100 text-red-700";
    case "meeting_booked":
      return "bg-emerald-100 text-emerald-700";
    case "converted":
      return "bg-teal-100 text-teal-700";
    case "lost":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function generateWelcomeEmail(firstName: string): string {
  return `
Hi ${firstName},

Thank you for reaching out to LeadFlow AI! We're genuinely excited to have you here.

At LeadFlow AI, we help businesses like yours turn leads into loyal customers — effortlessly. Our intelligent platform automates the entire lead engagement process so you can focus on what you do best: running your business.

We'd love to hear more about your biggest challenge right now. Just hit reply and tell us — what's the one thing you're struggling with most when it comes to following up with your leads?

Looking forward to helping you grow!

Best regards,
The LeadFlow AI Team
  `.trim();
}

export function generateNudgeEmail(firstName: string, challenge?: string): string {
  const challengeRef = challenge ? `, especially around "${challenge}"` : "";
  return `
Hi ${firstName},

Just checking in! We know you're busy${challengeRef}, and we wanted to make sure you got everything you need from LeadFlow AI.

Here's a quick question to help us serve you better:

What would success look like for you in the next 90 days?

The more we understand your goals, the better we can help you reach them. Just reply to this email — it's that simple.

Chat soon,
The LeadFlow AI Team
  `.trim();
}

export function generateValueEmail(firstName: string, topic: string, content: string): string {
  return `
Hi ${firstName},

Hope you're having a great week! We wanted to share something we think you'll find valuable.

${topic ? `**${topic}**` : "A quick tip for you:"}

${content}

Let us know if you have any questions — we're here to help!

Best,
The LeadFlow AI Team
  `.trim();
}

export function generateObjectionResponse(objection: string, firstName: string): { message: string; action?: string } {
  const lower = objection.toLowerCase();

  if (lower.includes("too expensive") || lower.includes("cost") || lower.includes("price") || lower.includes("budget")) {
    return {
      message: `Hi ${firstName}, I completely understand your concern about pricing. Here's the thing — LeadFlow AI typically pays for itself within the first month by automating lead follow-ups that would otherwise slip through the cracks. Our clients see an average 3x ROI within 60 days.

Would you be open to a quick 10-minute call where we walk through the numbers specific to your business? No pressure at all.`,
      action: "offer_call"
    };
  }

  if (lower.includes("think about it") || lower.includes("need to think") || lower.includes("consider")) {
    return {
      message: `Totally fair, ${firstName}! Taking time to make the right decision is smart.

How about we schedule a quick, no-pressure discovery call? We can walk through how LeadFlow AI would work for your specific business, answer any questions, and if it's not the right fit — that's completely fine.

Would next Tuesday or Thursday work for you?`,
      action: "book_call"
    };
  }

  if (lower.includes("comparing") || lower.includes("other option") || lower.includes("competitor") || lower.includes("alternatives")) {
    return {
      message: `Great question, ${firstName}! It's always good to explore your options.

What sets LeadFlow AI apart is our fully autonomous qualification flow — we don't just capture leads, we have real conversations with them, score them intelligently, and book meetings without any human effort on your end.

Would you like to see a quick demo of how this works in practice?`,
      action: "offer_demo"
    };
  }

  if (lower.includes("not ready") || lower.includes("not yet") || lower.includes("later") || lower.includes("someday")) {
    return {
      message: `No worries at all, ${firstName}! We're here when you're ready.

When would be a good time for me to follow up with you? Just pick a date and I'll make a note to check in then. No pressure, just a friendly nudge when the time is right.`,
      action: "schedule_followup"
    };
  }

  return {
    message: `Thank you for sharing that, ${firstName}. I'd love to understand your situation better so we can help.

Would you be open to a quick chat to discuss how LeadFlow AI might work for your business?`,
    action: "offer_call"
  };
}