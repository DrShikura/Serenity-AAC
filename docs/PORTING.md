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
| `js/grammar.js` | The morphology rules and the tense engine (`conjugate`, `helperFor`). Pure string functions plus two lookup tables. |
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
  "tenses": [ { "id", "label", "hint", "tense", "glyph" } ],   // sticky tense modes
  "grammarBar": [ { "id", "label", "hint", "op" } ],           // one-off endings
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
  "speak": "apple",                            // said aloud; always equals label
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
- `label` and `speak` are the *same string* on every shipped button — what she
  sees is always exactly what's spoken. The fields are technically independent
  (a parent customisation in Edit mode may set them apart on purpose, as a
  shortcut), but the shipped vocabulary never does, and no future authoring
  should reintroduce a silent mismatch there.
- `icon.kind === "svg"` refers to `assets/icons/<value>.svg`.

## The overlay

Everything a parent changes in Edit mode — patches, hides, additions, moves,
and the hotbar — lives in one object, kept in `storage.js`/`IndexedDB` and
merged onto the shipped vocabulary at load time by `applyOverlay()` in
`js/vocabulary.js`. It never touches `vocabulary.json` itself:

```jsonc
{
  "buttons": { "food.apple": { "label": "Apple" }, "custom.home.123": null },
  "boards": { "trip-2024": { "title": "Our Trip", "buttons": [...] } },
  "added": { "home": [ { "id": "custom.home.123", ... } ] },
  "moves": [ { "a": { "boardId": "home", "index": 3 },
               "b": { "boardId": "food", "index": 0 } } ],
  "hotbar": [ "core.want", "core.stop", null, "food.apple", ... ]
}
```

- `buttons[id]` is a patch merged onto that button wherever it appears (a
  shipped button, or one a parent added via `added`); `null` means hidden. A
  button referenced from more than one board (its own page, and always from
  the auto-populated "My Buttons" board) resolves the same patch everywhere,
  since every occurrence is looked up by the same id — there is exactly one
  button, referenced in several places, never a copy that could drift.
- `boards[id]` is either a patch on a shipped board or, when the id isn't one
  of the shipped board ids, a whole new parent-created page.
- `added[boardId]` is the list of custom buttons appended to that board (after
  patches, filling any empty `null` slots before growing the grid).
- `moves` is an ordered list of **swaps**, replayed in sequence after every
  other step: each one exchanges whatever currently occupies two named grid
  cells (`{ boardId, index }`), which may be the same board (a reorder) or two
  different ones (a relocation), and either of which may be empty. A swap is
  always well-defined — nothing can be silently dropped the way a general
  "here is the whole new layout for board X" replacement could be if two
  edits disagreed about where something landed. A move naming a board that no
  longer exists is skipped, not an error.
- `hotbar` is the resolved list a parent has built for the always-visible
  rail: an ordered array of button ids (or `null` for a deliberately empty
  slot after removing one), each looked up by id in the merged vocabulary at
  render time — the same reference model as `added`. It has no fixed length;
  a parent can keep appending to it indefinitely. On first boot, when no
  saved `hotbar` exists yet, it is seeded once from the shipped `core` board's
  buttons so a fresh install looks the same as it always has.

A Godot port's save file can use this same shape directly — it is already
plain, serializable data with no DOM references in it.

## Behaviour worth preserving

These are the decisions that make it work as an AAC app rather than a
soundboard. If the Godot port drops them, it will be worse than this one:

1. **Positions are permanent.** No frequency sorting, no recents shuffling to
   the front, no collapsing gaps. Motor memory is how fluency develops.
2. **The hotbar is on every screen**, in the same place. Its *contents* are a
   parent-editable, unbounded list (see "The overlay" below) — `core` in
   `vocabulary.json` is only the default seed copied in on first boot, not a
   fixed board. Its on-screen position never changes and it is never
   collapsed or reordered by removing an entry from it.
3. **Every tap makes a sound immediately** — the word itself, not just a click.
4. **Clear and backspace are undoable.** See `undoStack` in `js/output.js`.
5. **Grammar endings rebuild from the base word** rather than stacking, so no
   sequence of taps can produce nonsense like "don't wanting".
6. **Tense is a sticky mode, not a per-word edit.** The selected tense is
   applied by `conjugate()` at the moment a button is turned into a token, and
   only to buttons whose `grammar.pos` is `"verb"`. Conjugating a noun, or
   making her re-select the tense for every verb, both break it.
7. **Recorded audio beats synthetic speech** whenever a button has a recording
   — except for a conjugated verb, where the recording no longer matches the
   word and synthesis takes over.
8. **The user overlay is separate from the shipped vocabulary**, merged by
   button id at load. Shipping new words must never erase a family's edits.
   See "The overlay" below for its exact shape.
9. **Auto-return to Home after a fringe word** (toggleable), so core stays
   one tap away.
10. **Regulation and repair vocabulary is first-class** — "I need a break",
    "too loud", "that's not what I meant". Do not cut this board for space.
11. **The keyboard is reachable in one tap from every screen**, not buried in
    a folder. Choosing to spell instead of tap is always hers to make.

## Suggested order

1. Load and index `vocabulary.json`; render one board in a `GridContainer`.
2. Port `output.js` and its tests; wire the output bar.
3. Port `grammar.js` and its tests, including `conjugate()` and the sticky
   tense strip — `pos: "verb"` is the only gate on conjugation.
4. Add TTS.
5. Add the core rail and navigation.
6. Add settings and persistence.
7. Add the overlay, photos and recording last — everything above works without them.
