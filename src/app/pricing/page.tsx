"use client";

import { Zap, CheckCircle2 } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "For small businesses just getting started",
    features: [
      "Up to 50 leads/month",
      "AI welcome & qualification",
      "Lead scoring (Hot/Warm/Cold)",
      "Email chat widget",
      "Basic dashboard",
    ],
    paypalLink: "https://www.paypal.com/ncp/payment/MAWWSFDGVBXVL",
    popular: false,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/month",
    description: "For growing sales teams",
    features: [
      "Up to 200 leads/month",
      "Everything in Starter",
      "Automated follow-up sequences",
      "Objection handling AI",
      "Calendar booking integration",
      "Daily email summaries",
    ],
    paypalLink: "https://www.paypal.com/ncp/payment/WLU4HZYKHTXWW",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/month",
    description: "For high-volume businesses",
    features: [
      "Unlimited leads",
      "Everything in Pro",
      "White-label branding",
      "Custom AI training",
      "Priority support",
      "API access",
      "Dedicated account manager",
    ],
    paypalLink: "https://www.paypal.com/ncp/payment/H576GMJ3WBH6E",
    popular: false,
  },
];

export default function PricingPage() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <header className="border-b border-purple-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">
              LeadFlow <span className="text-purple-600">AI</span>
            </span>
          </div>
          <a
            href="/"
            className="text-sm text-gray-500 hover:text-purple-600 transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Heading */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start with a free trial. No credit card required. Upgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl border-2 p-8 transition-all hover:shadow-xl ${
                plan.popular
                  ? "border-purple-500 shadow-lg scale-105"
                  : "border-gray-100 hover:border-purple-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-400">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.paypalLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full py-3 rounded-xl font-medium text-sm text-center transition-all ${
                  plan.popular
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800"
                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                Subscribe via PayPal
              </a>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="text-center mt-12 text-sm text-gray-400">
          <p>
            All plans include a 14-day free trial. Cancel anytime.
            <br />
            Questions? Email{" "}
            <a
              href="mailto:support@leadflowai.com"
              className="text-purple-600 hover:underline"
            >
              support@leadflowai.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}