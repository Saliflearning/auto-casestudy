import { NavigationItemPlan } from "@/lib/portfolio-experience-types";

export function buildNavigationArchitecture(projectCount: number): NavigationItemPlan[] {
  return [
    {
      id: "home",
      label: "Home",
      destination: "/",
      priority: "primary",
      mobileBehavior: "top-level",
      rationale: "The homepage owns professional positioning and the first proof of credibility."
    },
    {
      id: "projects",
      label: "Projects",
      destination: "/projects",
      priority: "primary",
      mobileBehavior: "top-level",
      rationale: projectCount > 1 ? "Projects need direct access because recruiters scan work before reading biography." : "Projects stays primary because the first case study is the product proof."
    },
    {
      id: "about",
      label: "About",
      destination: "/about",
      priority: "secondary",
      mobileBehavior: "collapsed",
      rationale: "Profile context supports the work but should not block the first project click."
    },
    {
      id: "resume",
      label: "Resume",
      destination: "/resume",
      priority: "secondary",
      mobileBehavior: "collapsed",
      rationale: "Resume belongs in the recruiter path after project proof is visible."
    },
    {
      id: "contact",
      label: "Contact",
      destination: "/contact",
      priority: "utility",
      mobileBehavior: "top-level",
      rationale: "Recruiter handoff must remain reachable from every screen."
    }
  ];
}
