# entropy

Compute Shannon entropy of a byte stream and (for inputs ≤ 4 KiB) print a
byte-frequency histogram.

```sh
$ python3 entropy.py /etc/hostname
source:   /etc/hostname
bytes:    12
entropy:  3.0220 bits/byte (max 8.0)
density:  37.8% of optimal
```

Pipe random data to see it climb toward the 8.0 ceiling:

```sh
$ head -c 4096 /dev/urandom | python3 entropy.py
```

High-entropy bytes are random or already-compressed; low-entropy bytes have
structure left to squeeze out.
