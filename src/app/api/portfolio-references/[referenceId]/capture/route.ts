import { NextRequest, NextResponse } from "next/server";
import { probeReferenceStructure } from "@/lib/server/reference-capture";
import { getPortfolioReference, updatePortfolioReference } from "@/lib/server/portfolio-reference-repository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    referenceId: string;
  }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  const { referenceId } = await context.params;
  const reference = await getPortfolioReference(referenceId);

  if (!reference) {
    return NextResponse.json({ error: "Reference not found." }, { status: 404 });
  }

  try {
    const probed = await probeReferenceStructure(reference);
    const updated = await updatePortfolioReference(reference.id, {
      title: probed.title,
      captureStatus: probed.captureStatus,
      screenshots: probed.screenshots,
      metadata: probed.metadata,
      reviewTags: probed.reviewTags,
      adminNotes: probed.adminNotes
    });

    return NextResponse.json({ reference: updated });
  } catch (error) {
    const failed = await updatePortfolioReference(reference.id, {
      captureStatus: "Failed",
      screenshots: reference.screenshots.map((screenshot) => ({
        ...screenshot,
        status: screenshot.status === "Captured" ? screenshot.status : "Failed"
      })),
      adminNotes: error instanceof Error ? error.message : "Reference structure probe failed."
    });

    return NextResponse.json({ error: failed?.adminNotes ?? "Reference capture failed.", reference: failed }, { status: 502 });
  }
}
