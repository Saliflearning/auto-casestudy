import { PortfolioBlueprintRecord } from "@/lib/portfolio-blueprint-types";
import { GeneratedCaseStudyDraft } from "@/lib/case-study-generation-types";
import { PortfolioPageComposition } from "@/lib/layout-composition-types";
import { PortfolioExperiencePlan } from "@/lib/portfolio-experience-types";
import { BuilderMediaAssignment, BuilderSectionBlock, PortfolioSiteDraft, ProjectPageDraft } from "@/lib/portfolio-site-draft-types";

function sectionBlocksFromComposition(composition: PortfolioPageComposition): BuilderSectionBlock[] {
  return composition.regions.map((region, index) => ({
    id: `builder_section_${region.id}`,
    sourceRegionId: region.id,
    sourceSectionIds: region.sourceSectionIds,
    title: region.title,
    visible: true,
    locked: !region.editable,
    needsRevision: region.warnings.length > 0,
    order: index + 1,
    kind: region.kind,
    provenance: region.provenance,
    warnings: region.warnings
  }));
}

function mediaAssignmentsFromComposition(composition: PortfolioPageComposition): BuilderMediaAssignment[] {
  return composition.mediaPlacements
    .filter((media) => !media.private)
    .map((media) => ({
      id: `builder_media_${media.id}`,
      artifactId: media.artifactId,
      sourceMediaId: media.id,
      regionId: media.regionId,
      placement: media.placement,
      caption: media.caption,
      visible: true,
      private: media.private,
      provenance: media.provenance
    }));
}

function projectPagesFrom(input: {
  experiencePlan: PortfolioExperiencePlan | null;
  compositions: PortfolioPageComposition[];
}): ProjectPageDraft[] {
  const sequence = input.experiencePlan?.projectSequence ?? input.compositions.map((composition, index) => ({
    projectId: composition.projectId,
    title: composition.title,
    role: index === 0 ? "featured" as const : "supporting" as const
  }));

  return sequence.map((project) => {
    const composition = input.compositions.find((item) => item.projectId === project.projectId);
    return {
      projectId: project.projectId,
      title: project.title,
      compositionId: composition?.id,
      role: project.role,
      sectionBlocks: composition ? sectionBlocksFromComposition(composition) : [],
      mediaAssignments: composition ? mediaAssignmentsFromComposition(composition) : [],
      provenance: composition?.provenance ?? [],
      warnings: composition?.unresolvedWarnings ?? ["No composed project page exists yet."]
    };
  });
}

export function buildPortfolioSiteDraftFromPlan(input: {
  workspaceId: string;
  experiencePlan: PortfolioExperiencePlan | null;
  compositions: PortfolioPageComposition[];
  caseStudyDraft: GeneratedCaseStudyDraft | null;
  blueprint: PortfolioBlueprintRecord | null;
}): PortfolioSiteDraft {
  const now = new Date().toISOString();
  const plan = input.experiencePlan;
  const projectPages = projectPagesFrom({
    experiencePlan: plan,
    compositions: input.compositions
  });
  const guardrails = [
    ...(plan?.unresolvedWarnings ?? []),
    ...(input.caseStudyDraft?.unresolvedIssues ?? []),
    ...(!plan ? ["Portfolio experience plan is missing. Orchestrate the portfolio before trusting builder output."] : []),
    ...(!input.compositions.length ? ["No composed project pages are available for builder assembly."] : [])
  ];

  return {
    id: `portfolio_site_draft_${input.workspaceId}`,
    workspaceId: input.workspaceId,
    sourceExperiencePlanId: plan?.id,
    sourceCompositionIds: input.compositions.map((composition) => composition.id),
    sourceDraftId: input.caseStudyDraft?.id,
    blueprintId: input.blueprint?.id,
    status: guardrails.length ? "Needs Evidence" : "Draft",
    homepage: {
      headline: plan?.homepage.headline ?? input.blueprint?.blueprint.approvedHomepageStrategy.positioning ?? "Evidence-backed portfolio",
      subtitle: plan?.homepage.subheadline ?? "Create a portfolio from persisted evidence-backed strategy.",
      featuredProjectId: plan?.homepage.featuredProjectId ?? input.blueprint?.blueprint.approvedHomepageStrategy.featuredProjectId,
      proofBlocks: plan?.homepage.featuredProof ?? [`${input.blueprint?.blueprint.provenance.length ?? 0} source links`],
      projectPreviewOrder: projectPages.map((project) => project.projectId),
      ctaLabels: {
        primary: "View featured project",
        secondary: "Contact"
      },
      provenance: plan?.homepage.provenance ?? input.blueprint?.provenanceRefs ?? [],
      warnings: plan?.homepage.warnings ?? []
    },
    navigation: (plan?.navigation ?? []).map((item, index) => ({
      id: item.id,
      label: item.label,
      destination: item.destination,
      visible: true,
      order: index + 1,
      priority: item.priority
    })),
    projectPages,
    theme: {
      typography: "clean sans",
      spacing: "comfortable",
      colorMood: "instrument dark",
      appearance: "dark",
      buttonStyle: "solid"
    },
    responsivePreview: {
      device: "desktop"
    },
    guardrails: Array.from(new Set(guardrails)),
    provenance: plan?.homepage.provenance ?? input.blueprint?.provenanceRefs ?? [],
    createdAt: now,
    updatedAt: now
  };
}

export function normalizePortfolioSiteDraft(draft: PortfolioSiteDraft): PortfolioSiteDraft {
  return {
    ...draft,
    homepage: {
      ...draft.homepage,
      headline: draft.homepage.headline.slice(0, 160),
      subtitle: draft.homepage.subtitle.slice(0, 280),
      ctaLabels: {
        primary: draft.homepage.ctaLabels.primary.slice(0, 40),
        secondary: draft.homepage.ctaLabels.secondary.slice(0, 40)
      }
    },
    navigation: draft.navigation
      .slice(0, 12)
      .map((item, index) => ({
        ...item,
        label: item.label.slice(0, 40),
        order: index + 1
      })),
    projectPages: draft.projectPages.map((project) => ({
      ...project,
      sectionBlocks: project.sectionBlocks
        .slice(0, 24)
        .map((section, index) => ({
          ...section,
          title: section.title.slice(0, 90),
          order: index + 1
        })),
      mediaAssignments: project.mediaAssignments.slice(0, 16).map((media) => ({
        ...media,
        caption: media.caption.slice(0, 220)
      }))
    })),
    updatedAt: new Date().toISOString()
  };
}
