import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phone, businessType, requirements } = body;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Create lead via Convex mutation
    const leadId = await convex.mutation(api.leads.createLead, {
      fullName,
      email,
      phone: phone || undefined,
      businessType: businessType || undefined,
      requirements: requirements || undefined,
      source: "website",
    });

    // Trigger AI welcome action
    const welcomeResult = await convex.action(api.ai.generateWelcomeMessage, {
      leadId,
      fullName,
      businessType: businessType || undefined,
      requirements: requirements || undefined,
    });

    return NextResponse.json({
      success: true,
      leadId,
      welcomeMessage: welcomeResult.message,
    });
  } catch (error: any) {
    console.error("Capture lead error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}