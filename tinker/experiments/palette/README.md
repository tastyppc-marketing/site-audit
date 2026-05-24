# palette

Generate a 5-color palette from a single hex seed and print it with true-color
ANSI swatches in the terminal.

```sh
$ python3 palette.py "#3b82f6"
       #d0e0fa  tint
       #84b1f9  light
       #3b82f6  base
       #0452d1  shade
       #f6af3b  complement
```

The palette is a simple HLS ramp around the seed — tint, light, base, shade —
plus a hue-rotated complement. Requires a terminal that supports 24-bit color
(most modern terminals do).
