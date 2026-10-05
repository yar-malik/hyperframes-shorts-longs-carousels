// Level ElevenLabs downloads to the loudness we actually publish at.
//
//   node scripts/content/level-voice.mjs ~/Downloads/take.wav
//   node scripts/content/level-voice.mjs ~/Downloads/voice-folder
//
// The ElevenLabs UI has no loudness control, so anything downloaded from it
// lands around -18 LUFS and sounds quiet next to everything else. This puts it
// at -14 LUFS with a mild tonal pass — rumble out, a touch of boxiness out, a
// touch of presence in — and writes <name>.leveled.wav beside the original.
// Originals are never modified.
import { readdirSync, statSync, existsSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { resolve, extname, join, dirname, basename } from "node:path";

const TARGET_LUFS = -14;
const TRUE_PEAK = -1.5;
const TONE = "highpass=f=75,equalizer=f=300:t=q:w=1.0:g=-1.5,equalizer=f=4200:t=q:w=1.2:g=2.5";
const COMP = "acompressor=threshold=-20dB:ratio=3:attack=5:release=120";
const master = (gain) => `${TONE},${COMP},volume=${gain.toFixed(2)}dB,aresample=176400,alimiter=limit=${TRUE_PEAK}dB:level=disabled,aresample=44100`;

const args = process.argv.slice(2);
if (!args.length) {
  console.error("usage: node scripts/content/level-voice.mjs <file-or-folder> [...]");
  process.exit(1);
}

const AUDIO = new Set([".wav", ".mp3", ".m4a", ".flac"]);
const files = [];
for (const a of args) {
  const p = resolve(a);
  if (!existsSync(p)) { console.error(`skipping, not found: ${a}`); continue; }
  if (statSync(p).isDirectory()) {
    for (const f of readdirSync(p)) {
      if (AUDIO.has(extname(f).toLowerCase()) && !f.includes(".leveled.")) files.push(join(p, f));
    }
  } else if (!p.includes(".leveled.")) files.push(p);
}
if (!files.length) { console.error("nothing to do"); process.exit(1); }

function measure(file) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", file, "-af", "loudnorm=print_format=json", "-f", "null", "-"], { encoding: "utf8" });
  const m = r.stderr.match(/\{[^{}]*"input_i"[^{}]*\}/);
  if (!m) throw new Error(`could not read ${file} — is it audio?`);
  return JSON.parse(m[0]);
}

for (const file of files) {
  const out = join(dirname(file), `${basename(file, extname(file))}.leveled.wav`);
  const before = parseFloat(measure(file).input_i);
  // The limiter pulls the result back down, so settle on the gain rather than
  // computing it once and hoping.
  let gain = TARGET_LUFS - before, got = before;
  for (let i = 0; i < 6; i++) {
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", file, "-af", master(gain), "-ar", "44100", "-ac", "1", out]);
    got = parseFloat(measure(out).input_i);
    if (Math.abs(got - TARGET_LUFS) < 0.15) break;
    gain += TARGET_LUFS - got;
  }
  console.log(`${basename(file)}  ${before.toFixed(1)} -> ${got.toFixed(1)} LUFS   ${basename(out)}`);
}
