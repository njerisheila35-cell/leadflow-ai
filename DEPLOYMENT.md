# LeadFlow AI Deployment Documentation

## Required Environment Variables

To deploy LeadFlow AI to production, you need the following environment variables configured in your hosting provider (e.g., Vercel) and Convex dashboard.

### Frontend (Next.js / Vercel)
- `NEXT_PUBLIC_CONVEX_URL`: The production URL for your Convex deployment (e.g., `https://happy-animal-123.convex.cloud`).
- `CONVEX_DEPLOYMENT`: The name of your production Convex deployment (e.g., `prod:happy-animal-123`).
- `OPENAI_API_KEY`: Required for AI features and lead qualification.
- `RESEND_API_KEY`: Required for sending welcome emails to leads. (Current key: `re_2NeV23Zu_FbXiFNzTbxNpUgNVnDFz6DTA` added to `.env.local`)

### Backend (Convex)
- `OPENAI_API_KEY`: Must also be set in the Convex dashboard under Settings > Environment Variables so that Convex functions can access it.
- `RESEND_API_KEY`: Must also be set in the Convex dashboard under Settings > Environment Variables so that Convex functions can access it.

## Email Configuration (Resend)
The current implementation uses `onboarding@resend.dev` as the sender. For actual production use with a custom domain:
1. Verify your domain in the [Resend Dashboard](https://resend.com/domains).
2. Update the `from` field in `convex/email.ts` to use your verified email/domain.
3. Ensure `RESEND_API_KEY` is set in both Vercel and Convex dashboards.

## Deployment Steps

1. **Convex Setup**:
   - Install Convex CLI: `npm install -g convex`
   - Login: `npx convex login`
   - Initialize project: `npx convex dev` (for local development)
   - Deploy to production: `npx convex deploy`

2. **Vercel Setup**:
   - Connect your repository to Vercel.
   - Set the environment variables mentioned above.
   - The `vercel.json` file is configured to run the deployment script.

3. **Manual Deployment**:
   - You can use the shared deployment script: `/home/team/shared/deploy.sh`
