import type { PageConfig } from "@static-block-kit/core";

export const aboutPage: PageConfig = {
  id: "about",
  path: "/about",
  title: "About Static Kit",
  template: "base.html",
  density: "comfortable",
  regions: {
    main: {
      blocks: [
        {
          id: "hero-about",
          type: "hero",
          props: {
            title: "The Philosophy Behind Static Kit",
            links: [],
          },
          layout: {
            tone: "surface",
            contentAlign: "center",
            contentWidth: "narrow",
          },
        },
        {
          id: "text-mission",
          type: "sectionHeader",
          props: {
            eyebrow: "Our Mission",
            headline: "Simplicity Without Sacrifice",
            body: `
              <p>Static Kit was born from frustration with modern web development complexity. We wanted a tool that:</p>
              <ul>
                <li>Produces fast, accessible websites by default</li>
                <li>Doesn't require a JavaScript framework for content sites</li>
                <li>Makes content management intuitive for developers and content editors</li>
                <li>Stays out of your way while providing powerful abstractions</li>
              </ul>
              <p>The result is a static site generator that embraces HTML as the output format, TypeScript for type safety, and a simple block-based architecture that scales from landing pages to large marketing sites.</p>
            `,
          },
          layout: {
            tone: "surface",
            contentAlign: "left",
            contentWidth: "narrow",
          },
        },
        {
          id: "features-principles",
          type: "featureGrid",
          props: {
            headline: "Core Principles",
            columns: "2",
            features: [
              {
                icon: "📄",
                title: "HTML First",
                description:
                  "The web is built on HTML. We generate semantic, accessible markup that works everywhere.",
              },
              {
                icon: "🔒",
                title: "Type Safety",
                description:
                  "Every block prop, every page config, every template expression is type-checked.",
              },
              {
                icon: "🎯",
                title: "Zero Runtime",
                description:
                  "No framework JavaScript shipped to users. Add interactivity only where you need it.",
              },
              {
                icon: "🔌",
                title: "CMS Agnostic",
                description:
                  "Your content schemas work with any headless CMS. We don't lock you in.",
              },
            ],
          },
          layout: {
            tone: "raised",
            contentAlign: "center",
          },
        },
      ],
    },
  },
};
