# sparkline

Print a unicode sparkline from a sequence of numbers.

```sh
$ python3 sparkline.py 1 4 2 9 6 3
▁▄▂█▆▃

$ echo "10, 20, 30, 25, 40, 35" | python3 sparkline.py
▁▃▆▅█▇

$ git log --since='30 days ago' --pretty=%ad --date=format:%j | sort | uniq -c | awk '{print $1}' | python3 sparkline.py
```

Accepts whitespace- or comma-separated numbers. No flags, no config.
