import unittest

from tests._helper import load

m = load("palette")


class TestPalette(unittest.TestCase):
    def test_parse_hex_six_digit(self):
        r, g, b = m.parse_hex("#ff8000")
        self.assertAlmostEqual(r, 1.0)
        self.assertAlmostEqual(g, 128 / 255)
        self.assertAlmostEqual(b, 0.0)

    def test_parse_hex_three_digit(self):
        self.assertEqual(m.parse_hex("#fff"), m.parse_hex("#ffffff"))

    def test_parse_hex_rejects_garbage(self):
        with self.assertRaises(ValueError):
            m.parse_hex("not-a-color")

    def test_to_hex_roundtrip(self):
        original = "#3b82f6"
        self.assertEqual(m.to_hex(m.parse_hex(original)), original)

    def test_palette_returns_five_colors(self):
        rgb = m.parse_hex("#3b82f6")
        pal = m.palette(rgb)
        self.assertEqual(len(pal), 5)
        # base is the original (index 2)
        for a, b in zip(pal[2], rgb):
            self.assertAlmostEqual(a, b, places=6)


if __name__ == "__main__":
    unittest.main()
