import unittest

from tests._helper import load

m = load("sparkline")


class TestSparkline(unittest.TestCase):
    def test_empty(self):
        self.assertEqual(m.sparkline([]), "")

    def test_uses_full_range(self):
        out = m.sparkline([0, 1, 2, 3, 4, 5, 6, 7])
        # min char and max char should both appear
        self.assertEqual(out[0], m.BARS[0])
        self.assertEqual(out[-1], m.BARS[-1])

    def test_constant_sequence(self):
        # all values equal -> span is 0, fall back to lowest bar
        out = m.sparkline([5, 5, 5, 5])
        self.assertEqual(set(out), {m.BARS[0]})

    def test_read_numbers_comma_separated(self):
        self.assertEqual(m.read_numbers(["10,20,30"]), [10.0, 20.0, 30.0])

    def test_read_numbers_whitespace(self):
        self.assertEqual(m.read_numbers(["1 2 3"]), [1.0, 2.0, 3.0])


if __name__ == "__main__":
    unittest.main()
