# tinker

A collection of tiny, single-file code experiments — generative art, small games,
useful CLIs. Each folder under `experiments/` is one self-contained idea, with
no dependencies beyond the Python standard library.

The bar for inclusion is low: it has to run, and it has to be the smallest thing
that demonstrates the idea. Refactors and abstractions are explicitly not
welcome here.

## Experiments

| folder | what it does |
| --- | --- |
| [`sparkline/`](experiments/sparkline/) | Print unicode sparklines from numbers on stdin or argv |
| [`conway/`](experiments/conway/) | Conway's Game of Life animated in the terminal |
| [`palette/`](experiments/palette/) | Generate a 5-color palette from any hex seed, printed with true-color swatches |

## Running

Everything is Python 3, no `pip install` required.

```sh
python3 experiments/sparkline/sparkline.py 1 4 2 9 6 3
python3 experiments/conway/conway.py
python3 experiments/palette/palette.py "#3b82f6"
```

## Adding an experiment

1. Make a folder under `experiments/`.
2. Drop in one `.py` file and a short `README.md`.
3. Stdlib only. No build step. If you reach for a framework, you've left the spirit of the repo.

## License

MIT.
