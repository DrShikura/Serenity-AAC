# Serenity — My Talking App

A communication board (AAC app) built for one specific eight-year-old, and
usable by any child who does not speak. Pictures and words on big crayon-drawn
buttons; tap them to build a sentence; the tablet says it out loud.

It runs entirely in a browser, works with **no internet at all**, and needs no
account, no subscription, and no app store.

- **1,194 buttons** across **55 pages** — food, toys, the bathroom, feelings,
  people, places, describing words, questions, school, the car, flags and
  countries, and the small words that hold a sentence together. Everything a
  button says out loud is exactly what it shows — tap "bathroom" and it says
  "bathroom," never a surprise longer sentence.
- **Past, present and future** — pick a tense once and every doing-word she taps
  arrives already in it. "go" becomes "went", "eat" becomes "will eat".
- **A real keyboard**, one tap from every screen, with capitals, punctuation,
  numbers and word prediction — so she can always choose to spell it herself.
- **Always-visible hotbar** — `I · you · my · it · want · need · like · have ·
  go · stop · more · not` by default, on any page. A grown-up can add, change,
  or remove any of them, and it can grow as long as you like.
- **A picture-perfect fit for her** — pick a font (including OpenDyslexic) and
  set the button size for the main boards, the hotbar, and the category
  buttons independently, all in Settings.
- **Teacher/edit mode** — move any button to a new spot (on the same page or a
  different one), hide one, or add your own. Every button you create also
  collects on its own **My Buttons** page.
- **Your own voice** — record yourself saying any button, and your voice plays
  instead of the computer's.
- **Your own photos** — put a picture of her actual cup on the "cup" button.
- **Works anywhere** — install it to the home screen and it keeps working in
  the car, at the store, at school, on a plane.

---

## Getting it onto a tablet

The app needs to be opened from a web address. Double-clicking `index.html`
will **not** work — browsers block apps loaded that way.

### The easy way: GitHub Pages (recommended)

1. In this repository on GitHub, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Pick the branch and the `/ (root)` folder, then **Save**.
4. Wait a minute or two. GitHub gives you an address like
   `https://drshikura.github.io/Serenity-AAC/`.
5. Open that address on the tablet, then use the browser menu to
   **Add to Home Screen** / **Install app**.

Once installed it behaves like a normal app: full screen, its own icon, and it
keeps working with the wifi off.

### The local way: from your own computer

```sh
./serve.sh              # then open http://localhost:8080
```

To reach it from the tablet, find your computer's address on the network
(`ipconfig` on Windows, `ifconfig` or `ipconfig getifaddr en0` on a Mac) and
open `http://THAT-ADDRESS:8080` on the tablet while both are on the same wifi.

### The no-server way: one file, for quick testing

```sh
npm install --no-save esbuild
npm run build:standalone
```

This writes `serenity-aac.standalone.html` — the entire app (vocabulary,
symbols, font, code) folded into one file with no separate assets and no
network calls at all. Double-click it, email it, or drop it on a USB stick;
it opens straight from disk in any browser, no server needed.

It's meant for quick testing, not day-to-day use — GitHub Pages (above) is
still the way to actually install this on her tablet, since only a real,
installed PWA works offline reliably and stays put across restarts. This file
is regenerated on demand rather than kept in the repository, since it's a
600KB copy of files already tracked elsewhere.

---

## Using it

| What she does | What happens |
|---|---|
| Taps a picture | The word is said out loud and added to the bar at the top |
| Taps a folder (wavy underline) | Opens a page with more words |
| Taps the bar at the top | Says the whole sentence |
| Taps one word in the bar | Says just that word |
| **spell** | Opens the keyboard from anywhere; tap again to go back |
| **hush** | Stops talking mid-sentence |
| Taps the ✕ on a word | Removes that word |
| **back** | Removes the last word |
| **undo** | Puts back whatever was just removed — including a whole cleared sentence |
| **before** | Sentences she has said before; one tap says them again |
| **Stay here** (📌) | Stops the app jumping back to Home after each word |

### Past, present and future

Along the bottom sit four tense buttons — **did** (before), **now**,
**-ing** (happening), and **will** (later). Whichever one is lit stays lit, and
from then on every doing-word she taps comes out in that tense automatically:

| She picks | She taps | The bar says |
|---|---|---|
| did | `I` `go` | I **went** |
| will | `I` `eat` | I **will eat** |
| -ing | `I` `am` `play` | I am **playing** |

Irregular verbs are handled properly — "go" becomes "went", not "goed". Words
that are not doing-words are never touched, so "bread" stays "bread" no matter
which tense is lit.

To the right of the tenses are **endings** she can apply by hand to the last
word: `-s`, `-ed`, `-ing`, `will`, `'s`, `don't`, `a`, `the`. Each one rebuilds
from the original word rather than piling up, so tapping `-ing` and then
`don't` gives "don't want" — never "don't wanting". She cannot build nonsense
by exploring.

The helper words that make tenses work — **am, is, are, was, were, will, do,
did, has, had, can, could, should, would** — plus joining words (and, but,
because, so, if) and prepositions (in, on, under, with, to, from) live on the
**Building Words** page in the bottom bar.

### Spelling

The blue **spell** key in the top corner opens the keyboard from any page.
It has capitals (`⇧ caps`), an apostrophe, a `123` layer with numbers and
punctuation, and suggestions drawn from the app's own 776-word vocabulary —
type `fla` and it offers *flag*, *flat*. What she has typed shows on a green
key; tapping it (or `space`, or `✓ add`) drops it into the sentence.

Each letter is spoken as she types it, which doubles as phonics practice.
Turn that off with *Say each word as she taps it* if it gets in the way.

### Two things worth knowing

**Buttons never move on their own.** Nothing sorts itself, nothing reorders by
how often it is used, and hiding a button leaves an empty square rather than
sliding its neighbours along. Learning where a word lives is most of learning
to use an AAC app. A grown-up can still deliberately move a button in edit
mode — see below — but that is always a considered choice, never something
the app does by itself.

**Nothing she builds is ever lost.** Clear is undoable. So is back. Building a
sentence is slow, effortful work, and losing one by accident is the fastest way
to make a child give up on a talking app.

---

## For grown-ups

**Press and hold** the ⚙ *setup* button for about a second, then answer the
multiplication question. A quick tap does nothing — that is deliberate, so she
cannot wander into the settings mid-conversation.

Inside you can change:

- **Colours** — Crayon (the bright default), High contrast, Calm (quiet colours
  and no animation, for when the bright version is too much), and Dark.
- **Font** — the default rounded typeface, a couple more childish/handwritten
  ones, plain system text, or **OpenDyslexic**.
- **Button size** — three separate sliders for the main boards, the hotbar,
  and the category buttons, so any one of them can be made bigger or smaller
  on its own. And whether the words show under the pictures.
- **Voice** — which voice, how fast, how high, how loud. Press *Try the voice*.
- **The tense strip and word endings** — on by default, plus which tense the
  app starts in. Turn the whole strip off to go back to plain words.
- **Hold-to-press** — makes her hold a button briefly before it counts. Useful
  if she triggers buttons by accident.
- **Go back to Home after picking a word** — on by default, so her core words
  are always one tap away.

### Changing the buttons

**Setup → Change the buttons.** For any button you can set the word she sees,
what it says out loud, the colour, and the picture. Every button ships saying
exactly what it shows, but you can make one of your own say something
different if you want a shortcut — a button labeled `snack` could speak
"I want a snack please," for instance.

- **📷 Use a photo** — take or choose a photo. A real picture of *her* cup, *her*
  bed, or Grandma works far better than a generic drawing.
- **⏺ Record** — record yourself saying it. Your voice then plays instead of the
  computer voice for that button.
- **Hide this button** — leaves the space empty so every other button stays put.
- **✥ Move this button** — pick it up, then tap any spot on this page or any
  other to drop it there. If something is already there, the two swap places.
- **Empty space → tap to put a button here**, and **＋ New page** for a page of
  her own: a favourite show, a holiday, a routine.

Every button you create this way also appears on **My Buttons**, a page that
collects every custom button you've ever added, wherever it actually lives —
so you can always find and edit it again even after moving it elsewhere.

### Customizing the hotbar

While in edit mode, **press and hold** any button on a page to add it to the
hotbar. **Press and hold** a button that's already on the hotbar to change it
or remove it. Removing one leaves that spot empty rather than sliding the rest
along, and you can keep adding as many as you like — it scrolls to fit them
all.

Everything you change is stored on that tablet only, separately from the app's
own word list — so updating the app will never wipe your work.

### Backups

**Setup → Backup → Save a backup** writes one file containing every edit, photo
and recording. Keep it somewhere safe. *Load a backup* puts it all back, on this
tablet or a new one. Do this before you change tablets.

---

## Notes for whoever maintains this

No build step, no framework, no dependencies. Open the files and edit them.

```sh
npm test          # unit tests for the sentence, grammar and vocabulary logic
npm run check     # verifies every button has a symbol and every folder leads somewhere
npm run build     # regenerates data/vocabulary.json and the hand-drawn symbols
./serve.sh        # http://localhost:8080
```

| Path | What it is |
|---|---|
| `data/vocabulary.json` | Every board and button. Plain data, no code. |
| `tools/vocab/*.mjs` | Where the vocabulary is actually authored — edit here, then `npm run build` |
| `tools/build-icons.mjs` | The 37 hand-drawn crayon symbols |
| `js/grammar.js` | Plurals, tenses, irregular verbs, subject agreement |
| `js/output.js`, `js/grammar.js`, `js/vocabulary.js` | The whole communication model. No DOM. |
| `js/render.js`, `js/speech.js`, `js/storage.js` | The browser-specific layer |
| `docs/PORTING.md` | Notes for the Godot port |

Two dev-only scripts need Playwright (`npm install --save-dev playwright`):
`tools/check-contrast.mjs`, which measures the real rendered contrast of every
button colour in every theme, and `tools/build-app-icons.mjs`.

## Credits and licence

The app is MIT licensed. The bundled typefaces — **Comic Neue**, **Fredoka**,
**Patrick Hand**, and **OpenDyslexic** — are each under the SIL Open Font
License 1.1, from their respective authors — see `assets/fonts/OFL*.txt`.
Symbols are either hand-drawn for this project or standard Unicode emoji
rendered by the device.
