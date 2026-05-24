import unittest

from tests._helper import load

m = load("huffman")


class TestHuffman(unittest.TestCase):
    def test_roundtrip(self):
        text = "the quick brown fox jumps over the lazy dog"
        bits, codes = m.encode(text)
        self.assertEqual(m.decode(bits, codes), text)

    def test_roundtrip_unicode(self):
        text = "héllo wörld — αβγ"
        bits, codes = m.encode(text)
        self.assertEqual(m.decode(bits, codes), text)

    def test_empty_input(self):
        bits, codes = m.encode("")
        self.assertEqual(bits, "")
        self.assertEqual(codes, {})

    def test_single_char_gets_one_bit(self):
        bits, codes = m.encode("aaaa")
        self.assertEqual(set(codes.keys()), {"a"})
        self.assertEqual(len(codes["a"]), 1)
        self.assertEqual(len(bits), 4)

    def test_codes_are_prefix_free(self):
        text = "abracadabra " * 10
        _, codes = m.encode(text)
        values = sorted(codes.values(), key=len)
        for i, short in enumerate(values):
            for longer in values[i + 1:]:
                self.assertFalse(longer.startswith(short),
                                 f"{longer!r} starts with prefix {short!r}")


if __name__ == "__main__":
    unittest.main()
