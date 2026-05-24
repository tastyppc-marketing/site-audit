# histogram

Horizontal bar chart from numbers or `label:value` pairs. Reads from stdin or argv.

```sh
$ python3 histogram.py "python:42, rust:30, go:18, ts:55"
  python │ ██████████████████████████████ 42
    rust │ █████████████████████ 30
      go │ █████████████ 18
      ts │ ████████████████████████████████████████ 55

$ python3 histogram.py 3 7 2 9 4 1 8
  0 │ █████████████ 3
  1 │ ██████████████████████████████ 7
  2 │ ████████ 2
  3 │ ████████████████████████████████████████ 9
  ...
```

Raw numbers get auto-numbered labels. Bars are scaled so the maximum value
fills 40 columns.
