// Edit this file to re-label the entire site. Header, Footer, the homepage
// and SEO defaults all read from here instead of hardcoding copy.
export const SITE = {
  name: 'Samuel Romero',
  role: 'Software Development Student',
  email: 'sromerot@unbosque.edu.co',
  tagline: 'Diseño y construyo sistemas robustos, estructurados y eficientes.',
  description:
    'Portfolio — with an emphasis on speed, clarity, and details.',
  status: 'Open to new work',
  social: [
    { label: 'GitHub', href: 'https://github.com/Sromerot' },
  ],
  locale: 'es',
} as const;

export const NAV_LINKS = [
  { label: 'Work', href: `${import.meta.env.BASE_URL}work` },
  { label: 'About Me', href: `${import.meta.env.BASE_URL}about` },
] as const;
