import { LayoutRegion, ResponsiveLayoutPlan } from "@/lib/layout-composition-types";
import { PortfolioArchetype } from "@/lib/portfolio-strategy-types";

function emphasisForRegion(region: LayoutRegion): ResponsiveLayoutPlan["regions"][number]["emphasis"] {
  if (region.kind === "hero" || region.kind === "problem") return "primary";
  if (region.kind === "evidence-warning") return "guardrail";
  if (region.kind === "technical" || region.kind === "outcomes") return "secondary";
  return "supporting";
}

function desktopSpan(region: LayoutRegion, archetype: PortfolioArchetype) {
  if (region.kind === "hero") return 12;
  if (region.kind === "evidence-warning") return 12;
  if ((archetype === "Technical UX Hybrid" || archetype === "Cloud/Technical") && region.kind === "technical") return 5;
  if ((archetype === "Technical UX Hybrid" || archetype === "Cloud/Technical") && region.kind === "decision") return 7;
  if (region.kind === "process" || region.kind === "decision") return 8;
  if (region.kind === "outcomes" || region.kind === "reflection") return 6;
  return 6;
}

export function planResponsiveLayouts(regions: LayoutRegion[], archetype: PortfolioArchetype): Record<"desktop" | "tablet" | "mobile", ResponsiveLayoutPlan> {
  const desktopRegions = regions.map((region, index) => ({
    regionId: region.id,
    order: index + 1,
    columnSpan: desktopSpan(region, archetype),
    rowSpan: region.density === "immersive" ? 2 : 1,
    emphasis: emphasisForRegion(region)
  }));

  const tabletRegions = regions.map((region, index) => ({
    regionId: region.id,
    order: index + 1,
    columnSpan: region.kind === "hero" || region.kind === "evidence-warning" ? 8 : 4,
    rowSpan: 1,
    emphasis: emphasisForRegion(region)
  }));

  const mobileRegions = regions.map((region, index) => ({
    regionId: region.id,
    order: index + 1,
    columnSpan: 1,
    rowSpan: 1,
    emphasis: emphasisForRegion(region)
  }));

  return {
    desktop: {
      viewport: "desktop",
      columns: 12,
      rhythm: archetype === "Technical UX Hybrid" || archetype === "Cloud/Technical" ? "rail" : "magazine",
      regions: desktopRegions,
      notes: ["Keep hero and evidence warnings full width.", "Use split regions only when proof and narrative can be scanned together."]
    },
    tablet: {
      viewport: "tablet",
      columns: 8,
      rhythm: "split",
      regions: tabletRegions,
      notes: ["Collapse complex rails into paired cards.", "Preserve section order from the approved draft."]
    },
    mobile: {
      viewport: "mobile",
      columns: 1,
      rhythm: "stacked",
      regions: mobileRegions,
      notes: ["Use a single-column reading order.", "Keep provenance chips below the statement they support."]
    }
  };
}
