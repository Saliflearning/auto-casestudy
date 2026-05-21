export type StudioViewId = "ingest" | "intelligence" | "strategy" | "editor" | "preview" | "export";

export type ProductRoute = {
  href: string;
  label: string;
  responsibility: string;
  dependsOn: string;
  nextAction: string;
  primary?: boolean;
};

export type FlowDependency = {
  page: string;
  consumes: string;
  feeds: string;
  missingStateAction: string;
};

export const studioFlowSteps: Array<{
  id: StudioViewId;
  label: string;
  route: string;
  responsibility: string;
}> = [
  {
    id: "ingest",
    label: "Inbox",
    route: "/studio#ingest",
    responsibility: "Upload artifacts and create ingestion records."
  },
  {
    id: "intelligence",
    label: "Review",
    route: "/studio#intelligence",
    responsibility: "Review parsed evidence, classifications, clusters, and backlog."
  },
  {
    id: "strategy",
    label: "Strategy",
    route: "/studio#strategy",
    responsibility: "Confirm blueprint decisions, portfolio plan, and orchestration."
  },
  {
    id: "editor",
    label: "Editor",
    route: "/studio#editor",
    responsibility: "Edit the case study, composed layout, and saved portfolio draft."
  },
  {
    id: "preview",
    label: "Preview",
    route: "/studio#preview",
    responsibility: "Inspect the clean recruiter-facing portfolio draft."
  },
  {
    id: "export",
    label: "Publish",
    route: "/studio#export",
    responsibility: "Check readiness and prepare publish/export setup."
  }
];

export const productRoutes: ProductRoute[] = [
  {
    href: "/",
    label: "Home",
    responsibility: "Entry point and product explanation.",
    dependsOn: "No workspace data required.",
    nextAction: "Start profile setup or upload evidence.",
    primary: true
  },
  {
    href: "/profile",
    label: "Profile",
    responsibility: "User identity, target role, bio, skills, links, and resume context.",
    dependsOn: "Local workspace profile and persona selection.",
    nextAction: "Use the selected persona in portfolio strategy.",
    primary: true
  },
  {
    href: "/projects",
    label: "Projects",
    responsibility: "Project library and case-study route overview.",
    dependsOn: "Saved portfolio site draft or uploaded evidence.",
    nextAction: "Create a site draft in the builder when no project pages exist.",
    primary: true
  },
  {
    href: "/studio#ingest",
    label: "Studio",
    responsibility: "Evidence-first workflow from upload through publish readiness.",
    dependsOn: "Workspace session.",
    nextAction: "Move through Inbox, Review, Strategy, Builder, Preview, Publish.",
    primary: true
  },
  {
    href: "/studio#editor",
    label: "Builder",
    responsibility: "Framer-style editing constrained by the evidence-backed spine.",
    dependsOn: "Persisted blueprint, case-study draft, compositions, and orchestration.",
    nextAction: "Reset or save a site draft from approved planning state.",
    primary: true
  },
  {
    href: "/preview",
    label: "Preview",
    responsibility: "Clean recruiter-facing preview without editor controls.",
    dependsOn: "Saved PortfolioSiteDraft.",
    nextAction: "Return to Builder if no draft exists.",
    primary: true
  },
  {
    href: "/templates",
    label: "Templates",
    responsibility: "Portfolio archetype and design-system selection.",
    dependsOn: "Persona/archetype strategy.",
    nextAction: "Choose an archetype before composition and builder editing.",
    primary: true
  },
  {
    href: "/publish",
    label: "Publish",
    responsibility: "Domain/export/share setup and final readiness checks.",
    dependsOn: "Saved site draft and generation readiness gate.",
    nextAction: "Resolve blockers before publish controls unlock.",
    primary: true
  }
];

export const internalProductRoutes: ProductRoute[] = [
  {
    href: "/references",
    label: "Reference Lab",
    responsibility: "Internal/admin portfolio reference intelligence.",
    dependsOn: "Protected admin workflow.",
    nextAction: "Capture references for future layout intelligence.",
    primary: false
  }
];

export const flowDependencies: FlowDependency[] = [
  {
    page: "Profile",
    consumes: "User-entered role target, persona, skills, links, resume context.",
    feeds: "Portfolio strategy and homepage positioning."
  },
  {
    page: "Inbox",
    consumes: "Local files and accepted artifact metadata.",
    feeds: "Review evidence records and parsing/classification state."
  },
  {
    page: "Review",
    consumes: "Uploaded artifacts, extracted text, classifications, relationship map.",
    feeds: "Understanding backlog and portfolio planning."
  },
  {
    page: "Strategy",
    consumes: "Evidence graph, backlog, portfolio plan, user review decisions.",
    feeds: "Confirmed blueprint, layout composition, portfolio orchestration."
  },
  {
    page: "Builder",
    consumes: "Persisted blueprint, case-study draft, composition, experience plan.",
    feeds: "Saved PortfolioSiteDraft."
  },
  {
    page: "Preview",
    consumes: "Saved PortfolioSiteDraft.",
    feeds: "Publish readiness review."
  },
  {
    page: "Publish",
    consumes: "Saved PortfolioSiteDraft and generation readiness result.",
    feeds: "Future hosted publishing and export jobs."
  }
].map((item) => ({
  ...item,
  missingStateAction: `Open the previous step before using ${item.page}.`
}));

const studioIds = new Set(studioFlowSteps.map((step) => step.id));

export function studioViewFromHash(hash: string | undefined): StudioViewId {
  const value = (hash ?? "").replace("#", "") as StudioViewId;
  return studioIds.has(value) ? value : "ingest";
}

export function studioHashForView(view: StudioViewId) {
  return `#${view}`;
}
