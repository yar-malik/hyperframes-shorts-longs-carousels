// Topic (Voho): an IT service desk that fills in its own tickets, by phone, in Saudi Arabic.
// Workspace videos/voho-it-service-desk-saudi-arabic/, recorded 2026-09-29.
//
// Everything below is off that run: the agent (Al Waha Group IT Service Desk, an invented company) built on
// app.voho.ai with two functions, find_employee and create_ticket, pointed at the demo desk at yarmalik.com/desk;
// the live call (dial to hang-up 75 s by the recorder's marks, 125.2 → 199.9 s), where employee 4471 reported the
// VPN and asked access for a new colleague; and the desk's own log: #2421 VPN, high priority, network team, response
// "within two hours", and #2422 procurement access for Majed, identity team. The agent read both numbers back (the
// call audio, transcribed with Whisper large-v3). The screenshots are crops of the desk tab recorded during the call.
//
// The honest part is from the earlier takes the same day: on the first, the endpoint hadn't saved, the agent had no
// functions, and it read out ticket numbers it had made up (2056, 993); on another it opened one request twice.
// Only the LinkedIn post is made for this topic (what Yar asked for); the decks are empty.
import { window, css as common } from "../_voho-shots/common.mjs";

export { window };
export const short = null;
const img = (name) => new URL(`./${name}.png`, import.meta.url).href;

export const css = common + `
.deskshot { position:absolute; display:block; border-radius:18px; outline:1.5px solid #1F1D1A; box-shadow:0 6px 18px rgba(0,0,0,.25); background:#fff; }
`;

export const ig = [];
export const li = [];
export const captions = { ig: "", li: "" };
export const tweet = "";
export const article = { title: "", body: "" };

export const liPost = {
  image: ({ yar }) => `
    <div class="win" style="border-radius:0">
      <div style="position:absolute; left:72px; top:80px; right:72px">
        <span class="pill">One call · two tickets · Saudi Arabic</span>
        <div style="font-size:84px; font-weight:800; letter-spacing:-.045em; line-height:1.02; margin-top:30px">An IT service desk<br>that fills in<br><span style="color:var(--accent)">its own tickets.</span></div>
      </div>
      <img class="deskshot" src="${img("desk-rows")}" style="left:72px; top:540px; width:936px">
      <div style="position:absolute; left:72px; top:780px; width:560px; display:flex; flex-direction:column; gap:14px">
        <div class="bubble you" style="font-size:22px; margin-left:0"><small>Employee 4471</small>My laptop hasn't connected to the VPN since this morning, and I can't work at all.</div>
        <div class="bubble ai" style="font-size:22px"><small>Voho agent</small>I've opened ticket 2421 with the network team, and it should be sorted within two hours.</div>
      </div>
      <div style="position:absolute; left:72px; top:1130px; display:flex; gap:12px">
        ${["find_employee", "create_ticket"].map((n) => `<span class="chip2" style="font-family:ui-monospace,Menlo,monospace; font-size:24px">${n}</span>`).join("")}
      </div>
      ${yar({ h: 600, fade: false, style: "right:-170px; bottom:0" })}
    </div>`,
  text: `One phone call. Two service desk tickets. Nobody typed anything.

I built a small IT service desk for a made-up company in Riyadh and put a Voho agent on its phone line, speaking Saudi Arabic. An employee called with two problems: his laptop wouldn't connect to the VPN, and a new colleague needed access to the procurement system.

In a 75-second call, the agent:
→ looked him up from his employee number (name, department, floor, laptop)
→ opened #2421 for the network team, high priority, because he said he couldn't work at all
→ opened #2422 for identity management, in the new colleague's name
→ read both numbers back before he hung up

That's two functions on the agent, find_employee and create_ticket, pointed at one endpoint. The desk fills in the rest from its own directory.

The first test call is the part worth sharing. The endpoint hadn't saved, so the agent had nothing to call, and it read out ticket numbers it had made up. Confidently. So now a ticket number can only come from create_ticket, and the lookup's answer tells the agent to open the ticket next. On another run it logged the same request twice, so the desk catches duplicates too.

If your service desk still starts with someone retyping a phone call, that's the step to hand over first.

Link to the full video (in Saudi Arabic) is in the comments 👇`,
};
