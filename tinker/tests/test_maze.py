import unittest

from tests._helper import load

m = load("maze")


def _reachable(width, height, walls):
    """BFS from (0,0) and return set of reachable cells."""
    seen = {(0, 0)}
    stack = [(0, 0)]
    while stack:
        x, y = stack.pop()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in seen:
                if frozenset({(x, y), (nx, ny)}) not in walls:
                    seen.add((nx, ny))
                    stack.append((nx, ny))
    return seen


class TestMaze(unittest.TestCase):
    def test_perfect_maze_is_connected(self):
        w, h = 10, 6
        walls = m.generate(w, h, seed=42)
        self.assertEqual(len(_reachable(w, h, walls)), w * h)

    def test_perfect_maze_has_n_minus_1_passages(self):
        # internal edges in an m×n grid: m*(n-1) + n*(m-1)
        # a perfect maze removes exactly m*n - 1 of them (spanning tree)
        w, h = 8, 5
        walls = m.generate(w, h, seed=1)
        internal = w * (h - 1) + h * (w - 1)
        passages = internal - len(walls)
        self.assertEqual(passages, w * h - 1)

    def test_seed_reproducible(self):
        a = m.generate(6, 6, seed=99)
        b = m.generate(6, 6, seed=99)
        self.assertEqual(a, b)

    def test_render_returns_string(self):
        walls = m.generate(3, 3, seed=0)
        out = m.render(3, 3, walls)
        self.assertIsInstance(out, str)
        self.assertIn("+", out)


if __name__ == "__main__":
    unittest.main()
