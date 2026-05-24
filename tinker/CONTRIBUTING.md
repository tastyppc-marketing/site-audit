# Contributing

The bar for inclusion is low, but the bar for spirit is high.

## What belongs here

A new experiment should fit on one screen, do one thing clearly, and use
nothing but the Python standard library. If the idea needs a build step,
a config file, or pip dependencies, it belongs in its own repo.

Good experiments tend to be:

- a visualization that prints to a terminal (sparkline, histogram, maze)
- a classic algorithm whose code is the point (huffman, conway, markov)
- a tiny CLI that does one well-defined thing (dice, entropy, palette)

## Adding an experiment

1. Scaffold the folder:

   ```sh
   python3 tinker.py new <name>
   ```

   This creates `experiments/<name>/<name>.py` and `experiments/<name>/README.md`.

2. Replace the placeholder with your idea. Put the actual logic in named
   functions (not buried in `if __name__ == "__main__":`) so the test
   suite can import and exercise it.

3. Add a test at `tests/test_<name>.py` covering at least:
   - a positive case with known input → known output
   - an edge case (empty input, single element, etc.)
   - if randomness is involved, a seeded reproducibility check

4. Verify locally:

   ```sh
   python3 tinker.py test
   python3 tinker.py run <name>
   ```

5. Update `README.md`, `CHANGELOG.md`, and the `docs/index.html` card grid.

## Style notes

- Stdlib only. The runner enforces nothing — discipline is on you.
- One file, one folder. No `lib/` subdirectories. If your code is too big
  to fit in one file, it's probably too big for this repo.
- No type hints, no `mypy`, no formatters mandated. Write clear Python.
- Comments only when the *why* isn't obvious from the code.

## What gets rejected

- Anything requiring an API key, network call, or external service.
- Wrappers around bigger libraries.
- Reimplementations of things already here (one Markov is enough).
- Anything that takes more than a second to run on cold start.

If in doubt, open a PR anyway. The conversation is the point.
