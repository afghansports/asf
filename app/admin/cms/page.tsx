import Link from "next/link";
import {
  ArrowRight,
  Layout,
  Trophy,
  Mail,
  Image as ImageIcon,
  FileText,
  Layers,
  Users,
  Newspaper,
  Building2,
  HelpCircle,
  Clock,
} from "lucide-react";

export const metadata = { title: "Admin CMS" };

type Section = {
  href: string;
  label: string;
  description: string;
  icon: typeof Layout;
  group: "site" | "content" | "people";
};

const SECTIONS: Section[] = [
  // Site copy — site_content table
  { href: "/admin/cms/hero",      label: "Hero Section",        description: "Homepage video hero title, subtitle, CTA buttons.",      icon: Layout,    group: "site" },
  { href: "/admin/cms/homepage",  label: "Homepage Sections",   description: "About teaser, stats bar, newsletter title.",              icon: Layers,    group: "site" },
  { href: "/admin/cms/about",     label: "About Page",          description: "Story, mission, vision, values, long-term goals.",       icon: FileText,  group: "site" },
  { href: "/admin/cms/afghancup", label: "Afghan Cup Settings", description: "Cup banner, date, location, registration window.",       icon: Trophy,    group: "site" },
  { href: "/admin/cms/contact",   label: "Contact Info",        description: "Address, email, phone, social links.",                    icon: Mail,      group: "site" },
  { href: "/admin/cms/footer",    label: "Footer",              description: "Footer description and copyright text.",                  icon: ImageIcon, group: "site" },

  // Long-form + structured
  { href: "/admin/news",          label: "News",                description: "Articles with hero images, body, publish toggle.",        icon: Newspaper, group: "content" },
  { href: "/admin/gallery",       label: "Gallery",             description: "Photo gallery — upload, caption, tag, year.",        icon: ImageIcon, group: "content" },
  { href: "/admin/faq",           label: "FAQ",                 description: "Question + answer pairs grouped by category.",            icon: HelpCircle,group: "content" },
  { href: "/admin/history",       label: "History timeline",    description: "Year-by-year ASF milestones for the About page.",         icon: Clock,     group: "content" },

  // People + partners
  { href: "/admin/team-members",  label: "ASF Team",            description: "Team members by category (management, alumni). Photo, role, bio.", icon: Users,     group: "people" },
  { href: "/admin/sponsors",      label: "Sponsors",            description: "Sponsor logo, tier, website, active toggle.",             icon: Building2, group: "people" },
];

const GROUP_LABELS: Record<Section["group"], string> = {
  site:    "Site copy",
  content: "Long-form content",
  people:  "People + partners",
};

export default function CmsLandingPage() {
  const groups: Record<Section["group"], Section[]> = { site: [], content: [], people: [] };
  for (const s of SECTIONS) groups[s.group].push(s);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
      <header className="mb-8">
        <h1 className="font-display font-black text-3xl text-asf-text">Content management</h1>
        <p className="text-sm text-asf-muted mt-1 max-w-2xl">
          Edit every visible string, image, person, and partner on the public site. Changes go live immediately after saving.
        </p>
      </header>

      <div className="space-y-10">
        {(Object.keys(groups) as Section["group"][]).map((g) => (
          <section key={g}>
            <p className="font-condensed font-bold text-[0.7rem] tracking-[0.22em] uppercase text-asf-muted mb-3">
              {GROUP_LABELS[g]}
            </p>
            <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {groups[g].map((s) => {
                const Icon = s.icon;
                return (
                  <li key={s.href}>
                    <Link
                      href={s.href}
                      className="group flex flex-col gap-3 p-5 h-full rounded-lg bg-white border border-asf-border hover:border-asf-red/50 hover:shadow-sm transition-all"
                    >
                      <span className="inline-flex w-10 h-10 rounded-full bg-asf-red/10 items-center justify-center text-asf-red">
                        <Icon className="w-5 h-5" aria-hidden />
                      </span>
                      <h2 className="font-display font-bold text-base text-asf-text">{s.label}</h2>
                      <p className="text-sm text-asf-muted leading-relaxed flex-1">{s.description}</p>
                      <span className="inline-flex items-center gap-1 font-condensed font-bold text-[0.7rem] tracking-[0.18em] uppercase text-asf-red mt-auto">
                        Edit
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
