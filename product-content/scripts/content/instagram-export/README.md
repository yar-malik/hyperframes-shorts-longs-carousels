# Pulling a competitor's reels

Instagram serves nothing to a logged-out fetch (yt-dlp gets "login
required"), so this goes through your own signed-in Chrome, like the Skool
export: the page asks Instagram's own media API for the reel, which gives
the CDN mp4, the like and comment counts and the full caption. The mp4 is
then transcribed locally with whisper-cli (small.en) — the spoken words are
what the vault wants, and the caption is not the script.

1. Chrome: View → Developer → Allow JavaScript from Apple Events.
2. Open `https://www.instagram.com/<handle>/reels/` in its own window and
   scroll to the bottom a few times so the grid fills, then save the grid:

   ```bash
   osascript scripts/content/skool-export/tab-js.applescript "https://www.instagram.com/<handle>" \
     "JSON.stringify([...document.querySelectorAll('a[href*=\"/reel/\"]')].map(a=>[a.getAttribute('href'), a.innerText.trim()]))" > /tmp/reels.json
   node scripts/content/instagram-export/reels.mjs <handle> /tmp/reels.json /tmp/<handle> 8
   ```

   `/tmp/<handle>/reels.json` has the top N by views with caption, stats and
   transcript. Read the transcripts — whisper mishears product names
   (Claude → Cloud, Anthropic → Enthorpek) — then file them on the board's
   vault shelves and in `content/vault/07 Shorts Hooks` / `08 Shorts Script`.

Creators re-post the same script; check for duplicates before filing.
