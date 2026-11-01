import { audiences, differentiators, hero, reasons } from "@/content/home";
import { getServices } from "@/content/services";
import { getArticles } from "@/content/insights";
import { siteConfig } from "@/lib/site-config";
import { ButtonLink, TextLink } from "@/components/ui/button";
import { Icon, IconTile } from "@/components/ui/icon";
import { Container, Section, SectionHeader } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { AiAgentVisual } from "@/components/visuals/ai-agent-visual";
import { AiBackdrop } from "@/components/visuals/ai-backdrop";
import { Marquee } from "@/components/ui/marquee";
import { TiltCard } from "@/components/ui/tilt-card";
import { TeamAvatar } from "@/components/team/team-card";
import { getTeamMembers } from "@/lib/data/team";
import { getProducts, productsHeading, productsIntro } from "@/content/products";
import { ProductCard } from "@/components/products/product-ui";
import { ArticleCard, ServiceCard } from "./cards";

export function HomeHero() {
  const building = getProducts().find((p) => p.status === "in-development");
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-gradient-to-b from-mist via-white to-white">
      <AiBackdrop />
      <Container className="relative grid items-center gap-16 pt-12 pb-12 sm:pt-16 lg:grid-cols-12 lg:gap-10 lg:pt-20">
        <div className="lg:col-span-6 xl:col-span-6">
          {building ? (
            <Link
              href={`/work/${building.slug}`}
              className="glass group inline-flex items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 text-sm font-medium text-navy-900"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cobalt-600 to-violet-700 px-2.5 py-0.5 text-xs font-semibold text-white">
                <Sparkles aria-hidden="true" className="size-3" />
                Now building
              </span>
              {building.name}
              <ArrowRight aria-hidden="true" className="size-4 text-cobalt-700 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <p className="eyebrow">{hero.eyebrow.join(" × ")}</p>
          )}
          <h1
            id="hero-heading"
            className="mt-6 text-[2.6rem] leading-[1.04] font-bold tracking-[-0.035em] xs:text-5xl sm:text-6xl xl:text-[4.25rem]"
          >
            {hero.headline.map((line) => (
              <span key={line} className="block">
                {line}{" "}
              </span>
            ))}
            <span className="text-gradient-ai block pb-1">{hero.highlight}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">{hero.body}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={siteConfig.cta.primary.href} size="lg" arrow>
              {siteConfig.cta.primary.label}
            </ButtonLink>
            <ButtonLink href={siteConfig.cta.secondary.href} size="lg" variant="secondary">
              {siteConfig.cta.secondary.label}
            </ButtonLink>
          </div>
          <p className="mt-6 text-sm font-medium text-navy-800">{siteConfig.tagline}</p>
        </div>
        <div className="lg:col-span-6 xl:col-span-6">
          <AiAgentVisual />
        </div>
      </Container>
      <Container className="relative pb-14 lg:pb-16">
        <Marquee items={capabilityMarquee} label="What we build" />
      </Container>
    </section>
  );
}

const capabilityMarquee = [
  "AI agents",
  "LLM applications",
  "Knowledge search (RAG)",
  "Workflow automation",
  "Web applications",
  "Mobile apps",
  "Data pipelines",
  "System integrations",
  "Dashboards & analytics",
  "Cloud & DevOps",
];

export function DifferentiatorStrip() {
  return (
    <section aria-label="What sets us apart" className="border-y border-line bg-paper">
      <Container>
        <ul className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          {differentiators.map((d) => (
            <li key={d.title} className="flex items-center gap-3.5 py-5 sm:px-4 lg:py-6 lg:first:pl-0">
              <Icon name={d.icon} className="size-6 shrink-0 text-cobalt-600" />
              <div>
                <p className="text-sm font-semibold text-navy-900">{d.title}</p>
                <p className="text-sm text-slate-600">{d.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function WhatWeDo() {
  return (
    <Section labelledBy="services-heading">
      <Container>
        <SectionHeader
          id="services-heading"
          eyebrow="What we do"
          title="End-to-end software development & IT consulting"
          description="From the first idea to long-term growth, we help you plan, build, launch, and improve the software your business depends on."
          action={<TextLink href="/services">View all services</TextLink>}
        />
        <Reveal stagger>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {getServices().map((service) => (
              <li key={service.slug}>
                <ServiceCard service={service} />
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
}

export function ProductsShowcase() {
  return (
    <Section tone="mist" labelledBy="products-home-heading">
      <Container>
        <SectionHeader
          id="products-home-heading"
          eyebrow={`${siteConfig.name} Products`}
          title={productsHeading(siteConfig.name)}
          description={`${productsIntro} See the AI products we're building in-house — what each one does, and exactly where it stands.`}
          action={<TextLink href="/work#products">See our products</TextLink>}
        />
        <Reveal stagger>
          <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {getProducts().map((product) => (
              <li key={product.slug}>
                <TiltCard className="rounded-2xl">
                  <ProductCard product={product} />
                </TiltCard>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
}

export function Audiences() {
  return (
    <Section labelledBy="audiences-heading">
      <Container>
        <SectionHeader
          id="audiences-heading"
          eyebrow="Who we help"
          title="Built for people with something to build"
          description="Whether you're starting from a napkin sketch or scaling an established product, we meet you where you are."
        />
        <Reveal stagger>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map((a) => (
              <li key={a.title} className="rounded-2xl bg-white p-6 ring-1 ring-line">
                <IconTile name={a.icon} />
                <h3 className="mt-5 text-lg font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{a.body}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
}

export function WhyUs() {
  return (
    <Section tone="mist" labelledBy="why-heading">
      <Container className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeader
            id="why-heading"
            eyebrow="Why work with us"
            title="A partner that cares about the outcome"
            description="Great software comes from understanding the problem, communicating clearly, and making careful technical decisions. That's how we work on every project, large or small."
          />
          <div className="mt-8">
            <ButtonLink href="/about" variant="secondary" arrow>
              About {siteConfig.name}
            </ButtonLink>
          </div>
        </div>
        <Reveal className="lg:col-span-7">
          <ul className="grid gap-5 sm:grid-cols-2">
            {reasons.map((r) => (
              <li key={r.title} className="rounded-2xl bg-white p-6 ring-1 ring-line">
                <IconTile name={r.icon} />
                <h3 className="mt-5 text-base font-semibold">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.body}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
}

export async function FounderStory() {
  const leadership = (await getTeamMembers()).filter((m) => m.group === "leadership");
  return (
    <Section labelledBy="story-heading">
      <Container>
        <Reveal stagger>
          <div className="grid overflow-hidden rounded-[2rem] bg-navy-900 lg:grid-cols-12">
            <div className="relative p-8 sm:p-12 lg:col-span-7">
              <p className="eyebrow text-cobalt-300">Our story</p>
              <h2 id="story-heading" className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Why {siteConfig.name} exists
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-300">
                <p>
                  Too many good ideas stall between the whiteboard and the app store. Founders get stuck choosing between
                  agencies that feel out of reach and freelancers who disappear after launch. Growing businesses wait
                  months for software that should take weeks to plan.
                </p>
                <p>
                  {siteConfig.name} was started to close that gap: a small, senior-led team that treats your product
                  like it matters, explains every decision in plain language, and stays honest about trade-offs — even
                  when that means recommending less.
                </p>
              </div>
              {siteConfig.leadershipNote && (
                <figure className="mt-8 border-l-2 border-cobalt-400 pl-5">
                  <blockquote className="text-white">{siteConfig.leadershipNote.body}</blockquote>
                  <figcaption className="mt-2 text-sm text-slate-400">— {siteConfig.leadershipNote.signature}</figcaption>
                </figure>
              )}
              <div className="mt-8 border-t border-white/10 pt-8">
                <h3 className="text-sm font-semibold tracking-wide text-cobalt-200 uppercase">Meet the people behind {siteConfig.name}</h3>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {leadership.map((m) => (
                    <li key={m.name} className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                      <TeamAvatar member={m} size="md" />
                      <span>
                        <span className="block font-semibold text-white">{m.name}</span>
                        <span className="block text-sm text-slate-300">{m.role}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6">
                <ButtonLink href="/about" variant="inverse" arrow>
                  Meet the Team
                </ButtonLink>
              </div>
            </div>
            <div aria-hidden="true" className="relative hidden min-h-72 lg:col-span-5 lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-cobalt-600 to-cobalt-800" />
              <div className="bg-grid absolute inset-0 opacity-40 mix-blend-overlay" />
              <div className="absolute inset-0 flex items-center justify-center p-10">
                <p className="text-4xl leading-tight font-semibold tracking-tight text-white/95">
                  You bring the idea.
                  <span className="block text-cobalt-200">We help make it real.</span>
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

/** Deliberately compact: recruiting is visible on the homepage without competing with the customer CTA. */
export function RecruitingAnnouncement() {
  return (
    <section aria-labelledby="hiring-heading" className="bg-white">
      <Container>
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-paper px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-success-700" />
            <div>
              <h2 id="hiring-heading" className="text-base font-semibold">
                We&apos;re growing.
              </h2>
              <p className="text-sm text-slate-600">We&apos;re hiring for remote roles — see what&apos;s open and how we work.</p>
            </div>
          </div>
          <TextLink href="/careers" className="shrink-0">
            {siteConfig.cta.careers.label}
          </TextLink>
        </div>
      </Container>
    </section>
  );
}

export function InsightsPreview() {
  const articles = getArticles().slice(0, 3);
  return (
    <Section labelledBy="insights-heading">
      <Container>
        <SectionHeader
          id="insights-heading"
          eyebrow="Insights"
          title="Ideas, insights & practical knowledge"
          description="Straightforward guides for founders and teams planning their next piece of software."
          action={<TextLink href="/insights">Read all insights</TextLink>}
        />
        <Reveal stagger>
          <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <li key={article.slug}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
}
