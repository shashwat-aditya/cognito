# 🧠 Cognito: The Agentic Workflow Engine

Cognito is a state-of-the-art, **visual orchestration platform** for building multi-modal AI agents and complex autonomous workflows. Built on top of **Next.js 15** and powered by **Google Gemini**, Cognito transforms the way teams design, test, and deploy agentic AI experiences.

---

## 📽️ Experience the Future of AI Workflows

![Cognito Banner](https://raw.githubusercontent.com/antigravity-ai/assets/main/cognito-banner.png)

> [!IMPORTANT]
> Cognito is currently in beta. We are actively adding new node types and expanding our evaluation engine.

---

## 🌟 Key Capabilities

### 🎨 Visual Workflow Architect
Design sophisticated agent journeys using a high-performance, interactive canvas. Connect specialized nodes with intelligent transitions that adapt to user intent.

### 🧠 Dynamic decision Engine
Unlike linear chatbots, Cognito leverages the power of **LLM-driven evaluation**. Gemini intelligently analyzes conversation context to determine the optimal path through your workflow.

### 📊 Integrated Form & Report Nodes
- **Structured Data**: Collect precise information using interactive questionnaires.
- **AI Synthesis**: Automatically generate comprehensive, personalized reports based on the entire conversation history.

### 🎭 Premium Theming & UX
Every Cognito workflow feels premium by default. Our theming engine supports:
- **Glassmorphic UI**: Sleek, modern aesthetics with subtle blurs and shadows.
- **Micro-animations**: Powered by Framer Motion for a fluid, "living" interface.
- **Dynamic Branding**: Inject custom colors, fonts, and assets to match your brand identity.

### 🔓 Public Links & Visitor Analytics
Instantly generate public preview links to share your workflows. 
- **Lead Capture**: Collect emails anonymously and view their entire journey history.
- **Performance Tracking**: Monitor **Total Visits**, **Lead Conversion**, and **Completion Rates** per version in real-time.

---

## 🛠️ The Technology Stack

Cognito is built with a focus on speed, scalability, and developer experience:

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 15+](https://nextjs.org) (App Router, Server Actions) |
| **AI Intelligence** | [Google Gemini 2.5 Flash](https://ai.google.dev/) |
| **Database Architecture** | [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/) |
| **Authentication** | [Clerk](https://clerk.com/) (Enterprise-grade Identity) |
| **Visual Core** | [XYFlow (React Flow)](https://reactflow.dev/) & [Framer Motion](https://www.framer.com/motion/) |
| **Styling** | [Tailwind CSS 4.0](https://tailwindcss.com/) |

---

## 🚀 Getting Started

Quickly spin up your own instance of Cognito:

1. **Clone & Install**:
   ```bash
   git clone https://github.com/shashwat-aditya/cognito.git
   cd Cognito
   npm install
   ```

2. **Configure Environment**:
   Duplicate `.env.example` to `.env.local` and populate your API keys.

3. **Initialize Database**:
   ```bash
   npm run db:push
   ```

4. **Launch Console**:
   ```bash
   npm run dev
   ```

---

## 📖 Deep Dive Documentation

Explore our detailed technical guides:

- 🧱 [**Architecture**](docs/architecture.md) — How the graph engine and AI eval works.
- ⚙️ [**Setup Guide**](docs/setup.md) — Detailed environment and database configuration.
- 🤝 [**Contributing**](docs/contribution.md) — Guidelines for adding new features and node types.

---

Built with ❤️ by the Cognito Team.
