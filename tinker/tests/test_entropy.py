import math
import unittest

from tests._helper import load

m = load("entropy")


class TestEntropy(unittest.TestCase):
    def test_empty(self):
        self.assertEqual(m.shannon(b""), 0.0)

    def test_constant_is_zero(self):
        self.assertEqual(m.shannon(b"aaaaaa"), 0.0)

    def test_uniform_distribution(self):
        # 256 distinct bytes, each appearing once -> entropy is log2(256) = 8
        data = bytes(range(256))
        self.assertAlmostEqual(m.shannon(data), 8.0, places=6)

    def test_two_symbols_half_each(self):
        # equal probability for two symbols -> entropy is 1 bit/symbol
        self.assertAlmostEqual(m.shannon(b"ababab"), 1.0, places=6)

    def test_histogram_lines_match_unique_bytes(self):
        data = b"hello"
        out = m.histogram(data)
        # 4 unique bytes (h, e, l, o) -> 4 lines
        self.assertEqual(len(out.splitlines()), 4)


if __name__ == "__main__":
    unittest.main()
