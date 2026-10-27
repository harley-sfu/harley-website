# HARLEY website

Static project page for **HARLEY**, the user-pressure benchmark (paper: *Single-turn misalignment is not a solved problem: Measuring the effect of user pressure with matched controls*). Plain HTML, CSS and JavaScript, with no build step and no dependencies. It can be hosted on GitHub Pages as is.

The theme nods to the Harley of Elbaph: an owl (the Owl Library keeps the text), the benchmark drawn as rings in a tree's bark, sections named after the three "worlds", and a *Translate* toggle for the non-English sets.

## Run locally

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765.

**Light and dark mode.** The page follows the system setting. The sun/moon switch in the top-right corner overrides it, and the choice is remembered in that browser (`localStorage`, key `harley-theme`). Light mode uses an aged-paper palette rather than white, so it doesn't glare.

**Links to one set, prompt or model.** `#set=814` opens a set, `#set=814&v=T` also brings that prompt into view and flashes it (`v` is T, A, P, S, H or J), and `#model=kimi-k3` highlights a model in sections I and II and pins its card in section III. Picking a tab writes `#set=…` into the address bar, each prompt has a *Copy link* button (shown on hover), and the model names in section I are links. These are `#` links, so a shared link shows the page's own preview card, not one per set.

**Without a mouse.** Each outcome grid is one tab stop: arrow keys step through the responses (left/right: model, up/down: sample), and a tap snaps to the nearest dot. Dumbbell rows can be focused and tapped too, and their values are read out to screen readers.

**One Piece touches in the charts.** Each one is a working part of a chart, so readers who don't know the series lose nothing:
- *Biblo wakes up.* The owl in the top bar dozes, and opens its eyes while a model's answer is showing (`assets/img/owl-awake.png`, the same drawing with the eyes redrawn).
- *Rubber arm.* In section I each target dot stretches out from the aligned control, overshoots and snaps back; bigger gaps stretch further. Clicking a row replays it.
- *Six emperors and a Log Pose.* Section III shows the six frontier models as cards, with one pip per target that broke the model; pips fill as you drag the cutoff, and clicking a card highlights its ticks. The slider handle is a Log Pose whose needle points at the next failure still below the cutoff. Uses `screening.frontier` and the fourth field of `screening.prompts` (a bitmask over the six models), both written by `build_data.py`.

None of these run with reduced motion turned on; the content is all still there.

**How a set is made** (`assets/css/pipeline.css`, `assets/js/pipeline.js`): in the introduction, set 814 (the paper's Figure 1) is followed through the construction pipeline. Turns drift through a search lens and the ones near a query light up; then the drift stops, a few selected turns gather into a list, and the screen checks each against the paper's four eligibility criteria (agency, one turn, local contrast, source role), dropping a turn at the first one it fails. One Arabic turn that passes all four is caught. Its pressure is marked and it is cast as the target. Four copies split off it and are edited at once into the other prompts: from a word-level diff against the anchor (with lone shared words inside a rewritten clause folded into the edit), a caret goes to each change, selects and deletes what the variant drops, and types what it adds. The highlights follow Figure 1. Before that, the Arabic turn turns into its English translation in place, word by word. Two judges pass over the set and sign off under it, it is gilded into the gold set, and a link leads to the set's results below. It plays once when it scrolls into view and pauses while the mouse rests on it; the steps above it replay it from any point. On one column the stage stays short until the cards split. The ten-batch draw between retrieval and writing is left out. With reduced motion or `?calm` it shows the finished set and the steps switch between end states.

**Two small touches** (`assets/css/creatures.css`, `assets/js/creatures.js`): the Thousand Sunny sails along the top bar towards the tree as you scroll, and a serpent circles the rings. They decorate `main.js` without changing it. Add `?calm` to the URL to switch them off; with reduced motion they're drawn but hold still. The full over-the-top version is kept on the `over-the-top` branch.

## Page sections

| Section | Shows | Source |
|---|---|---|
| Hero rings | all 5,215 sets by language; heavier marks = the 200 gold sets | gold and silver H/J label files |
| *The verses* | first a guessing game (`assets/js/guess.js`): pick which of a set's five prompts broke the most models (3+ of 5 misaligned, or 3+ of 5 answered for a jailbreak), then see the counts; below it, three example sets (zh / en / ar) unrolling prompt by prompt, with each prompt's 17 models × 5 samples outcome grid and one featured answer | `analysis/main.parquet` + `data/curated.json` |
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

To update the collection counts and language rings without recomputing the response study, first update the release counts in `data/curated.json`, then run:

```bash
python3 scripts/build_data.py --composition-only \
  --gold   /path/to/hard_negative_gold_reviewed_labels.csv \
  --silver /path/to/derived/hard_negative_audit/silver_hard_negative_labels.csv
```

This mode checks for unique, disjoint candidate IDs and verifies the 200 gold and 5,015 silver counts. It preserves the existing response results and examples, and records the silver label file's SHA-256 in `built_from`.

Before writing anything, the script checks its results against the paper:
- pooled A, T and S misalignment (4.3 / 20.4 / 1.8);
- T−A (+16.1), which also matches all 17 per-model values in Figure 2;
- 31 screening positives (AUC 0.876, with 28 of 31 in the top third);
- 5,215 sets in 17 languages.

## Before going public

- [ ] Fill in `LINKS` (paper, dataset, code) at the top of `assets/js/main.js`. Until then the buttons show "soon".
- [ ] Replace the anonymous BibTeX in `index.html` once the paper is de-anonymised. Don't deploy publicly while the paper is under anonymous review.
- [ ] Have native speakers check the Chinese and Arabic translations in `data/curated.json`. The set 38 translations come from `notes/fig1_new_example.md`; the set 814 translations are drafts.
- [ ] **H/J split.** Section II uses the paper's 60 H / 140 J and its per-model values. The label file used for the hero (`hard_negative_gold_reviewed_labels.csv`, also on HF) still has 62 / 138. Once the final labels are released, regenerate and switch section II to recomputed values.
- [ ] Example responses come from the team's HF release, which is marked as team-only. Confirm the three examples may be shown publicly.
- [ ] Rewrite the introduction section (`#intro` in `index.html`). The current text is a placeholder drawn from a draft of the paper; check its findings against the final version.
