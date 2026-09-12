# `vocabulary.json` — field reference

This file is the app's entire word list. It is plain data with no code in it,
and it is what a future Godot port reads directly. See `docs/PORTING.md` for
the porting notes.

**Do not hand-edit this file.** It is generated. The vocabulary is authored in
`tools/vocab/*.mjs` using the small helper set in `tools/dsl.mjs`; run
`npm run build` to regenerate. To change buttons on a real device, use the
app's own Edit mode — those changes live in a separate overlay on the device.

## Top level

| Field | Type | Meaning |
|---|---|---|
| `version` | number | Schema version. Currently `1`. |
| `home` | string | Board id the app opens on. |
| `core` | string | Board id of the always-visible core rail. |
| `colors` | string[] | Swatch names a button's `color` may use. |
| `grammarBar` | object[] | The optional word-endings row (see below). |
| `boards` | object[] | Every board in the app. |

## Board

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Unique. Referenced by folder buttons' `target`. |
| `title` | string | Shown in navigation and read by screen readers. |
| `icon` | string | An emoji, or `"svg:<name>"` for `assets/icons/<name>.svg`. |
| `color` | string | Default swatch for buttons on this board. |
| `cols`, `rows` | number | The grid. `buttons.length` must equal `cols * rows`. |
| `buttons` | (object\|null)[] | Row-major. `null` is a **visible empty slot**. |
| `special` | string? | `"keyboard"` — generated at runtime; `buttons` is empty. |

## Button

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Unique across the whole file, stable forever. User edits key off it. |
| `label` | string | The word shown under the symbol. |
| `speak` | string | What is said aloud. May differ from `label` and may be a whole sentence. |
| `type` | string | `word` · `phrase` · `folder` · `action` |
| `icon` | object\|null | `{ "kind": "emoji", "value": "🍎" }` or `{ "kind": "svg", "value": "want" }` |
| `color` | string | A swatch name from `colors`. |
| `target` | string\|null | Board id to open. Required when `type` is `folder`. |
| `action` | string\|null | `speak` · `backspace` · `clear` · `undo` · `home` · `back`. Required when `type` is `action`. |
| `grammar` | object? | Irregular forms: `pos`, `plural`, `past`, `ing`. |

`grammar` entries override the regular rules in `js/grammar.js`. Give a word an
irregular form here rather than teaching the rules another exception — for
example `{ "past": "went", "ing": "going" }` on `go`.

## Colour swatches

Bright crayon versions of the usual AAC colour convention, so the layout
transfers to whatever device she meets at school.

| Swatch | Used for | Crayon |
|---|---|---|
| `core` | the core rail | teal |
| `people` | people and pronouns | yellow |
| `verb` | doing words | green |
| `describe` | describing words | blue |
| `noun` | things | orange |
| `social` | social phrases | pink |
| `question` | question words | purple |
| `negation` | no, not, don't | red |
| `urgent` | bathroom, pain, "I need a break" | red, with a halo outline |

## Grammar bar

Hidden behind a setting by default. Each entry is
`{ id, label, hint, op }`, where `op` is one of `plural`, `ing`, `past`,
`will`, `possessive`, `negate`, `article_a`, `article_the`. Operations apply to
the **last word in the sentence bar**, and each one rebuilds from that word's
original form rather than stacking on the previous ending.
