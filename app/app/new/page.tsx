import type { Metadata } from "next";
import { TemplatePicker } from "@/components/projects/TemplatePicker";

export const metadata: Metadata = {
  title: "New project · MotionPlan",
  description: "Start a new animation project from a template.",
};

export default function NewProjectPage() {
  return <TemplatePicker />;
}
