# huffman

Build a Huffman code from text on stdin and report the compression ratio
against fixed-width 8-bit encoding.

```sh
$ echo "the quick brown fox jumps over the lazy dog" | python3 huffman.py
input chars:      44
unique symbols:   27
original bits:    352
compressed bits:  189
compression:      53.7% (46.3% savings)
sample codes (shortest first):
   ' ' -> 001
       e -> 010
       o -> 011
       ...
```

The implementation includes both `encode()` and `decode()`, and the test suite
verifies that a random text roundtrips losslessly.
