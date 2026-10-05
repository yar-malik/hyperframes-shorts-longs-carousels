# Exporting a Skool classroom

Skool's classroom is behind membership and the lesson text only renders
on screen, so this reads it through your own signed-in Chrome — no
credentials, no second browser.

1. In Chrome: **View → Developer → Allow JavaScript from Apple Events**
   (per profile; turn it on in every profile you have windows open in).
2. Open the classroom **in its own Chrome window** and keep that window
   uncovered — Chrome stops rendering a hidden window, and a covered
   lesson reads as empty:
   `https://www.skool.com/<group>/classroom`
3. From the repo root:

   ```bash
   node scripts/content/skool-export/export.mjs aivideo-1153 content/courses/ai-video-club
   node scripts/content/skool-export/fill.mjs   aivideo-1153 content/courses/ai-video-club/classroom.json   # re-reads any lesson that came back empty
   node scripts/content/build-skool-classroom.mjs ai-video-club
   ```

   CCM is `yar-ai-automation-school-9911` → `content/courses/claude-codex-mastery`.

About a minute per ten lessons. The result is `classroom.json` (the
export) and `lib/courses/<room>.generated.ts` (what the site shows).
