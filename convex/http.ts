import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Webhook to receive email replies (from email service like SendGrid, Mailgun, etc.)
http.route({
  path: "/api/email-reply",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { email, reply, leadId } = body;

      if (!reply || (!email && !leadId)) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Find the lead by email or ID
      let lead;
      if (leadId) {
        lead = await ctx.runQuery(api.leads.getLead, { id: leadId });
      } else if (email) {
        const allLeads = await ctx.runQuery(api.leads.getAllLeads);
        lead = allLeads.find((l: any) => l.email === email);
      }

      if (!lead) {
        return new Response(JSON.stringify({ error: "Lead not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Process the reply through AI
      const result = await ctx.runAction(api.ai.processLeadReply, {
        leadId: lead._id,
        reply: reply,
      });

      return new Response(JSON.stringify({ success: true, result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// API endpoint for the frontend chat widget
http.route({
  path: "/api/chat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { leadId, message } = body;

      if (!leadId || !message) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await ctx.runAction(api.ai.processLeadReply, {
        leadId,
        reply: message,
      });

      return new Response(JSON.stringify({ success: true, result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// API endpoint to capture a new lead (from the form)
http.route({
  path: "/api/capture-lead",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { fullName, email, phone, businessType, requirements } = body;

      if (!fullName || !email) {
        return new Response(JSON.stringify({ error: "Name and email are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Create lead
      const leadId = await ctx.runMutation(api.leads.createLead, {
        fullName,
        email,
        phone: phone || undefined,
        businessType: businessType || undefined,
        requirements: requirements || undefined,
        source: "website",
      });

      // Trigger AI welcome message
      const welcomeResult = await ctx.runAction(api.ai.generateWelcomeMessage, {
        leadId,
        fullName,
        businessType: businessType || undefined,
        requirements: requirements || undefined,
      });

      return new Response(
        JSON.stringify({
          success: true,
          leadId,
          welcomeMessage: welcomeResult.message,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Dashboard stats API
http.route({
  path: "/api/stats",
  method: "GET",
  handler: httpAction(async (ctx) => {
    try {
      const stats = await ctx.runQuery(api.leads.getDashboardStats);
      return new Response(JSON.stringify({ success: true, stats }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Get all leads API
http.route({
  path: "/api/leads",
  method: "GET",
  handler: httpAction(async (ctx) => {
    try {
      const leads = await ctx.runQuery(api.leads.getAllLeads);
      return new Response(JSON.stringify({ success: true, leads }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;