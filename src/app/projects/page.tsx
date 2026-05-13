import { PlaceholderPage } from "@/components/placeholder-page";

export default function ProjectsPage() {
  return (
    <PlaceholderPage
      eyebrow="Portfolio structure"
      title="Projects become a portfolio library, not one case study."
      description="This page will hold generated project cards, multiple case studies, technical projects, and evidence-backed project pages."
      items={[
        "Project cards grouped by school, work, and independent builds.",
        "Expanded case studies with problem, role, methods, decisions, outcome, and reflection.",
        "Resume and skill claims linked back to supporting project evidence.",
        "Empty states for users who have not uploaded artifacts yet."
      ]}
    />
  );
}
