/**
 * Every channel each product posts to, and which tool reaches it. The posting scripts read this; the product skills
 * (.claude/skills/<product>-content/SKILL.md) show the same table for people. Checked against
 * `postiz integrations:list` and `socialit.mjs accounts` on 2026-09-26.
 *
 * Postiz is capped on Yar's plan, so anything Socialit can reach goes through Socialit. LinkedIn and X are only on
 * Postiz. Team Yar Malik YouTube is for test uploads shared with the team, never for real posts.
 */
export const POSTIZ = {
  youtubeMain: 'cmpzh3t3400ixqf0y1di49yqj',     // Yar Malik (@YarMalikVibe): every real CCM/AVC short and long video
  youtubeTeam: 'cmtooktty11pulm0yvijnj8uz',     // Team Yar Malik: test uploads only
  x: 'cmpzh6pah00jmob0ymx88rpe5',               // Yar Malik on X (@yarmalikAI)
  igYarmalikhere: 'cme19ly650083mr0y1hkonkhw',  // Instagram @yarmalikhere, Yar's main account = AVC's
  igCcm: 'cmtfy4y0301nbt00yda1h1bz9',           // Instagram @yar.claudecodex.mastery (Socialit reaches it too)
  liVoho: 'cmuh0a87o035ppr0yvt9yqpy9',          // LinkedIn Page: Voho
  liAvc: 'cmtfy9vj601qyoc0y62pnt8ub',           // LinkedIn Page: AI Video Club
  liCcm: 'cmuh1a10z03kco80yo0s7bcch',           // LinkedIn Page: "Claude ChatGPT Mastery" (that's CCM's, by design)
}

// Names understood by `node scripts/content/socialit.mjs post --to <name>`
export const SOCIALIT = {
  'voho-youtube': { id: 'sa_4JorEMfmGDq9PoHP3WQpAkOWesy', platform: 'youtube' },
  'voho-instagram': { id: 'sa_4JorlI0pcGxUZCnDXVctRLaBzwv', platform: 'instagram', handle: 'vohoaicalling' },
  'voho-facebook': { id: 'sa_4JoxpmxqbDKrJ7EQmrTMIYV9wBd', platform: 'meta' },
  'ccm-instagram': { id: 'sa_4JorGV7srrKCuwjXjyH3OLuMRDd', platform: 'instagram', handle: 'yar.claudecodex.mastery' },
  'ccm-facebook': { id: 'sa_4Jp5IUnW4ugcfLpyyzh6dXWb0p3', platform: 'meta' },   // Claude Code & Codex Mastery Page
  'avc-facebook': { id: 'sa_4Jp5IUnW4ugcfLpzLMOusZGYU7r', platform: 'meta' },   // AI Video Club Page
  'yar-threads': { id: 'sa_4Jp5BKgo2ieJd4R4Ll0YLRsmFbR', platform: 'threads' }, // @yarmalikhere (connected, not in the plan)
  'yar-tiktok': { id: 'sa_4Jp2UJxIaP2qC04ZM1y6e6Zhgmm', platform: 'tiktok' },   // Yar Malik | AI (connected, not in the plan)
}

/* Where each piece goes, per product. `via` is postiz | socialit; `to` is a key above. */
export const ROUTES = {
  voho: {
    long:    [{ via: 'socialit', to: 'voho-youtube' }, { via: 'postiz', to: 'liVoho' }],
    reel:    [{ via: 'socialit', to: 'voho-instagram' }, { via: 'socialit', to: 'voho-facebook' }],
    igDeck:  [{ via: 'socialit', to: 'voho-instagram' }],
    liDeck:  [{ via: 'postiz', to: 'liVoho' }],
    liPost:  [{ via: 'postiz', to: 'liVoho' }],
    tweet:   [{ via: 'postiz', to: 'x' }],
    article: [{ via: 'postiz', to: 'x' }],
  },
  ccm: {
    long:    [{ via: 'postiz', to: 'youtubeMain' }, { via: 'postiz', to: 'liCcm' }],
    reel:    [{ via: 'postiz', to: 'youtubeMain' }, { via: 'socialit', to: 'ccm-instagram' }, { via: 'socialit', to: 'ccm-facebook' }],
    igDeck:  [{ via: 'socialit', to: 'ccm-instagram' }],
    liDeck:  [{ via: 'postiz', to: 'liCcm' }],
    liPost:  [{ via: 'postiz', to: 'liCcm' }],
    tweet:   [{ via: 'postiz', to: 'x' }],
    article: [{ via: 'postiz', to: 'x' }],
  },
  avc: {
    long:    [{ via: 'postiz', to: 'youtubeMain' }, { via: 'postiz', to: 'liAvc' }],
    reel:    [{ via: 'postiz', to: 'youtubeMain' }, { via: 'postiz', to: 'igYarmalikhere' }, { via: 'socialit', to: 'avc-facebook' }],
    igDeck:  [{ via: 'postiz', to: 'igYarmalikhere' }],
    liDeck:  [{ via: 'postiz', to: 'liAvc' }],
    liPost:  [{ via: 'postiz', to: 'liAvc' }],
    tweet:   [{ via: 'postiz', to: 'x' }],
    article: [{ via: 'postiz', to: 'x' }],
  },
}

export const LINKS = {
  voho: 'https://app.voho.ai',
  ccm: 'https://www.skool.com/yar-ai-automation-school-9911/about',
  avc: 'https://www.skool.com/aivideo-1153/about',
}
