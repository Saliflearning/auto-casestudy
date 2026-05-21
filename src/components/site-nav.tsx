"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { internalProductRoutes, productRoutes } from "@/lib/product-flow";
import { cn } from "@/lib/utils";

export function SiteNav() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  function isActive(href: string) {
    const [path, itemHash] = href.split("#");
    if (pathname !== path) return false;
    if (!itemHash) return pathname === href && !hash;
    return hash === `#${itemHash}`;
  }

  const navItems = pathname === "/references" ? [...productRoutes, ...internalProductRoutes] : productRoutes;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex min-h-11 items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
            <Bot className="h-5 w-5 text-primary" aria-hidden />
          </span>
          <span>
            <span className="block text-base font-bold text-ink">Auto-CaseStudy</span>
            <span className="block text-xs uppercase tracking-[0.2em] text-muted">Portfolio builder</span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-wrap justify-start gap-1 sm:justify-center" aria-label="Primary">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={item.responsibility}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition hover:bg-panel hover:text-ink",
                  active ? "bg-panel text-ink" : "text-muted"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link href="/studio#ingest" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 font-semibold text-slateInk transition hover:bg-primary/90">
          <Upload className="h-4 w-4" aria-hidden />
          Start
        </Link>
      </div>
    </header>
  );
}
