import Link from "next/link";
import { ArrowRight, Construction } from "lucide-react";
import { SiteNav } from "@/components/site-nav";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
};

export function PlaceholderPage({ eyebrow, title, description, items }: PlaceholderPageProps) {
  return (
    <main className="min-h-dvh">
      <SiteNav />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-line bg-surface p-6 shadow-soft sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
            <Construction className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted">{description}</p>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <div key={item} className="rounded-lg border border-line bg-panel p-4 text-sm text-muted">
                {item}
              </div>
            ))}
          </div>

          <Link href="/studio#ingest" className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 font-semibold text-slateInk transition hover:bg-primary/90">
            Open portfolio studio <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </main>
  );
}
