"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, CircleAlert } from "lucide-react";
import { workspaceRequestHeaders } from "@/lib/client-workspace";
import { GenerationReadinessResult } from "@/lib/generation-readiness";
import { PortfolioSiteDraft } from "@/lib/portfolio-site-draft-types";
import { cn } from "@/lib/utils";
import { usePortfolioStore } from "@/store/use-portfolio-store";

type ProgressStatus = "complete" | "current" | "todo";

const profileKey = "auto-casestudy-profile-context";

export function PortfolioProgress() {
  const artifacts = usePortfolioStore((state) => state.artifacts);
  const [profileReady, setProfileReady] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [issueState, setIssueState] = useState<GenerationReadinessResult["state"] | "unknown">("unknown");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(profileKey);
      if (stored) {
        const profile = JSON.parse(stored) as Record<string, string>;
        setProfileReady(Boolean(profile.name || profile.headline || profile.bio || profile.skills || profile.resumeContext));
      }
    } catch {
      setProfileReady(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadProgress() {
      try {
        const [draftResponse, issuesResponse] = await Promise.all([
          fetch("/api/portfolio-site-draft", { cache: "no-store", headers: workspaceRequestHeaders() }),
          fetch("/api/generation/readiness", { cache: "no-store", headers: workspaceRequestHeaders() })
        ]);
        const draftPayload = (await draftResponse.json()) as { draft?: PortfolioSiteDraft | null };
        const issuesPayload = (await issuesResponse.json()) as { readiness?: GenerationReadinessResult | null };
        if (cancelled) return;
        setDraftReady(Boolean(draftPayload.draft));
        setIssueState(issuesPayload.readiness?.state ?? "unknown");
      } catch {
        if (!cancelled) {
          setDraftReady(false);
          setIssueState("unknown");
        }
      }
    }
    loadProgress();
    return () => {
      cancelled = true;
    };
  }, []);

  const evidenceReady = artifacts.length > 0;
  const planReady = issueState === "ready-for-generation" || issueState === "needs-review";
  const publishReady = draftReady && issueState !== "blocked" && issueState !== "unknown";

  const steps = useMemo(
    () => [
      { label: "Profile", href: "/profile", complete: profileReady, current: !profileReady },
      { label: "Evidence", href: "/studio#ingest", complete: evidenceReady, current: profileReady && !evidenceReady },
      { label: "Plan", href: "/studio#strategy", complete: planReady, current: evidenceReady && !planReady },
      { label: "Draft", href: "/builder", complete: draftReady, current: planReady && !draftReady },
      { label: "Publish", href: "/publish", complete: publishReady, current: draftReady && !publishReady }
    ],
    [draftReady, evidenceReady, planReady, profileReady, publishReady]
  );

  return (
    <div className="border-t border-line/70 bg-background/75">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-faint">Portfolio progress</p>
        <ol className="flex min-w-0 flex-1 gap-2 overflow-x-auto" aria-label="Portfolio progress">
          {steps.map((step) => {
            const status: ProgressStatus = step.complete ? "complete" : step.current ? "current" : "todo";
            const Icon = status === "complete" ? CheckCircle2 : status === "current" ? CircleAlert : Circle;
            return (
              <li key={step.label} className="shrink-0">
                <Link
                  href={step.href}
                  className={cn(
                    "inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition",
                    status === "complete" && "border-emerald/25 bg-emerald/10 text-emerald",
                    status === "current" && "border-primary/30 bg-primary/10 text-primary",
                    status === "todo" && "border-line bg-panel text-muted hover:text-ink"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {step.label}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
