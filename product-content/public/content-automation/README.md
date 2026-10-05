# Content Automation (`/content-automation`)

The Long & Short Videos board plus every recording brief, rebuilt from
`Long & Short Videos CCM (5th Attempt).xlsx`.

Open to anyone with the link — there is no password. Anyone who can reach
the page can also save over the board.

## What is where

| Path | What it is |
| --- | --- |
| `public/content-automation/` | The board itself — plain HTML/CSS/JS, no build step |
| `app/api/content-automation/route.ts` | `GET` the board, `PUT` to save it |
| `lib/content-automation-store.ts` | Supabase reads and writes |
| `db/content-automation-board.sql` | The one table, already applied |

## Setting it up

The table is live: `ccm_board` exists on the self-hosted Supabase and holds
the 19 seeded rows. (The table keeps its original name — renaming it would
mean migrating the data for no gain.)

The app needs two variables in `.env.production.local` on the server:
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Both are set.

`state.json` is only the fallback the page renders if the API cannot be
reached; Supabase is the source of truth.

## Tab URLs

Every tab is its own address, so a tab can be linked to directly:

| Tab | URL |
| --- | --- |
| Video Board | `/content-automation` |
| Playbook | `/content-automation/playbook` |
| Recording Setup | `/content-automation/recording-setup` |
| Brand Kit | `/content-automation/brand-kit` |
| Pay | `/content-automation/pay` |
| Competitors | `/content-automation/competitors` |
| Voice — ElevenLabs | `/content-automation/voice` |
| Transcripts | `/content-automation/transcripts` |

The hiring test is intentionally separate from the internal board at
`/content-automation/public/hiring-test`. It is a standalone public page and does
not load the board, its people, or its transcripts.

The slugs live on the `TABS` array in `app.js`. `next.config.mjs` rewrites
`/content-automation/:tab` to this page; because that rewrite runs after the
static-file check, `app.js`, `style.css` and `assets/*` still serve
themselves. The nav items are real links, so cmd-click opens a tab in a new
window, and back/forward move between tabs.

A `#hiring-test` style hash still works as a fallback.

## Inviting somebody

Admin → Team → **Invite & access**. Name, email, boards, role; the server
makes the sign-in row, puts them on the roster, and emails them the address
and how to get in (a code to that email — no password is sent). The list
under the form is every account, with a role picker, "Send again" for anyone
who has never signed in, and Remove. An admin cannot change their own row,
so the last admin cannot lock everyone out.

The same from a terminal, for when the Resend key is only on the VM:

```
node scripts/board/invite.mjs --name "Ashir" --email ashir@example.com [--role admin] [--teams video,skool]
node scripts/board/invite.mjs --email ashir@example.com --resend
```

Routes: `POST /api/content-automation/invite`, `PATCH`/`DELETE
/api/content-automation/team`. All admin-only.

## How saving behaves

Edits collect locally and go up in one `PUT` when someone presses **Save for
the team**. The write is a compare-and-set on `rev`: if two people save at
once, the second one gets the winning board back and their edits are
re-applied on top of it, with a notice, instead of being dropped.

## Editing the reference tabs

Playbook, Pay, Recording Setup, Brand Kit, Competitors, Voice and Hiring Test
are constants near the top of `app.js` (`PLAYBOOK`, `PAY`, `COMPETITORS`,
`EXPORT_SETTINGS`, `TEST_MSG`). Change them there and redeploy — they are not
in the database.

Screenshots live in `public/content-automation/assets/`.

`index.html` references `/content-automation/app.js`, `/content-automation/style.css`
and `/content-automation/assets/*` by root-absolute path on purpose: the page is
served at `/content-automation` with no trailing slash, so relative paths would
resolve one level too high.

`/ccm` permanently redirects here.
