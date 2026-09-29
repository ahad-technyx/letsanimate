"use client";

import { Panel, PanelHeader } from "@/components/ui/panel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AnimationPlanTab } from "@/components/animation/AnimationPlan";
import { CodePanel } from "@/components/animation/CodePanel";
import { PerformancePanel } from "@/components/animation/PerformancePanel";
import { AccessibilityPanel } from "@/components/animation/AccessibilityPanel";
import { ResponsivePanel } from "@/components/animation/ResponsivePanel";
import type { AnimationPlan } from "@/types/animation";

export function RightPanel({ plan }: { plan: AnimationPlan }) {
  return (
    <Panel className="border-l border-border">
      <PanelHeader>Inspector</PanelHeader>
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="plan" className="flex h-full flex-col">
          <div className="border-b border-border px-3 py-2">
            <TabsList className="flex-wrap">
              <TabsTrigger value="plan">Plan</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="perf">Performance</TabsTrigger>
              <TabsTrigger value="a11y">Accessibility</TabsTrigger>
              <TabsTrigger value="responsive">Responsive</TabsTrigger>
            </TabsList>
          </div>
          <div className="flex-1 overflow-auto">
            <TabsContent value="plan" className="mt-0 h-full">
              <AnimationPlanTab plan={plan} />
            </TabsContent>
            <TabsContent value="code" className="mt-0 h-full">
              <CodePanel plan={plan} />
            </TabsContent>
            <TabsContent value="perf" className="mt-0 h-full">
              <PerformancePanel plan={plan} />
            </TabsContent>
            <TabsContent value="a11y" className="mt-0 h-full">
              <AccessibilityPanel plan={plan} />
            </TabsContent>
            <TabsContent value="responsive" className="mt-0 h-full">
              <ResponsivePanel plan={plan} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Panel>
  );
}
