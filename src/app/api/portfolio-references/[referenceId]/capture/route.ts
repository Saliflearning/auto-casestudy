import { NextRequest, NextResponse } from "next/server";
import { probeReferenceStructure } from "@/lib/server/reference-capture";
import { captureReferenceScreenshots } from "@/lib/server/reference-screenshot-worker";
import { getPortfolioReference, updatePortfolioReference } from "@/lib/server/portfolio-reference-repository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    referenceId: string;
  }>;
};

async function captureMode(request: NextRequest) {
  try {
    const body = await request.json();
    return typeof body === "object" && body !== null && "mode" in body ? String((body as { mode?: unknown }).mode) : "structure";
  } catch {
    return "structure";
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { referenceId } = await context.params;
  const reference = await getPortfolioReference(referenceId);
  const mode = await captureMode(request);

  if (!reference) {
    return NextResponse.json({ error: "Reference not found." }, { status: 404 });
  }

  try {
    const probed = mode === "screenshots" ? await captureReferenceScreenshots(reference) : await probeReferenceStructure(reference);
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
