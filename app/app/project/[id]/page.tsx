import type { Metadata } from "next";
import { ProjectWorkspace } from "@/components/workspace/ProjectWorkspace";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Workspace · MotionPlan",
  description: "Design, preview, and generate production-ready animation code.",
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  return <ProjectWorkspace projectId={id} />;
}
