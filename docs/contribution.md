# 🤝 Contribution Guidelines

Welcome! We're thrilled that you want to contribute to Cognito. Whether you're fixing a bug, improving documentation, or adding a new node type, your help is appreciated.

## 🛠️ Development Workflow

1. **Fork & Branch**: Create a feature branch from `main`.
   ```bash
   git checkout -b feature/amazing-new-node
   ```
2. **Setup Local Env**: Follow the [Setup Guide](setup.md) to get running.
3. **Write Code**: Ensure your code follows the existing patterns.
4. **Validation**: Run the build and lint commands:
   ```bash
   npm run lint
   npm run build
   ```
5. **Submit PR**: Open a Pull Request with a clear title and description.

## 📏 Code Standards

To keep the codebase maintainable, we follow these strict standards:

- **Strict TypeScript**: Avoid `any` at all costs. Interface every data structure.
- **Server-First Logic**: Use Next.js Server Actions for all database and API interactions.
- **Modular Components**: Place feature-specific UI in `src/components/<feature>/` and shared UI in `src/components/ui/`.
- **Atomic CSS**: Use Tailwind CSS utilities. Avoid custom CSS files unless absolutely necessary for complex animations.
- **Prompt Consolidation**: All static LLM instructions **must** be added to `src/lib/prompts.ts`.

## 📂 Project Structure

```text
├── app/                 # Next.js App Router (Pages & Layouts)
├── docs/                # Technical documentation
├── src/
│   ├── components/      # React components (Dashboard, Public, Preview)
│   ├── db/              # Drizzle Schema & Client
│   ├── lib/
│   │   ├── actions/     # Server Actions (The Backend)
│   │   ├── resolvers/   # Variable & Template logic
│   │   └── prompts.ts   # Centralized AI Prompts
│   └── styles/          # Global CSS & Tailwind Config
```

## 🚀 Adding a New Node Type

Adding a new node type (e.g., "Email Collector") involves four key areas:

1. **Schema**: Update `src/db/schema.ts` to include the new configuration fields for the node.
2. **Editor**: Add the node's configuration UI to `src/components/dashboard/EditorSidebar.tsx`.
3. **Canvas**: Define the node's visual representation in `src/components/dashboard/WorkflowCanvas.tsx`.
4. **Runtime**: Update `PreviewSession.tsx` and `VisitorPreview.tsx` to handle the node's interaction logic during a live session.

## 🧪 Testing

We currently rely on manual verification via the **Preview Session** within the dashboard. When contributing, please ensure:
- The node renders correctly on the canvas.
- Transitions to/from the node work as expected.
- Variables are resolved correctly within the node's prompts.

---

> [!IMPORTANT]
> Always run `npm run build` before submitting a PR to catch any TypeScript or build-time errors.

---

Thank you for building the future of agentic workflows with us!
