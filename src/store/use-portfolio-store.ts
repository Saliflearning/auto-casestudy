"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { classifyArtifact, detectGaps, generateSections, inferPersona } from "@/lib/intelligence";
import { initialArtifacts, initialPersona, initialSections } from "@/lib/demo-data";
import { Artifact, AudienceMode, CaseStudySection, Persona, PortfolioTheme, ProjectCluster, ArtifactRelationship } from "@/lib/types";

type ClusterStatus = ProjectCluster["status"];

type PortfolioState = {
  persona: Persona;
  audienceMode: AudienceMode;
  theme: PortfolioTheme;
  artifacts: Artifact[];
  sections: CaseStudySection[];
  clusters: ProjectCluster[];
  relationships: ArtifactRelationship[];
  lastAgentAction: string;
  setPersona: (persona: Persona) => void;
  setAudienceMode: (mode: AudienceMode) => void;
  setTheme: (theme: PortfolioTheme) => void;
  addArtifacts: (names: string[]) => void;
  addUploadedArtifacts: (artifacts: Artifact[]) => void;
  syncStoredArtifacts: (artifacts: Artifact[]) => void;
  setEvidenceMap: (evidenceMap: { clusters: ProjectCluster[]; relationships: ArtifactRelationship[] }) => void;
  updateClusterStatus: (id: string, status: ClusterStatus) => void;
  updateCluster: (cluster: ProjectCluster) => void;
  renameCluster: (id: string, label: string) => void;
  removeArtifactFromCluster: (clusterId: string, artifactId: string) => void;
  addArtifactToCluster: (clusterId: string, artifactId: string) => void;
  regenerate: () => void;
  reorderSections: (ids: string[]) => void;
  toggleLock: (id: string) => void;
  updateSection: (id: string, content: string) => void;
  runPrompt: (prompt: string) => void;
  resetDemo: () => void;
};

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      persona: initialPersona,
      audienceMode: "Portfolio",
      theme: "Instrument Dark",
      artifacts: initialArtifacts,
      sections: initialSections,
      clusters: [],
      relationships: [],
      lastAgentAction: "Demo workspace loaded with HCI, UX, Figma, testing, resume, and cloud artifacts.",
      setPersona: (persona) => set({ persona, lastAgentAction: `Portfolio strategy recalibrated for ${persona}.` }),
      setAudienceMode: (audienceMode) => set({ audienceMode }),
      setTheme: (theme) => set({ theme }),
      addArtifacts: (names) =>
        set((state) => {
          const newArtifacts = names.map(classifyArtifact);
          const artifacts = [...newArtifacts, ...state.artifacts];
          const persona = inferPersona(artifacts);
          return {
            artifacts,
            persona,
            sections: generateSections(artifacts, persona),
            lastAgentAction: `Analyzed ${newArtifacts.length} new artifact${newArtifacts.length === 1 ? "" : "s"} and refreshed the portfolio draft.`
          };
        }),
      addUploadedArtifacts: (newArtifacts) =>
        set((state) => ({
          artifacts: [...newArtifacts, ...state.artifacts],
          lastAgentAction: `Stored ${newArtifacts.length} uploaded artifact${newArtifacts.length === 1 ? "" : "s"} as metadata records. Raw parsing can run, but agent reasoning is still deferred.`
        })),
      syncStoredArtifacts: (storedArtifacts) =>
        set((state) => {
          const existingIds = new Set(state.artifacts.map((artifact) => artifact.id));
          const newArtifacts = storedArtifacts.filter((artifact) => !existingIds.has(artifact.id));
          if (!newArtifacts.length) return state;
          return {
            artifacts: [...newArtifacts, ...state.artifacts],
            lastAgentAction: `Loaded ${newArtifacts.length} stored artifact record${newArtifacts.length === 1 ? "" : "s"} from the upload pipeline.`
          };
        }),
      setEvidenceMap: (evidenceMap) =>
        set({
          clusters: evidenceMap.clusters,
          relationships: evidenceMap.relationships
        }),
      updateClusterStatus: (id, status) =>
        set((state) => ({
          clusters: state.clusters.map((cluster) => (cluster.id === id ? { ...cluster, status } : cluster)),
          lastAgentAction: `Project cluster ${status.toLowerCase()}. This is user review of structured mapping, not narrative generation.`
        })),
      updateCluster: (updatedCluster) =>
        set((state) => ({
          clusters: state.clusters.map((cluster) => (cluster.id === updatedCluster.id ? updatedCluster : cluster)),
          lastAgentAction: "Evidence graph decision saved. Future agent reasoning should trust this user-reviewed cluster."
        })),
      renameCluster: (id, label) =>
        set((state) => ({
          clusters: state.clusters.map((cluster) =>
            cluster.id === id ? { ...cluster, label: label.trim() || cluster.label, status: "Needs Review" } : cluster
          ),
          lastAgentAction: "Cluster renamed and marked for review before narrative generation."
        })),
      removeArtifactFromCluster: (clusterId, artifactId) =>
        set((state) => ({
          clusters: state.clusters.map((cluster) =>
            cluster.id === clusterId
              ? {
                  ...cluster,
                  artifactIds: cluster.artifactIds.filter((id) => id !== artifactId),
                  status: "Needs Review"
                }
              : cluster
          ),
          lastAgentAction: "Artifact removed from the project cluster and marked for review."
        })),
      addArtifactToCluster: (clusterId, artifactId) =>
        set((state) => ({
          clusters: state.clusters.map((cluster) =>
            cluster.id === clusterId && !cluster.artifactIds.includes(artifactId)
              ? {
                  ...cluster,
                  artifactIds: [...cluster.artifactIds, artifactId],
                  status: "Needs Review"
                }
              : cluster
          ),
          lastAgentAction: "Artifact added to the project cluster and marked for review."
        })),
      regenerate: () =>
        set((state) => ({
          persona: inferPersona(state.artifacts),
          sections: generateSections(state.artifacts, inferPersona(state.artifacts)),
          lastAgentAction: "Portfolio regenerated from the latest artifact graph."
        })),
      reorderSections: (ids) =>
        set((state) => ({
          sections: ids.map((id) => state.sections.find((section) => section.id === id)).filter(Boolean) as CaseStudySection[],
          lastAgentAction: "Manual section order saved. The agent will preserve this structure."
        })),
      toggleLock: (id) =>
        set((state) => ({
          sections: state.sections.map((section) =>
            section.id === id ? { ...section, locked: !section.locked } : section
          ),
          lastAgentAction: "Section protection updated. Locked content will not be rewritten by the agent."
        })),
      updateSection: (id, content) =>
        set((state) => ({
          sections: state.sections.map((section) => (section.id === id ? { ...section, content } : section)),
          lastAgentAction: "Manual edit saved as the newest portfolio version."
        })),
      runPrompt: (prompt) =>
        set((state) => {
          const normalized = prompt.toLowerCase();
          const sections = state.sections.map((section) => {
            if (section.locked) return section;
            if (normalized.includes("recruiter") || normalized.includes("short")) {
              return {
                ...section,
                content: `${section.content.split(".")[0]}. Recruiter scan: role, evidence, decision, impact.`
              };
            }
            if (normalized.includes("academic") || normalized.includes("research")) {
              return {
                ...section,
                content: `${section.content} Academic emphasis: methods, evidence limits, and traceability are made explicit.`
              };
            }
            if (normalized.includes("technical") || normalized.includes("cloud")) {
              return {
                ...section,
                content: `${section.content} Technical lens: system constraints and implementation judgment are connected to user outcomes.`
              };
            }
            return section;
          });

          return {
            sections,
            lastAgentAction: `Applied prompt: “${prompt}”. Locked sections were preserved.`
          };
        }),
      resetDemo: () =>
        set({
          persona: initialPersona,
          audienceMode: "Portfolio",
          theme: "Instrument Dark",
          artifacts: initialArtifacts,
          sections: initialSections,
          clusters: [],
          relationships: [],
          lastAgentAction: "Demo reset to the founder walkthrough state."
        })
    }),
    {
      name: "auto-casestudy-studio"
    }
  )
);

export function useGaps() {
  const artifacts = usePortfolioStore((state) => state.artifacts);
  const sections = usePortfolioStore((state) => state.sections);
  return useMemo(() => detectGaps(artifacts, sections), [artifacts, sections]);
}
