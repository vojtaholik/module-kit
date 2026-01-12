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
          layout: {
            contentAlign: "left",
            tone: "raised",
          },
        },
        {
          id: "grid-1",
          type: "grid",
          layout: {
            tone: "raised",
          },
          props: {
            itemBlock: "teaser",
            columns: "5",
            items: [
              {
                title: "Stavební pouzdra",
                subtitle: "Lorem ipsum",
                image: {
                  src: "public/images/teaser1.jpg",
                  alt: "Stavební pouzdra",
                },
                link: {
                  href: "/stavebni-pouzdra",
                  label: "Stavební pouzdra",
                },
              },
              {
                title: "Půdní schody",
                subtitle: "Lorem ipsum",
                image: {
                  src: "public/images/teaser2.jpg",
                  alt: "Půdní schody",
                },
                link: {
                  href: "/pudni-schody",
                  label: "Půdní schody",
                },
              },
              {
                title: "Zárubně",
                subtitle: "Lorem ipsum",
                image: {
                  src: "public/images/teaser3.jpg",
                  alt: "Zárubně",
                },
                link: {
                  href: "/zarubne",
                  label: "Zárubně",
                },
              },
              {
                title: "Dveře",
                subtitle: "Lorem ipsum",
                image: {
                  src: "public/images/teaser4.jpg",
                  alt: "Dveře",
                },
                link: {
                  href: "/dvere",
                  label: "Dveře",
                },
              },
              {
                title: "Posuvy",
                subtitle: "Lorem ipsum",
                image: {
                  src: "public/images/teaser5.jpg",
                  alt: "Posuvy",
                },
                link: {
                  href: "/posuvy",
                  label: "Posuvy",
                },
              },
              {
                title: "Skleněné stěny",
                subtitle: "Lorem ipsum",
                image: {
                  src: "public/images/teaser6.jpg",
                  alt: "Skleněné stěny",
                },
                link: {
                  href: "/sklenene-steny",
                  label: "Skleněné stěny",
                },
              },
              {
                title: "Grafosklo",
                subtitle: "Lorem ipsum",
                image: {
                  src: "public/images/teaser7.jpg",
                  alt: "Grafosklo",
                },
                link: {
                  href: "/grafosklo",
                  label: "Grafosklo",
                },
              },
              {
                title: "Obkladové systémy",
                subtitle: "Lorem ipsum",
                image: {
                  src: "public/images/teaser8.jpg",
                  alt: "Obkladové systémy",
                },
                link: {
                  href: "/obkladove-systemy",
                  label: "Obkladové systémy",
                },
              },
              {
                title: "Schodiště",
                subtitle: "Lorem ipsum",
                image: {
                  src: "public/images/teaser9.jpg",
                  alt: "Schodiště",
                },
                link: {
                  href: "/schodiste",
                  label: "Schodiště",
                },
              },
              {
                title: "Soklové lišty",
                subtitle: "Lorem ipsum",
                image: {
                  src: "public/images/teaser10.jpg",
                  alt: "Soklové lišty",
                },
                link: {
                  href: "/soklove-listy",
                  label: "Soklové lišty",
                },
              },
              {
                title: "Zábradlí",
                subtitle: "Lorem ipsum",
                image: {
                  src: "public/images/teaser11.jpg",
                  alt: "Zábradlí",
                },
                link: {
                  href: "/zabradli",
                  label: "Zábradlí",
                },
              },
              {
                title: "Stříšky",
                subtitle: "Lorem ipsum",
                image: {
                  src: "public/images/teaser12.jpg",
                  alt: "Stříšky",
                },
                link: {
                  href: "/strisky",
                  label: "Stříšky",
                },
              },
              {
                title: "Vchodový systém",
                subtitle: "Lorem ipsum",
                image: {
                  src: "public/images/teaser1.jpg",
                  alt: "Vchodový systém",
                },
                link: {
                  href: "/vchodovy-system",
                  label: "Vchodový systém",
                },
              },
            ],
          },
        },
        {
          id: "collections-header",
          type: "sectionHeader",
          props: {
            headline: "Vybíráme z našich kolekcí",
            body: "",
            cta: {
              href: "/kolekce",
              label: "Kompletní kolekce",
            },
          },
          layout: {
            tone: "inverted",
            contentAlign: "left",
          },
        },
        {
          id: "collections-bento",
          type: "bentoShowcase",
          props: {
            featured: {
              title: "Zárubně",
              description: "Elegantní posuv\nPremium šatny i koupelny",
              image: {
                src: "public/images/teaser3.jpg",
                alt: "Zárubně",
              },
              href: "/kolekce/zarubne",
            },
            items: [
              {
                title: "Aktive 40/00",
                description:
                  "je určena k otevírání bezpolodrážkových dveří směrem k sobě z pohledové strany.",
                image: {
                  src: "public/images/teaser9.jpg",
                  alt: "Aktive 40/00",
                },
                href: "/kolekce/aktive",
              },
              {
                title: "Dveře Master",
                description: "Nadčasově minimalistické dveře Master",
                image: {
                  src: "public/images/teaser4.jpg",
                  alt: "Dveře Master",
                },
                href: "/kolekce/dvere-master",
              },
            ],
          },
          layout: {
            tone: "inverted",
          },
        },
        {
          id: "reference-header",
          type: "sectionHeader",
          props: {
            headline: "Reference",
            body: "Naše práce mluví za nás. Naše řešení najdete v domku mladé rodiny, ale i v realizacích zvučných architektů, nebo třeba u dubajských šejků.",
            cta: {
              href: "/reference",
              label: "Zobrazit všechny",
            },
          },
          layout: {
            tone: "surface",
            contentAlign: "left",
          },
        },
        {
          id: "reference-carousel",
          type: "carousel",
          props: {
            variant: "reference",
            items: [
              {
                title: "Jídelna Koma Modular",
                subtitle: "Obklady & grafosklo",
                image: {
                  src: "public/images/ref-koma-modular.jpg",
                  alt: "Jídelna Koma Modular",
                },
                href: "/reference/jidelna-koma-modular",
              },
              {
                title: "Schodiště v rodinném domě",
                subtitle: "Schodiště",
                image: {
                  src: "public/images/ref-schodiste-rodinny-dum.jpg",
                  alt: "Schodiště v rodinném domě",
                },
                href: "/reference/schodiste-rodinny-dum",
              },
              {
                title: "Projekt Chlum",
                subtitle: "Prémiové dveře",
                image: {
                  src: "public/images/ref-projekt-chlum.jpg",
                  alt: "Projekt Chlum",
                },
                href: "/reference/projekt-chlum",
              },
              {
                title: "Pístovický mlýn",
                subtitle: "Prémiové dveře",
                image: {
                  src: "public/images/ref-pistovicky-mlyn.jpg",
                  alt: "Pístovický mlýn",
                },
                href: "/reference/pistovicky-mlyn",
              },
              {
                title: "Schodiště Laser",
                subtitle: "Schodiště",
                image: {
                  src: "public/images/ref-schodiste-laser.jpg",
                  alt: "Schodiště Laser",
                },
                href: "/reference/schodiste-laser",
              },
            ],
          },
          layout: {
            tone: "surface",
          },
        },
        {
          id: "business-card-1",
          type: "businessCard",
          props: {
            headline: "Rádi vám s výběrem pomůžeme",
            body: "Naše řešení najdete v domku mladé rodiny, ale i v realizacích zvučných architektů, nebo třeba u dubajských šejků.",
            primaryCta: {
              href: "/poptavka",
              label: "Poslat poptávku",
            },
            contactLinks: [
              {
                href: "mailto:ales.vyskocil@japcz.cz",
                label: "ales.vyskocil@japcz.cz",
              },
              {
                href: "tel:+420724996673",
                label: "+420 724 996 673",
              },
            ],
            contactPerson: {
              name: "Aleš Vyskočil",
              title: "Obchodně-technický poradce",
              regions:
                "Moravskoslezský kraj, Olomoucký kraj, Zlínský kraj (Vsetín)",
              image: {
                src: "public/images/ales-vyskocil.jpg",
                alt: "Aleš Vyskočil",
              },
            },
          },
        },
        {
          id: "cta-1",
          type: "sectionHeader",
          props: {
            headline: "Vlastnosti dané kategorie",
            body: "<p>Rychlé rozložení i složení žebříku a jednoduchá manipulace zajišťují komfortní používání. Dbáme na kvalitu použitých materiálů a důmyslné zpracování, proto se půdní schody JAP vyznačují dlouhou životností a vysokou odolností.</p>",
            image: {
              src: "public/images/1.jpg",
              alt: "Section Image",
            },
          },
          layout: {
            contentAlign: "split-start",
          },
        },
        {
          id: "cta-1",
          type: "sectionHeader",
          props: {
            headline: "Vlastnosti dané kategorie",
            body: "<p>Rychlé rozložení i složení žebříku a jednoduchá manipulace zajišťují komfortní používání. Dbáme na kvalitu použitých materiálů a důmyslné zpracování, proto se půdní schody JAP vyznačují dlouhou životností a vysokou odolností.</p>",
            image: {
              src: "public/images/2.jpg",
              alt: "Section Image",
            },
          },
          layout: {
            contentAlign: "split-end",
          },
        },
      ],
    },
  },
};
