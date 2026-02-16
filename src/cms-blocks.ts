import type { CmsBlockSchemaMap } from "@vojtaholik/static-kit-core";

/**
 * CMS Block Schema Definitions
 *
 * These define the CMS editing interface for each block type.
 * They're transformed into Zod schemas at runtime via createSchemaFromCmsBlocks()
 */
export const cmsBlocks: CmsBlockSchemaMap = {
  hero: {
    type: "hero",
    label: "Hero Section",
    fields: {
      eyebrow: {
        type: "text",
        label: "Eyebrow Text",
        required: false,
      },
      headline: {
        type: "text",
        label: "Headline",
        required: true,
      },
      subheadline: {
        type: "text",
        label: "Subheadline",
        required: false,
      },
      primaryCta: {
        type: "link",
        label: "Primary CTA",
        required: false,
      },
      secondaryCta: {
        type: "link",
        label: "Secondary CTA",
        required: false,
      },
      backgroundImage: {
        type: "image",
        label: "Background Image",
        required: false,
      },
    },
  },

  featureGrid: {
    type: "featureGrid",
    label: "Feature Grid",
    fields: {
      headline: {
        type: "text",
        label: "Section Headline",
        required: false,
      },
      subheadline: {
        type: "text",
        label: "Section Subheadline",
        required: false,
      },
      columns: {
        type: "select",
        label: "Columns",
        required: false,
        options: [
          { label: "2 Columns", value: "2" },
          { label: "3 Columns", value: "3" },
          { label: "4 Columns", value: "4" },
        ],
        defaultValue: "3",
      },
      features: {
        type: "array",
        label: "Features",
        required: true,
        itemSchema: {
          type: "object",
          label: "Feature",
          fields: {
            icon: {
              type: "text",
              label: "Icon (emoji or icon name)",
              required: false,
            },
            title: {
              type: "text",
              label: "Title",
              required: true,
            },
            description: {
              type: "text",
              label: "Description",
              required: true,
            },
            link: {
              type: "link",
              label: "Link",
              required: false,
            },
          },
        },
      },
    },
  },

  latestPosts: {
    type: "latestPosts",
    label: "Latest Posts",
    fields: {
      headline: {
        type: "text",
        label: "Section Headline",
        required: false,
        defaultValue: "Latest Posts",
      },
      subheadline: {
        type: "text",
        label: "Section Subheadline",
        required: false,
      },
      count: {
        type: "number",
        label: "Number of Posts",
        required: false,
        defaultValue: 3,
      },
      posts: {
        type: "array",
        label: "Posts",
        required: true,
        itemSchema: {
          type: "object",
          label: "Post",
          fields: {
            title: {
              type: "text",
              label: "Title",
              required: true,
            },
            excerpt: {
              type: "text",
              label: "Excerpt",
              required: false,
            },
            date: {
              type: "text",
              label: "Date",
              required: false,
            },
            image: {
              type: "image",
              label: "Featured Image",
              required: false,
            },
            link: {
              type: "link",
              label: "Read More Link",
              required: true,
            },
          },
        },
      },
      viewAllLink: {
        type: "link",
        label: "View All Link",
        required: false,
      },
    },
  },

  textSection: {
    type: "textSection",
    label: "Text Section",
    fields: {
      eyebrow: {
        type: "text",
        label: "Eyebrow Text",
        required: false,
      },
      headline: {
        type: "text",
        label: "Headline",
        required: false,
      },
      body: {
        type: "richText",
        label: "Body Content",
        required: true,
      },
      cta: {
        type: "link",
        label: "Call to Action",
        required: false,
      },
    },
  },
};
