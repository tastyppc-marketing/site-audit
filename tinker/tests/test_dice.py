import random
import unittest

from tests._helper import load

m = load("dice")


class TestDice(unittest.TestCase):
    def test_parse_basic(self):
        self.assertEqual(m.parse("3d6+2"), (3, 6, 2))
        self.assertEqual(m.parse("d20"), (1, 20, 0))
        self.assertEqual(m.parse("2d10-1"), (2, 10, -1))

    def test_parse_rejects_garbage(self):
        for bad in ("0d6", "1d1", "abc", "3x6", ""):
            with self.assertRaises(ValueError):
                m.parse(bad)

    def test_roll_bounds(self):
        rng = random.Random(42)
        rolls, total = m.roll(10, 6, 0, rng)
        self.assertEqual(len(rolls), 10)
        for r in rolls:
            self.assertGreaterEqual(r, 1)
            self.assertLessEqual(r, 6)
        self.assertEqual(total, sum(rolls))

    def test_roll_modifier(self):
        rolls, total = m.roll(3, 6, 5, random.Random(0))
        self.assertEqual(total, sum(rolls) + 5)

    def test_seed_reproducible(self):
        a, _ = m.roll(5, 20, 0, random.Random(123))
        b, _ = m.roll(5, 20, 0, random.Random(123))
        self.assertEqual(a, b)


if __name__ == "__main__":
    unittest.main()
