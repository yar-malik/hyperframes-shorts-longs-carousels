/**
 * Yar's face cam in a long video: a few seconds of him on camera (scripts/avatar/say.mjs), cropped from the landscape
 * avatar into a rounded portrait window beside the painted scene, the way creators sit their camera beside a
 * whiteboard (content/references/presenter-cam-beside-whiteboard.png). Used by scripts/long/build.mjs and
 * scripts/voho/build-long.mjs.
 *
 * What keeps it from reading as AI: it's small, it's on screen for 4 s at most, it's his real room and clothes from
 * real footage, the voice is the same ElevenLabs line as the narration around it (the cam's own audio stays muted),
 * and it cuts out on the end of a sentence instead of lingering.
 *
 *   const cam = facecam({ start, len, clipAttrs, r2 })   → { css, html, tweens } or null when assets/cam.mp4 is missing
 */
import fs from 'node:fs'

export const CAM_MAX = 4.2   // seconds on screen, at most (the skills say 4)

export function facecam({ start, len, clipAttrs, r2, name = 'Yar Malik', src = 'assets/cam.mp4' }) {
  if (!fs.existsSync(src)) return null
  if (len > CAM_MAX) console.warn(`! the on-camera line is ${r2(len)}s; keep it ≤4 s (shorten v1)`)
  const show = Math.min(len, CAM_MAX)
  const css = `
      #cam-wrap { position: absolute; left: 1452px; top: 200px; width: 408px; height: 560px; border-radius: 30px; overflow: hidden;
        background: #111; box-shadow: 0 22px 60px rgba(17,17,22,.28), 0 6px 16px rgba(17,17,22,.3); transform-origin: 50% 60%; }
      #cam-wrap video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 47% 34%; transform: scale(1.18); transform-origin: 47% 34%; }
      #cam-name { position: absolute; left: 16px; bottom: 16px; padding: 7px 14px 8px; border-radius: 999px; background: rgba(17,17,22,.62);
        color: #fff; font: 600 20px/1 "Geist", ui-sans-serif, system-ui, sans-serif; letter-spacing: -.01em; }`
  const html = `
      <div id="cam-wrap" data-layout-allow-overflow>
        <video id="cam-video" class="clip" src="${src}" ${clipAttrs(start, show + 0.35, 45)} data-media-start="0" muted playsinline></video>
        <div id="cam-name">${name}</div>
      </div>`
  const tweens = [
    `tl.set("#cam-wrap", { opacity: 0, scale: 0.9, y: 24 }, 0);`,
    `tl.to("#cam-wrap", { opacity: 1, scale: 1, y: 0, duration: 0.32, ease: "back.out(1.7)" }, ${r2(start - 0.05)});`,
    `tl.to("#cam-wrap", { opacity: 0, scale: 0.92, y: 18, duration: 0.25, ease: "power2.in" }, ${r2(start + show + 0.1)});`,
  ]
  return { css, html, tweens, show }
}
