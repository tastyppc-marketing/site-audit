#!/usr/bin/env python3
"""Conway's Game of Life, animated in the terminal.

Usage: python3 conway.py [width] [height] [generations]
Defaults: 60 x 25 x 200. Press Ctrl-C to stop early.
"""

import os
import random
import shutil
import sys
import time


def step(grid):
    h, w = len(grid), len(grid[0])
    nxt = [[0] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            n = sum(
                grid[(y + dy) % h][(x + dx) % w]
                for dy in (-1, 0, 1)
                for dx in (-1, 0, 1)
                if (dy or dx)
            )
            nxt[y][x] = 1 if (grid[y][x] and n in (2, 3)) or (not grid[y][x] and n == 3) else 0
    return nxt


def render(grid):
    return "\n".join("".join("█" if cell else " " for cell in row) for row in grid)


def main():
    term = shutil.get_terminal_size((80, 24))
    w = int(sys.argv[1]) if len(sys.argv) > 1 else min(60, term.columns - 2)
    h = int(sys.argv[2]) if len(sys.argv) > 2 else min(25, term.lines - 3)
    gens = int(sys.argv[3]) if len(sys.argv) > 3 else 200

    random.seed()
    grid = [[1 if random.random() < 0.28 else 0 for _ in range(w)] for _ in range(h)]

    try:
        sys.stdout.write("\x1b[?25l")  # hide cursor
        for g in range(gens):
            sys.stdout.write("\x1b[H\x1b[2J")
            sys.stdout.write(render(grid))
            sys.stdout.write(f"\ngeneration {g + 1}/{gens}\n")
            sys.stdout.flush()
            time.sleep(0.08)
            grid = step(grid)
    except KeyboardInterrupt:
        pass
    finally:
        sys.stdout.write("\x1b[?25h\n")  # show cursor


if __name__ == "__main__":
    main()
