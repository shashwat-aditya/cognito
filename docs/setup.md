# ⚙️ Setup & Configuration Guide

This document provides a comprehensive walkthrough for setting up Cognito in your local development environment.

## 📋 Prerequisites

Before you begin, ensure you have the following installed and configured:

- **Node.js**: Version 20.x or later.
- **PostgreSQL**: A running instance (local installations or cloud-based providers like Neon, Supabase, or AWS RDS).
- **Package Manager**: `npm` (v10+) or `pnpm`.

### External Services
- **Clerk**: Create a project at [clerk.com](https://clerk.com) for authentication.
- **Google AI Studio**: Obtain an API key for Gemini at [aistudio.google.com](https://aistudio.google.com).

## 🔑 Environment Variables

Cognito uses specialized environment variables for database connectivity, AI evaluation, and secure authentication. Create a `.env.local` file in the project root:

```env
# 🗄️ Database (PostgreSQL)
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>?sslmode=require

# 🧠 Google Gemini AI
GEMINI_API_KEY=AIzaSy...

# 🔐 Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

> [!TIP]
> Use a service like **Neon** for a serverless PostgreSQL experience that pairs perfectly with Next.js Server Actions.

## 🛠️ Installation Steps

Follow these steps to get the application running:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Database Schema Sync**:
   We use Drizzle ORM for database management. You can push the schema directly without manual migrations during early development:
   ```bash
   npm run db:push
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Verify Session**:
   Navigate to `http://localhost:3000` and sign in using Clerk to access the dashboard.

## 🚀 Deployment

When deploying to platforms like **Vercel** or **Railway**:

- Ensure all environment variables from `.env.local` are added to your hosting provider's dashboard.
- Update the Clerk Dashboard with your production URLs (Authorized Redirect URIs).
- Run `npm run build` to verify the production bundle.

## 🔍 Troubleshooting

| Issue | Potential Solution |
| :--- | :--- |
| **Drizzle Connection Error** | Verify your `DATABASE_URL` is correct and includes `sslmode=require` if using a cloud provider. |
| **Gemini Rate Limits** | Ensure you are using a standard API key. Free tier limits apply; check the Google AI Studio quota dashboard. |
| **Clerk Middleware Loop** | Double-check that `NEXT_PUBLIC_CLERK_SIGN_IN_URL` is correctly set and matches your Clerk dashboard settings. |
| **XYFlow Rendering Issues** | Ensure you are using React 18/19 and that the browser window is large enough to initialize the canvas. |

---

For architectural details, see the [Architecture Overview](architecture.md).
