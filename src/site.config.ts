// Edit this file to re-label the entire site. Header, Footer, the homepage
// and SEO defaults all read from here instead of hardcoding copy.
export const SITE = {
  name: 'Samuel Romero',
  role: 'Software Development Student',
  email: 'tu-email@ejemplo.com',
  tagline: 'I design and build interfaces that hold up under real use.',
  description:
    'Portfolio — with an emphasis on speed, clarity, and details.',
  status: 'Open to new work',
  social: [
    { label: 'GitHub', href: 'https://github.com/Sromerot' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/tu-usuario' },
    { label: 'X', href: 'https://x.com/tu-usuario' },
  ],
  locale: 'en',
} as const;

export const NAV_LINKS = [
  { label: 'Work', href: `${import.meta.env.BASE_URL}work` },
  { label: 'About', href: `${import.meta.env.BASE_URL}about` },
] as const;
