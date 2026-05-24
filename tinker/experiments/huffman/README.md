# huffman

Build a Huffman code from text on stdin and report the compression ratio
against fixed-width 8-bit encoding.

```sh
$ echo "the quick brown fox jumps over the lazy dog" | python3 huffman.py
input chars:      44
unique symbols:   28
original bits:    352
compressed bits:  199
compression:      56.5% (43.5% savings)
sample codes (shortest first):
     ' ' -> 110
       e -> 1001
       o -> 1011
       ...
```

The implementation includes both `encode()` and `decode()`, and the test suite
verifies that a random text roundtrips losslessly.
