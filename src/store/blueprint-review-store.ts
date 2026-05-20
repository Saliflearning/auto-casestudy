"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PortfolioArchetype } from "@/lib/portfolio-strategy-types";
import { PortfolioBlueprintReviewState, ReviewDecisionStatus } from "@/lib/portfolio-blueprint-types";

const initialReview: PortfolioBlueprintReviewState = {
  approvedHomepage: false,
  projectOrder: [],
  rejectedProjectIds: [],
  homepageTone: "Recruiter",
  mediaDecisions: {},
  blockerDecisions: {},
  missingEvidenceNotes: {},
  sectionNotes: {}
};

type BlueprintReviewStore = PortfolioBlueprintReviewState & {
  hydrateReview: (review: PortfolioBlueprintReviewState) => void;
  approveHomepage: () => void;
  setHomepageTone: (tone: PortfolioBlueprintReviewState["homepageTone"]) => void;
  setArchetypeOverride: (archetype?: PortfolioArchetype) => void;
  pinFeaturedProject: (projectId: string) => void;
  promoteProject: (projectId: string, currentOrder: string[]) => void;
  demoteProject: (projectId: string, currentOrder: string[]) => void;
  rejectProject: (projectId: string) => void;
  restoreProject: (projectId: string) => void;
  selectHeroProof: (artifactId: string) => void;
  selectHeroVisual: (artifactId: string) => void;
  setMediaDecision: (placementId: string, decision: ReviewDecisionStatus) => void;
  setBlockerDecision: (blockerId: string, decision: ReviewDecisionStatus) => void;
  setMissingEvidenceNote: (key: string, note: string) => void;
  setSectionNote: (key: string, note: string) => void;
  resetReview: () => void;
};

function move(projectId: string, currentOrder: string[], direction: -1 | 1) {
  const order = currentOrder.includes(projectId) ? currentOrder : [...currentOrder, projectId];
  const index = order.indexOf(projectId);
  const nextIndex = Math.max(0, Math.min(order.length - 1, index + direction));
  const next = [...order];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
}

export const useBlueprintReviewStore = create<BlueprintReviewStore>()(
  persist(
    (set) => ({
      ...initialReview,
      hydrateReview: (review) => set({ ...initialReview, ...review }),
      approveHomepage: () => set({ approvedHomepage: true, updatedAt: new Date().toISOString() }),
      setHomepageTone: (homepageTone) => set({ homepageTone, updatedAt: new Date().toISOString() }),
      setArchetypeOverride: (archetypeOverride) => set({ archetypeOverride, updatedAt: new Date().toISOString() }),
      pinFeaturedProject: (pinnedFeaturedProjectId) => set({ pinnedFeaturedProjectId, approvedHomepage: true, updatedAt: new Date().toISOString() }),
      promoteProject: (projectId, currentOrder) => set({ projectOrder: move(projectId, currentOrder, -1), updatedAt: new Date().toISOString() }),
      demoteProject: (projectId, currentOrder) => set({ projectOrder: move(projectId, currentOrder, 1), updatedAt: new Date().toISOString() }),
      rejectProject: (projectId) =>
        set((state) => ({
          rejectedProjectIds: Array.from(new Set([...state.rejectedProjectIds, projectId])),
          projectOrder: state.projectOrder.filter((id) => id !== projectId),
          pinnedFeaturedProjectId: state.pinnedFeaturedProjectId === projectId ? undefined : state.pinnedFeaturedProjectId,
          updatedAt: new Date().toISOString()
        })),
      restoreProject: (projectId) =>
        set((state) => ({
          rejectedProjectIds: state.rejectedProjectIds.filter((id) => id !== projectId),
          updatedAt: new Date().toISOString()
        })),
      selectHeroProof: (selectedHeroProofId) => set({ selectedHeroProofId, approvedHomepage: true, updatedAt: new Date().toISOString() }),
      selectHeroVisual: (selectedHeroVisualId) => set({ selectedHeroVisualId, approvedHomepage: true, updatedAt: new Date().toISOString() }),
      setMediaDecision: (placementId, decision) =>
        set((state) => ({
          mediaDecisions: { ...state.mediaDecisions, [placementId]: decision },
          updatedAt: new Date().toISOString()
        })),
      setBlockerDecision: (blockerId, decision) =>
        set((state) => ({
          blockerDecisions: { ...state.blockerDecisions, [blockerId]: decision },
          updatedAt: new Date().toISOString()
        })),
      setMissingEvidenceNote: (key, note) =>
        set((state) => ({
          missingEvidenceNotes: { ...state.missingEvidenceNotes, [key]: note },
          updatedAt: new Date().toISOString()
        })),
      setSectionNote: (key, note) =>
        set((state) => ({
          sectionNotes: { ...state.sectionNotes, [key]: note },
          updatedAt: new Date().toISOString()
        })),
      resetReview: () => set({ ...initialReview, updatedAt: new Date().toISOString() })
    }),
    { name: "auto-casestudy-blueprint-review" }
  )
);
