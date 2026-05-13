import { PlaceholderPage } from "@/components/placeholder-page";

export default function TemplatesPage() {
  return (
    <PlaceholderPage
      eyebrow="Portfolio templates"
      title="Templates shape the site after the evidence is understood."
      description="Templates are presentation systems for the full portfolio website. They should not replace evidence mapping or professional narrative logic."
      items={[
        "UX researcher template with methods and findings emphasized.",
        "Product designer template with visuals, iterations, and final screens emphasized.",
        "Technical hybrid template with architecture, implementation, and credibility emphasized.",
        "Academic HCI template with provenance, rigor, and limitations emphasized."
      ]}
    />
  );
}
