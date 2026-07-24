import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { LogoMarquee } from "@/components/logo-marquee";
import { Stats } from "@/components/stats";
import { ServicesTabs } from "@/components/services-tabs";
import { WorkShowcase } from "@/components/work-showcase";
import { WhyUs } from "@/components/why-us";
import { Process } from "@/components/process";
import { CtaFooter } from "@/components/cta-footer";
import { getBrands } from "@/lib/queries/brands";
import { getServices } from "@/lib/queries/services";
import { getFeaturedProjects } from "@/lib/queries/projects";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [brands, services, featuredProjects] = await Promise.all([
    getBrands(),
    getServices(),
    getFeaturedProjects(),
  ]);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <LogoMarquee brands={brands} />
        <Stats />
        <ServicesTabs serviceCategories={services} />
        <WorkShowcase projects={featuredProjects} />
        <WhyUs />
        <Process />
        <CtaFooter />
      </main>
    </>
  );
}
