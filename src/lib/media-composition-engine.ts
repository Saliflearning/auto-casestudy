import { GeneratedCaseStudyDraft } from "@/lib/case-study-generation-types";
import { ComposedMediaPlacement, LayoutRegion } from "@/lib/layout-composition-types";

function bestRegionForPlacement(placement: GeneratedCaseStudyDraft["media"][number]["placement"], regions: LayoutRegion[]) {
  const preferred =
    placement === "hero"
      ? ["hero", "summary"]
      : placement === "technical"
        ? ["technical", "decision"]
        : placement === "research" || placement === "process"
          ? ["process", "problem"]
          : placement === "solution"
            ? ["decision", "media"]
            : ["media", "decision", "summary"];

  return regions.find((region) => preferred.includes(region.kind)) ?? regions[0];
}

export function composeMediaPlacements(draft: GeneratedCaseStudyDraft, regions: LayoutRegion[]): ComposedMediaPlacement[] {
  return draft.media
    .filter((media) => !media.private)
    .map((media, index) => {
      const region = bestRegionForPlacement(media.placement, regions);
      return {
        id: `composed_media_${media.id}`,
        artifactId: media.artifactId,
        regionId: region?.id ?? "region_hero",
        placement: index === 0 || media.placement === "hero" ? "hero" : media.placement === "technical" ? "aside" : media.placement === "gallery" ? "gallery" : "inline",
        caption: media.caption,
        altText: `${draft.title} supporting visual for ${region?.title ?? "the portfolio case study"}.`,
        provenance: media.provenance,
        private: media.private,
        rationale: region
          ? `Placed with ${region.title} because this visual is approved for ${media.placement} support.`
          : "Kept as approved media, but no matching region was available."
      };
    });
}
