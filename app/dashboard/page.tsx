import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { 
  Bot, 
  Search
} from "lucide-react";
import { getProjects } from "@/lib/actions/projects";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { redirect } from "next/navigation";
import type { projects as projectsTable } from "@/db/schema";

type Project = typeof projectsTable.$inferSelect;

export default async function Dashboard() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const projects: Project[] = await getProjects();

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-zinc-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 h-16 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex h-full items-center justify-between px-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <img src={'/favicon.png'} className="aspect-square w-8" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-zinc-400">
              Cognito
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 w-64 mr-4">
              <Search size={14} className="text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="bg-transparent border-none text-xs focus:outline-none w-full placeholder:text-zinc-600"
              />
            </div>
            <UserButton 
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-9 h-9 border border-white/10",
                  userButtonPopoverCard: "bg-zinc-900 border border-white/5",
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-8 py-12">
        {/* Project View Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
            <p className="text-zinc-500 text-sm mt-1">Manage your AI agent workflows and configurations.</p>
          </div>
          
          <CreateProjectDialog />
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length > 0 ? (
            projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </main>
    </div>
  );
}
