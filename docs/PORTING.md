# Porting to Godot

This app was built knowing it would become a Godot project. The structure is
arranged so that the port is a rewrite of the *presentation* only — the
vocabulary, the sentence model and the language rules all carry over unchanged.

## What carries over as-is

| Asset | Why it ports cleanly |
|---|---|
| `data/vocabulary.json` | Plain JSON. `JSON.parse_string()` reads it directly. No code, no references to the web app. |
| `assets/icons/*.svg` | Standard SVG files. Godot 4 imports SVG natively and rasterises at whatever scale you ask for. |
| `assets/fonts/*.woff2` | Convert once to TTF/OTF for Godot's font importer, or substitute any rounded face. |
| `js/output.js` | The sentence model. ~10 small pure functions — a direct transcription to GDScript. |
| `js/grammar.js` | The morphology rules. Pure string functions plus two lookup tables. |
| `js/vocabulary.js` | Indexing, the user-overlay merge, prediction word list, validation. Pure. |

**Nothing in those three JS modules touches the DOM, the network, or browser
storage.** That was the point of splitting them out. Read them as a
specification for the GDScript versions, and port `tests/output.test.js` and
`tests/grammar.test.js` alongside them — they encode the behaviour that
matters (undo semantics, irregular plurals, endings rebuilding from the base
word) and will catch a transcription slip immediately.

## What has to be rewritten

| Web module | Godot equivalent |
|---|---|
| `js/render.js` | `GridContainer` per board; one `Button` (or a custom `Control`) scene per key. Set `columns` from the board's `cols`. |
| `js/speech.js` | `DisplayServer.tts_speak(text, voice_id)`, with `DisplayServer.tts_get_voices_for_language("en")` to populate the voice picker. Recorded audio becomes an `AudioStreamPlayer` per button. |
| `js/storage.js` | `FileAccess` / `ConfigFile` under `user://`. Photos and recordings become files in `user://media/` keyed by button id. |
| `js/recorder.js` | `AudioEffectRecord` on a dedicated audio bus. |
| `sw.js`, `manifest.webmanifest` | Not needed — a native build is offline by definition. |
| `css/*` | `Theme` resource. The palette in `css/theme.css` maps one-to-one onto theme colour constants. |

## The data contract

`data/vocabulary.json`:

```jsonc
{
  "version": 1,
  "home": "home",          // board id the app opens on
  "core": "core",          // the always-visible rail
  "colors": [...],         // swatch names buttons may use
  "grammarBar": [ { "id", "label", "hint", "op" } ],
  "boards": [
    {
      "id": "food",
      "title": "Food & Drink",
      "icon": "🍎",              // or "svg:want" for a hand-drawn symbol
      "color": "noun",           // default swatch for this board's buttons
      "cols": 8, "rows": 5,
      "special": "keyboard",     // optional: generated at runtime, empty button list
      "buttons": [ /* exactly cols*rows entries; null means an empty slot */ ]
    }
  ]
}
```

A button:

```jsonc
{
  "id": "food.apple",                          // stable, unique, never reused
  "label": "apple",                            // shown under the symbol
  "speak": "apple",                            // said aloud; may be a whole sentence
  "type": "word",                              // word | phrase | folder | action
  "icon": { "kind": "emoji", "value": "🍎" },  // or { "kind": "svg", "value": "want" }
  "color": "noun",
  "target": null,                              // board id, when type is "folder"
  "action": null,                              // speak|backspace|clear|undo|home|back
  "grammar": { "pos": "noun", "plural": "apples" }   // optional irregular forms
}
```

Rules the renderer must honour:

- `buttons.length === cols * rows` exactly. A `null` entry is a **visible empty
  slot**, not something to skip — it holds its neighbours in position.
- Never sort, never reorder, never collapse. Grid order is the file's order.
- `label` and `speak` are independent. A short label may say a long sentence.
- `icon.kind === "svg"` refers to `assets/icons/<value>.svg`.

## Behaviour worth preserving

These are the decisions that make it work as an AAC app rather than a
soundboard. If the Godot port drops them, it will be worse than this one:

1. **Positions are permanent.** No frequency sorting, no recents shuffling to
   the front, no collapsing gaps. Motor memory is how fluency develops.
2. **The core rail is on every screen**, unchanged, in the same place.
3. **Every tap makes a sound immediately** — the word itself, not just a click.
4. **Clear and backspace are undoable.** See `undoStack` in `js/output.js`.
5. **Grammar endings rebuild from the base word** rather than stacking, so no
   sequence of taps can produce nonsense like "don't wanting".
6. **Recorded audio beats synthetic speech** whenever a button has a recording.
7. **The user overlay is separate from the shipped vocabulary**, merged by
   button id at load. Shipping new words must never erase a family's edits.
8. **Auto-return to Home after a fringe word** (toggleable), so core stays
   one tap away.
9. **Regulation and repair vocabulary is first-class** — "I need a break",
   "too loud", "that's not what I meant". Do not cut this board for space.

## Suggested order

1. Load and index `vocabulary.json`; render one board in a `GridContainer`.
2. Port `output.js` and its tests; wire the output bar.
3. Port `grammar.js` and its tests.
4. Add TTS.
5. Add the core rail and navigation.
6. Add settings and persistence.
7. Add the overlay, photos and recording last — everything above works without them.
