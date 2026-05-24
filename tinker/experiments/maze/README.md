# maze

Generate a perfect maze (exactly one path between any two cells) using the
recursive-backtracker algorithm. Output is plain ASCII.

```sh
$ python3 maze.py 12 6 42
+---+---+---+---+---+---+---+---+---+---+---+---+
|                       |                       |
+---+---+   +   +---+   +---+   +---+   +---+   +
...
```

Arguments: `width height [seed]`. Width and height default to 15×8.
