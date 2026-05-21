import { NextRequest, NextResponse } from "next/server";
import { canonicalPersonaPacks, CanonicalPersonaPackId } from "@/lib/canonical-persona-packs";
import { runCanonicalPersonaValidation, validatePersonaPack } from "@/lib/persona-validation-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPersonaPackId(value: string | null): value is CanonicalPersonaPackId {
  return Boolean(value && canonicalPersonaPacks.some((pack) => pack.id === value));
}

export async function GET(request: NextRequest) {
  const personaId = request.nextUrl.searchParams.get("persona");

  if (personaId && !isPersonaPackId(personaId)) {
    return NextResponse.json(
      {
        error: "Unknown canonical persona pack.",
        availablePersonas: canonicalPersonaPacks.map((pack) => pack.id)
      },
      { status: 400 }
    );
  }

  if (personaId) {
    const pack = canonicalPersonaPacks.find((item) => item.id === personaId);
    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        report: validatePersonaPack(pack!)
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(runCanonicalPersonaValidation(), { headers: { "Cache-Control": "no-store" } });
}
