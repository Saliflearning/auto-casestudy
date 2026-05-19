import { NextRequest, NextResponse } from "next/server";
import { createReferenceFromUrl } from "@/lib/portfolio-reference-intelligence";
import { createPortfolioReference, listPortfolioReferences } from "@/lib/server/portfolio-reference-repository";

export const runtime = "nodejs";

export async function GET() {
  const references = await listPortfolioReferences();
  return NextResponse.json({ references });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const url = typeof body === "object" && body !== null && "url" in body ? String((body as { url?: unknown }).url ?? "") : "";
  try {
    const referenceInput = createReferenceFromUrl(url);
    const reference = await createPortfolioReference(referenceInput);
    return NextResponse.json({ reference }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not ingest portfolio reference." }, { status: 400 });
  }
}
