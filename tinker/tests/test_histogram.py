import unittest

from tests._helper import load

m = load("histogram")


class TestHistogram(unittest.TestCase):
    def test_label_value_pairs(self):
        pairs = m.read_pairs(["python:42, rust:30"])
        self.assertEqual(pairs, [("python", 42.0), ("rust", 30.0)])

    def test_raw_numbers_get_indexed_labels(self):
        pairs = m.read_pairs(["3 1 4"])
        self.assertEqual([p[0] for p in pairs], ["0", "1", "2"])
        self.assertEqual([p[1] for p in pairs], [3.0, 1.0, 4.0])

    def test_empty_input(self):
        self.assertEqual(m.read_pairs([""]), [])
        self.assertEqual(m.render([]), "")

    def test_render_includes_values(self):
        out = m.render([("a", 10), ("b", 5)])
        self.assertIn("10", out)
        self.assertIn("5", out)
        self.assertIn("a", out)
        self.assertIn("b", out)

    def test_max_value_gets_full_width(self):
        out = m.render([("a", 1), ("b", 10)])
        # max value bar should be longest
        lines = out.splitlines()
        a_bars = lines[0].count("█")
        b_bars = lines[1].count("█")
        self.assertLess(a_bars, b_bars)


if __name__ == "__main__":
    unittest.main()
