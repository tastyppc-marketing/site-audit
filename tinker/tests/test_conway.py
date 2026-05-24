import unittest

from tests._helper import load

m = load("conway")


class TestConway(unittest.TestCase):
    def test_empty_stays_empty(self):
        grid = [[0] * 5 for _ in range(5)]
        self.assertEqual(m.step(grid), grid)

    def test_block_still_life(self):
        # 2x2 block in a 4x4 grid is stable
        grid = [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
        ]
        self.assertEqual(m.step(grid), grid)

    def test_blinker_oscillates(self):
        # horizontal blinker -> vertical blinker -> horizontal blinker
        horizontal = [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
        ]
        vertical = [
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0],
        ]
        self.assertEqual(m.step(horizontal), vertical)
        self.assertEqual(m.step(vertical), horizontal)

    def test_render_dimensions(self):
        grid = [[0, 1], [1, 0]]
        out = m.render(grid)
        self.assertEqual(out.count("\n") + 1, 2)


if __name__ == "__main__":
    unittest.main()
