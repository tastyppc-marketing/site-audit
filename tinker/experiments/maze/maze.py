#!/usr/bin/env python3
"""maze — generate an ASCII maze using recursive backtracking."""

import random
import sys


def generate(width, height, seed=None):
    rng = random.Random(seed)
    visited = set()
    walls = set()
    for y in range(height):
        for x in range(width):
            if x + 1 < width:
                walls.add(frozenset({(x, y), (x + 1, y)}))
            if y + 1 < height:
                walls.add(frozenset({(x, y), (x, y + 1)}))

    stack = [(0, 0)]
    visited.add((0, 0))
    while stack:
        x, y = stack[-1]
        neighbors = []
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                neighbors.append((nx, ny))
        if not neighbors:
            stack.pop()
            continue
        nx, ny = rng.choice(neighbors)
        walls.discard(frozenset({(x, y), (nx, ny)}))
        visited.add((nx, ny))
        stack.append((nx, ny))
    return walls


def render(width, height, walls):
    lines = ["+" + "---+" * width]
    for y in range(height):
        row = "|"
        for x in range(width):
            row += "   "
            if x + 1 == width or frozenset({(x, y), (x + 1, y)}) in walls:
                row += "|"
            else:
                row += " "
        lines.append(row)
        row = "+"
        for x in range(width):
            if y + 1 == height or frozenset({(x, y), (x, y + 1)}) in walls:
                row += "---+"
            else:
                row += "   +"
        lines.append(row)
    return "\n".join(lines)


def main(argv):
    width = int(argv[0]) if len(argv) > 0 else 15
    height = int(argv[1]) if len(argv) > 1 else 8
    seed = int(argv[2]) if len(argv) > 2 else None
    walls = generate(width, height, seed=seed)
    print(render(width, height, walls))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
