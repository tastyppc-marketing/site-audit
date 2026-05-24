# conway

Conway's Game of Life animated in the terminal using ANSI escape codes.

```sh
python3 conway.py             # default 60×25, 200 generations
python3 conway.py 100 30 500  # custom width, height, generation count
```

Press `Ctrl-C` to stop. The cursor is hidden during animation and restored on exit.

The board wraps around the edges (toroidal topology), so gliders that fall off
the right edge come back on the left.
