import type { PageConfig } from "@static-block-kit/core";

export const indexPage: PageConfig = {
  id: "home",
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
            eyebrow: "Introducing Static Kit",
            headline: "Build Beautiful Static Sites",
            subheadline:
              "A modern static site generator with block-based content management and a Vue-like template DSL.",
            primaryCta: {
              href: "/docs/getting-started",
              label: "Get Started",
            },
            secondaryCta: {
              href: "/about",
              label: "Learn More",
            },
          },
          layout: {
            tone: "accent",
            contentAlign: "center",
            contentWidth: "narrow",
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
          layout: {
            tone: "surface",
            contentAlign: "center",
          },
        },
        {
          id: "cta-1",
          type: "textSection",
          props: {
            headline: "Ready to build?",
            body: "<p>Get started with Static Kit in minutes. Install the CLI, create a new project, and start building beautiful static sites.</p>",
            cta: {
              href: "/docs/getting-started",
              label: "Read the Docs",
            },
          },
          layout: {
            tone: "raised",
            contentAlign: "center",
            contentWidth: "narrow",
          },
        },
      ],
    },
  },
};
