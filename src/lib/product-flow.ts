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
    responsibility: "Review the portfolio plan and approve what the site should emphasize."
  },
  {
    id: "editor",
    label: "Editor",
    route: "/studio#editor",
    responsibility: "Create the first project story and prepare editable site pages."
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
    responsibility: "Resolve final issues and prepare share/export setup."
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
    dependsOn: "Saved profile and persona selection.",
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
    href: "/studio",
    label: "Studio",
    responsibility: "AI workspace for upload, review, planning, and story generation.",
    dependsOn: "Private portfolio session.",
    nextAction: "Move through Inbox, Review, Strategy, Builder, Preview, Publish.",
    primary: true
  },
  {
    href: "/builder",
    label: "Builder",
    responsibility: "Website editor for pages, layout, theme, and responsive preview.",
    dependsOn: "Approved portfolio plan and saved project story.",
    nextAction: "Create or save a portfolio draft from the approved plan.",
    primary: true
  },
  {
    href: "/preview",
    label: "Preview",
    responsibility: "Clean recruiter-facing preview without editor controls.",
    dependsOn: "Saved portfolio draft.",
    nextAction: "Return to Builder if no draft exists.",
    primary: true
  },
  {
    href: "/templates",
    label: "Templates",
    responsibility: "Portfolio archetype and design-system selection.",
    dependsOn: "Persona/archetype strategy.",
    nextAction: "Choose an archetype before layout and builder editing.",
    primary: true
  },
  {
    href: "/publish",
    label: "Publish",
    responsibility: "Domain/export/share setup and final readiness checks.",
    dependsOn: "Saved site draft and resolved portfolio issues.",
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
    feeds: "Evidence review tasks and portfolio planning."
  },
  {
    page: "Strategy",
    consumes: "Evidence graph, backlog, portfolio plan, user review decisions.",
    feeds: "Approved portfolio plan, page layout, and portfolio flow."
  },
  {
    page: "Builder",
    consumes: "Approved plan, case-study draft, page layout, and portfolio flow.",
    feeds: "Saved portfolio draft."
  },
  {
    page: "Preview",
    consumes: "Saved portfolio draft.",
    feeds: "Publish readiness review."
  },
  {
    page: "Publish",
    consumes: "Saved portfolio draft and issue checklist.",
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
