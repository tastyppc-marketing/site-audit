# markov

Train a Markov chain on text from stdin and generate new text.

```sh
$ curl -s https://www.gutenberg.org/files/11/11-0.txt | python3 markov.py --order=2 --length=40 --seed=7
```

Flags:

| flag | default | meaning |
| --- | --- | --- |
| `--order=N` | `1` | how many preceding words form the chain state |
| `--length=N` | `30` | number of tokens to emit |
| `--seed=N` | none | reproducible output |

Higher orders sound more like the source but are more constrained — order 2-3
is usually the sweet spot for English prose.
