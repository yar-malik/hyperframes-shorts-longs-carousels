/**
 * Keeps the shared sections of the three product skills identical. Each skill is one self-contained file
 * (.claude/skills/{ccm,avc,voho}-content/SKILL.md); the rules that apply to all three products sit between
 * `<!-- shared:NAME -->` and `<!-- /shared:NAME -->` markers and must read the same in every file.
 *
 *   node scripts/content/sync-skills.mjs              # check: lists any shared section that differs (exit 1 if one does)
 *   node scripts/content/sync-skills.mjs --from ccm   # copy every shared section from the CCM skill into the other two
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const PRODUCTS = ['ccm', 'avc', 'voho']
const file = (p) => path.join(ROOT, `.claude/skills/${p}-content/SKILL.md`)
const BLOCK = /<!-- shared:([a-z-]+) -->\n([\s\S]*?)<!-- \/shared:\1 -->/g
const blocks = (text) => Object.fromEntries([...text.matchAll(BLOCK)].map((m) => [m[1], m[2]]))
const text = Object.fromEntries(PRODUCTS.map((p) => [p, fs.readFileSync(file(p), 'utf8')]))

const from = process.argv.includes('--from') ? process.argv[process.argv.indexOf('--from') + 1] : null
if (from) {
  if (!PRODUCTS.includes(from)) { console.error(`--from must be one of ${PRODUCTS.join(', ')}`); process.exit(1) }
  const src = blocks(text[from])
  for (const p of PRODUCTS.filter((x) => x !== from)) {
    const have = blocks(text[p])
    const missing = Object.keys(src).filter((k) => !(k in have))
    if (missing.length) console.log(`! ${p} has no marker for ${missing.join(', ')}: add <!-- shared:NAME --><!-- /shared:NAME --> where it belongs`)
    const out = text[p].replace(BLOCK, (m, name) => (name in src ? `<!-- shared:${name} -->\n${src[name]}<!-- /shared:${name} -->` : m))
    if (out !== text[p]) { fs.writeFileSync(file(p), out); console.log(`updated ${p}-content`) } else console.log(`${p}-content already matches`)
  }
  process.exit(0)
}

let bad = 0
const all = PRODUCTS.map((p) => blocks(text[p]))
for (const name of new Set(all.flatMap((b) => Object.keys(b)))) {
  const versions = PRODUCTS.map((p, i) => all[i][name])
  if (versions.some((v) => v === undefined)) { bad++; console.log(`✗ ${name}: missing in ${PRODUCTS.filter((_, i) => versions[i] === undefined).join(', ')}`) }
  else if (new Set(versions).size > 1) { bad++; console.log(`✗ ${name}: differs between ${PRODUCTS.join(', ')} (sync with --from <the one you edited>)`) }
  else console.log(`✓ ${name}`)
}
process.exit(bad ? 1 : 0)
