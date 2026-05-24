import unittest

from tests._helper import load

m = load("markov")


class TestMarkov(unittest.TestCase):
    def test_tokenize(self):
        self.assertEqual(m.tokenize("a b  c\nd"), ["a", "b", "c", "d"])

    def test_build_order_one(self):
        chain = m.build(["a", "b", "a", "b", "c"], order=1)
        self.assertIn("b", chain[("a",)])
        self.assertIn("a", chain[("b",)])
        self.assertIn("c", chain[("b",)])

    def test_empty_chain(self):
        self.assertEqual(m.generate({}, 10), "")

    def test_generate_deterministic_with_seed(self):
        tokens = "the quick brown fox jumps over the lazy dog the quick brown fox".split()
        chain = m.build(tokens, order=1)
        a = m.generate(chain, 12, order=1, seed=7)
        b = m.generate(chain, 12, order=1, seed=7)
        self.assertEqual(a, b)

    def test_generate_length_respected(self):
        tokens = ["a", "b"] * 50
        chain = m.build(tokens, order=1)
        out = m.generate(chain, 10, order=1, seed=0)
        self.assertEqual(len(out.split()), 10)


if __name__ == "__main__":
    unittest.main()
