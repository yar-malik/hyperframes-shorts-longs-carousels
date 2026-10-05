// Record the six lines in Yar's ElevenLabs voice, with word timings.
//
//   node scripts/tts.mjs
//
// Uses /with-timestamps so the karaoke captions come from the synthesizer's own
// character alignment rather than a transcription pass. Each line is sent with
// its neighbours as previous_text / next_text so prosody stays continuous across
// the six files.
//
// Audio comes back as lossless PCM: the old mp3_44100_128 round trip was
// spending sibilance for nothing, since the file became a wav on arrival
// anyway. It is then levelled — the tonal chain runs per line, but a single
// gain is measured across all six together so the lines keep their relative
// loudness instead of each being flattened to the same number.
//
// Writes .media/audio/voice/NN.wav and audio_meta.json.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
for (const file of [resolve(root, "../../.env")]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
const key = process.env.ELEVENLABS_API_KEY;
const voice = process.env.ELEVENLABS_VOICE_ID;
if (!key || !voice) throw new Error("ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID missing");

const spec = JSON.parse(readFileSync(resolve(root, "script.json"), "utf8"));
const lines = spec.lines.map((l, i) => ({ id: String(i + 1).padStart(2, "0"), text: l.text }));
const outDir = resolve(root, ".media/audio/voice");
const rawDir = resolve(outDir, "raw");
mkdirSync(rawDir, { recursive: true });

// -14 LUFS is the usual ceiling for social; the raw voice arrives around -19,
// which is the "not loud enough". The limiter runs at 4x so it catches
// inter-sample peaks rather than only sample peaks.
// v2 re-rolls its read on every call, which reshuffles every beat downstream.
// A fixed seed makes a render reproducible; change it to audition another take.
const SEED = Number(process.env.TTS_SEED ?? 12345);
const TARGET_LUFS = -14;
const TRUE_PEAK = -1.5;
// Rumble out, a little boxiness out, a little presence in. Deliberately mild:
// this should sound like a better mic, not like processing.
const TONE = "highpass=f=75,equalizer=f=300:t=q:w=1.0:g=-1.5,equalizer=f=4200:t=q:w=1.2:g=2.5";
const COMP = "acompressor=threshold=-20dB:ratio=3:attack=5:release=120";
const master = (gain) => `${TONE},${COMP},volume=${gain.toFixed(2)}dB,aresample=176400,alimiter=limit=${TRUE_PEAK}dB:level=disabled,aresample=44100`;

const ff = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args]);
const durationOf = (file) =>
  parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString());

// loudnorm reports through stderr, as JSON buried in the log.
function measure(file, filters) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", file, "-af", `${filters},loudnorm=print_format=json`, "-f", "null", "-"], { encoding: "utf8" });
  const m = r.stderr.match(/\{[^{}]*"input_i"[^{}]*\}/);
  if (!m) throw new Error(`could not measure ${file}`);
  return JSON.parse(m[0]);
}

// Group characters into words: a word is a run of non-space characters; its
// start is the first char's start, its end the last char's end.
function wordsFrom(alignment) {
  const { characters, character_start_times_seconds: s, character_end_times_seconds: e } = alignment;
  const words = [];
  let cur = null;
  characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { if (cur) { words.push(cur); cur = null; } return; }
    if (!cur) cur = { text: "", start: s[i], end: e[i] };
    cur.text += ch;
    cur.end = e[i];
  });
  if (cur) words.push(cur);
  return words.map((w, i) => ({ id: `w${i}`, ...w }));
}

// ── pass 1: synthesise every line, unprocessed ──
const takes = [];
for (let i = 0; i < lines.length; i++) {
  const { id, text } = lines[i];
  const body = {
    text,
    model_id: "eleven_multilingual_v2",
    seed: SEED,
    previous_text: lines[i - 1]?.text,
    next_text: lines[i + 1]?.text,
    voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true },
  };
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps?output_format=pcm_44100`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`line ${id}: ${r.status} ${await r.text()}`);
  const json = await r.json();
  const pcm = resolve(rawDir, `${id}.pcm`);
  const raw = resolve(rawDir, `${id}.wav`);
  writeFileSync(pcm, Buffer.from(json.audio_base64, "base64"));
  ff(["-f", "s16le", "-ar", "44100", "-ac", "1", "-i", pcm, raw]);
  rmSync(pcm);
  takes.push({ id, text, raw, words: wordsFrom(json.alignment) });
  console.log(id, "recorded", durationOf(raw).toFixed(2) + "s");
}

// ── measure the six together, so one gain serves them all ──
const listFile = resolve(rawDir, "all.txt");
writeFileSync(listFile, takes.map((t) => `file '${t.raw}'`).join("\n"));
const combined = resolve(rawDir, "all.wav");
ff(["-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", combined]);
console.log("\nbefore:", measure(combined, "anull").input_i, "LUFS");

// The limiter pulls the result back down, so settle on the gain rather than
// computing it once and hoping.
let gain = TARGET_LUFS - parseFloat(measure(combined, `${TONE},${COMP}`).input_i);
for (let i = 0; i < 5; i++) {
  const probe = resolve(rawDir, "probe.wav");
  ff(["-i", combined, "-af", master(gain), "-ar", "44100", "-ac", "1", probe]);
  const got = parseFloat(measure(probe, "anull").input_i);
  rmSync(probe);
  if (Math.abs(got - TARGET_LUFS) < 0.15) break;
  gain += TARGET_LUFS - got;
}
console.log("gain:", gain.toFixed(2), "dB");

// ── pass 2: master each line with that one gain ──
const voices = [];
for (const t of takes) {
  const wav = resolve(outDir, `${t.id}.wav`);
  ff(["-i", t.raw, "-af", master(gain), "-ar", "44100", "-ac", "1", wav]);
  const dur = durationOf(wav);
  voices.push({ id: t.id, text: t.text, path: `.media/audio/voice/${t.id}.wav`, duration_s: +dur.toFixed(3), words: t.words });
  console.log(t.id, dur.toFixed(2) + "s", t.words.length, "words");
}
ff(["-i", combined, "-af", master(gain), "-ar", "44100", "-ac", "1", resolve(rawDir, "mastered-all.wav")]);
const after = measure(resolve(rawDir, "mastered-all.wav"), "anull");
console.log("after:", after.input_i, "LUFS, peak", after.input_tp, "dBTP");

writeFileSync(resolve(root, "audio_meta.json"), JSON.stringify({ tts_provider: "elevenlabs", model_id: "eleven_multilingual_v2", seed: SEED, output_format: "pcm_44100", loudness_lufs: +after.input_i, voice_id: voice, voices, total_duration_s: +voices.reduce((a, v) => a + v.duration_s, 0).toFixed(3) }, null, 2));
console.log("total", voices.reduce((a, v) => a + v.duration_s, 0).toFixed(2) + "s");
