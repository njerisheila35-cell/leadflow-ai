import { action } from "./_generated/server";
import { v } from "convex/values";

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    text: v.string(),
    html: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { to, subject, text, html } = args;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set");
      return { success: false, error: "RESEND_API_KEY is not set" };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "LeadFlow AI <onboarding@resend.dev>",
          to: [to],
          subject: subject,
          text: text,
          html: html || text.replace(/\n/g, "<br>"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Resend API error:", data);
        return { success: false, error: data.message || "Failed to send email" };
      }

      console.log("Email sent successfully:", data);
      return { success: true, data };
    } catch (error: any) {
      console.error("Failed to send email:", error);
      return { success: false, error: error.message || String(error) };
    }
  },
});