# dice

Roll dice in standard `NdM±K` notation. Rolls of d6 print ASCII art for the faces.

```sh
$ python3 dice.py 3d6+2 --seed=42
┌─────┐ ┌─────┐ ┌─────┐
│ • • │ │     │ │     │
│ • • │ │  •  │ │  •  │
│ • • │ │     │ │     │
└─────┘ └─────┘ └─────┘
rolls: [6, 1, 1]  modifier: +2  total: 10

$ python3 dice.py 2d20 --seed=1
rolls: [5, 19]  modifier: +0  total: 24
```

The `--seed=N` flag makes rolls reproducible — handy for testing or for showing
off the same demo twice.
