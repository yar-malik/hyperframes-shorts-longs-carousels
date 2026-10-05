/**
 * The board steps of the Voho pipeline, run from the laptop over the IAP tunnel (the board's key lives on the box).
 *
 *   node scripts/voho/board.mjs mark <workspace>     # the topic → made, with its published links
 *   node scripts/voho/board.mjs sync                 # the Published calendar (Postiz + Socialit + channel feeds)
 */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const G = ['--zone', 'europe-west2-a', '--project', 'callsupport-ai-439923', '--account=malikasfandyarashraf@gmail.com', '--tunnel-through-iap']
const ssh = (cmd) => execFileSync('gcloud', ['compute', 'ssh', 'voho-vm', ...G, '--command', `cd /var/www/yarmalik.com && git pull -q origin main && ${cmd}`], { encoding: 'utf8' })
  .split('\n').filter((l) => l && !/numpy|WARNING|host keys|increase the perf|using-tcp/i.test(l)).join('\n')

const [cmd, arg] = process.argv.slice(2)
if (cmd === 'mark') {
  const WS = path.resolve(arg)
  const topic = JSON.parse(fs.readFileSync(path.join(WS, 'topic.json'), 'utf8'))
  const links = JSON.parse(fs.readFileSync(path.join(WS, 'published.json'), 'utf8'))
  const b64 = Buffer.from(JSON.stringify({ title: topic.title, links })).toString('base64')
  console.log(ssh(`node scripts/board/mark-voho-topic.mjs ${b64}`))
} else if (cmd === 'sync') {
  const dump = path.join(os.tmpdir(), `pub-posts-${Date.now()}.json`)
  execFileSync('node', ['scripts/board/sync-published.mjs', `--dump=${dump}`], { cwd: ROOT, stdio: 'ignore' })
  execFileSync('gcloud', ['compute', 'scp', dump, 'voho-vm:/tmp/pub-posts.json', ...G], { stdio: 'ignore' })
  console.log(ssh(`node scripts/board/sync-published.mjs --posts=/tmp/pub-posts.json --write | grep -E 'new,|^  [+~-]|wrote|Nothing'; rm -f /tmp/pub-posts.json`))
  fs.rmSync(dump, { force: true })
} else { console.log('usage: board.mjs mark <workspace> | sync'); process.exit(1) }
