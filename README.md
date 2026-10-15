# HARLEY website

Static project page for **HARLEY**, the user-pressure benchmark (paper: *Single-turn misalignment is not a solved problem: Measuring the effect of user pressure with matched controls*). Plain HTML, CSS and JavaScript, with no build step and no dependencies. It can be hosted on GitHub Pages as is.

The theme nods to the Harley of Elbaph: an owl (the Owl Library keeps the text), the benchmark drawn as rings in a tree's bark, sections named after the three "worlds", and a *Translate* toggle for the non-English sets.

## Run locally

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765.

**Light and dark mode.** The page follows the system setting. The sun/moon switch in the top-right corner overrides it, and the choice is remembered in that browser (`localStorage`, key `harley-theme`). Light mode uses an aged-paper palette rather than white, so it doesn't glare.

**One Piece touches in the charts.** Each one is a working part of a chart, so readers who don't know the series lose nothing:
- *Biblo wakes up.* The owl in the top bar dozes, and opens its eyes while a model's answer is showing (`assets/img/owl-awake.png`, the same drawing with the eyes redrawn).
- *Poneglyph reading.* Pressing *Translate* first shows the English carved in Poneglyph glyphs, then reads it out word by word; switching back carves it again before the original script returns. Each carved word is sized to the width of the real word, so lines never reflow. The font is `assets/fonts/poneglyph.woff2`.
- *Rubber arm.* In section I each target dot stretches out from the aligned control, overshoots and snaps back; bigger gaps stretch further. Clicking a row replays it.
- *Six emperors and a Log Pose.* Section III shows the six frontier models as cards, with one pip per target that broke the model; pips fill as you drag the cutoff, and clicking a card highlights its ticks. The slider handle is a Log Pose whose needle points at the next failure still below the cutoff. Uses `screening.frontier` and the fourth field of `screening.prompts` (a bitmask over the six models), both written by `build_data.py`.

None of these run with reduced motion turned on; the content is all still there.

**Three small touches** (`assets/css/fx.css`, `assets/js/fx.js`): a ship sails along the top towards the tree as you scroll, a serpent circles the rings, and the example scroll unrolls verse by verse with its rollers turning. They decorate `main.js` without changing it. Add `?calm` to the URL to switch them off; they're also off for anyone with reduced motion enabled. The full over-the-top version is kept on the `over-the-top` branch.

## Page sections

| Section | Shows | Source |
|---|---|---|
| Hero rings | all 1,591 sets by language; heavier marks = the 200 gold sets | gold and silver H/J label files |
| *The verses* | three example sets (zh / en / ar) unrolling prompt by prompt, with each prompt's 17 models × 5 samples outcome grid and one featured answer | `analysis/main.parquet` + `data/curated.json` |
| I · pressure | misalignment on A vs T per model (dumbbells) | recomputed from the three judge passes |
| II · the split | 60 H / 140 J sets; refusal change J−T and H−A per model | the paper's per-model values (Figure 2) |
| III · prophecy | 200 targets ranked by Gemma 4 31B + Qwen 3.8 27B, with the 31 frontier failures; drag the cutoff | recomputed |

## Rebuilding the data

`data/site-data.js` is generated; don't edit it by hand. Hand-written content lives in `data/curated.json`: the paper numbers, translations and response excerpts.

```bash
python3 scripts/build_data.py \
  --analysis /path/to/harley-analysis-data/analysis/main.parquet \
  --gold     /path/to/hard_negative_gold_reviewed_labels.csv \
  --silver   /path/to/derived/hard_negative_audit/silver_hard_negative_labels.csv
```

Before writing anything, the script checks its results against the paper:
- pooled A, T and S misalignment (4.3 / 20.4 / 1.8);
- T−A (+16.1), which also matches all 17 per-model values in Figure 2;
- 31 screening positives (AUC 0.876, with 28 of 31 in the top third);
- 1,591 sets in 17 languages.

## Before going public

- [ ] Fill in `LINKS` (paper, dataset, code) at the top of `assets/js/main.js`. Until then the buttons show "soon".
- [ ] Replace the anonymous BibTeX in `index.html` once the paper is de-anonymised. Don't deploy publicly while the paper is under anonymous review.
- [ ] Have native speakers check the Chinese and Arabic translations in `data/curated.json`. The set 38 translations come from `notes/fig1_new_example.md`; the set 814 translations are drafts.
- [ ] **H/J split.** Section II uses the paper's 60 H / 140 J and its per-model values. The label file used for the hero (`hard_negative_gold_reviewed_labels.csv`, also on HF) still has 62 / 138. Once the final labels are released, regenerate and switch section II to recomputed values.
- [ ] Find the source and licence of the Poneglyph font (`assets/fonts/poneglyph.woff2`, family name "Poneglyphs") before going public.
- [ ] Example responses come from the team's HF release, which is marked as team-only. Confirm the three examples may be shown publicly.
