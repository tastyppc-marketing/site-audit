"""Test helper: load an experiment's module by name."""

import importlib.util
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
EXPERIMENTS = ROOT / "experiments"


def load(name):
    path = EXPERIMENTS / name / f"{name}.py"
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod
