/**
 * What changes between the CCM and AVC long videos: the name, the link, the colours and the little logo mark. The
 * structure, timing and sound are the Voho videos' (scripts/voho/build-long.mjs), shared by scripts/long/build.mjs.
 */
export const BRAND = {
  ccm: {
    name: 'Claude Codex Mastery', cast: 'bit', lead: 'Bit',
    url: 'skool.com/yar-ai-automation-school-9911', link: 'https://www.skool.com/yar-ai-automation-school-9911/about',
    accent: '#DC5A2B', accentInk: '#FFF5E2', pill: '#243158', word: '#FFB38A', kick: '#243158',
    endcard: 'Build it with Claude Code, tonight',
    skool: { cover: 'content/skool/ccm-cover.png', members: 424, price: '$29/month', asOf: '2026-09-26' },   // the Skool about page; refresh the count
    cta: 'Join 424 builders in Claude Codex Mastery',
    // Bit's screen: a navy rounded square with a prompt
    mark: (s) => `<svg viewBox="0 0 64 64" width="${s}" height="${s}" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#3A4C80"/><rect x="9" y="12" width="46" height="34" rx="6" fill="#FFF5E2"/><path d="M17 23 l7 6 -7 6" stroke="#FE5D08" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="28" y="33" width="14" height="4" rx="2" fill="#3A4C80"/><rect x="18" y="50" width="10" height="5" rx="2.5" fill="#FE5D08"/><rect x="36" y="50" width="10" height="5" rx="2.5" fill="#FE5D08"/></svg>`,
  },
  avc: {
    name: 'AI Video Club', cast: 'clappy', lead: 'Clappy',
    url: 'skool.com/aivideo-1153', link: 'https://www.skool.com/aivideo-1153/about',
    accent: '#FBE70C', accentInk: '#171318', pill: '#171318', word: '#FBE70C', kick: '#171318',
    endcard: 'Make it with AI, sell it tomorrow',
    skool: { cover: 'content/skool/avc-cover.png', members: 101, price: '$29/month', asOf: '2026-09-26' },
    cta: 'Join 101 creators in AI Video Club',
    // Clappy: a yellow slate with its striped clapper
    mark: (s) => `<svg viewBox="0 0 64 64" width="${s}" height="${s}" aria-hidden="true"><rect y="18" width="64" height="46" rx="10" fill="#FBE70C"/><rect x="4" y="50" width="56" height="6" rx="3" fill="#0C5CB6"/><g transform="rotate(-14 4 16)"><rect x="4" y="6" width="58" height="11" rx="2" fill="#171318"/><path d="M12 6h8l-6 11h-8zM30 6h8l-6 11h-8zM48 6h8l-6 11h-8z" fill="#FBE70C"/></g></svg>`,
  },
}
