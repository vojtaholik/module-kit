import type { PageConfig } from "@static-block-kit/core";

export const indexPage: PageConfig = {
  id: "index",
  path: "/",
  title: "JAP",
  template: "base.html",
  density: "comfortable",
  regions: {
    main: {
      blocks: [
        {
          id: "hero-1",
          type: "hero",
          props: {
            title: "Jednokřídlá stavební pouzdra",
            links: [
              {
                href: "/poptavka",
                label: "Nezávazně poptejte",
              },
              {
                href: "/showroom",
                label: "Navštivte showrooom",
              },
              {
                href: "/prodejce",
                label: "Najděte prodejce",
              },
            ],
            backgroundImage: {
              src: "public/images/hero.jpg",
              alt: "Hero Background",
            },
          },
          layout: {
            tone: "accent",
            contentAlign: "center",
            contentWidth: "narrow",
          },
        },
        {
          id: "section-header-1",
          type: "sectionHeader",
          props: {
            headline: "Elegantní řešení",
            body: "<p>Jednokřídlé stavební pouzdro uplatníte při nové výstavbě či rekonstrukci. Je vhodné do obývacího pokoje, ložnice, kuchyně, komory, šatny, koupelny, toalety nebo pracovny.</p>",
          },
          // TODO: Add ability to have children within a block which calls another children, this way we can have a section as parent with different elements as children.
          layout: {
            contentAlign: "left",
          },
        },
        {
          id: "features-1",
          type: "featureGrid",
          props: {
            headline: "Why Static Kit?",
            subheadline:
              "Everything you need to build fast, maintainable static sites.",
            columns: "3",
            features: [
              {
                icon: "⚡",
                title: "Lightning Fast",
                description:
                  "Pre-rendered HTML with zero JavaScript by default. Your pages load instantly.",
              },
              {
                icon: "🧱",
                title: "Block-Based",
                description:
                  "Compose pages from reusable blocks with type-safe props and CMS-ready schemas.",
              },
              {
                icon: "🎨",
                title: "Design System Ready",
                description:
                  "Built-in layout primitives and design tokens. Customize everything with CSS.",
              },
              {
                icon: "📝",
                title: "CMS Compatible",
                description:
                  "Export your content schemas for use with any headless CMS.",
              },
              {
                icon: "🔧",
                title: "Developer Experience",
                description:
                  "Hot reload, TypeScript everywhere, and a simple mental model.",
              },
              {
                icon: "🚀",
                title: "Deploy Anywhere",
                description:
                  "Output is plain HTML/CSS/JS. Deploy to any static host.",
              },
            ],
          },
        },
        {
          id: "cta-1",
          type: "sectionHeader",
          props: {
            headline: "Jednokřídlá stavební pouzdra",
            body: "<p>Jednokřídlá stavební pouzdra jsou ideální pro domácnosti a malé firmy. Mají velkou vnitřní plochu a jsou velmi odolné.</p>",
            image: {
              src: "public/images/section-header.jpg",
              alt: "Section Header Image",
            },
          },
          layout: {
            contentAlign: "left",
          },
        },
      ],
    },
  },
};
