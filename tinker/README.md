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
| [`dice/`](experiments/dice/) | Roll dice in `NdM±K` notation, with ASCII art for d6 |
| [`markov/`](experiments/markov/) | Train a Markov chain on stdin text and generate new text |
| [`maze/`](experiments/maze/) | Generate a perfect ASCII maze (recursive backtracker) |
| [`huffman/`](experiments/huffman/) | Huffman-encode text from stdin and report compression ratio |
| [`entropy/`](experiments/entropy/) | Shannon entropy of a file + byte-frequency histogram |
| [`histogram/`](experiments/histogram/) | Horizontal bar chart from numbers or `label:value` pairs |

## Running

Everything is Python 3, no `pip install` required. The `tinker.py` runner ties
the experiments together:

```sh
python3 tinker.py list                   # list all experiments
python3 tinker.py run dice 3d6+2         # run one with passthrough args
python3 tinker.py new spirograph         # scaffold a new experiment
python3 tinker.py test                   # run the test suite
```

Or just run an experiment directly:

```sh
python3 experiments/sparkline/sparkline.py 1 4 2 9 6 3
python3 experiments/palette/palette.py "#3b82f6"
python3 experiments/maze/maze.py 20 10
```

## Adding an experiment

1. Run `python3 tinker.py new <name>` to scaffold the folder, `.py` file and README.
2. Replace the placeholders with your idea.
3. Stdlib only. No build step. If you reach for a framework, you've left the spirit of the repo.
4. If your code has pure functions, add a test under `tests/test_<name>.py`.

## License

MIT.
