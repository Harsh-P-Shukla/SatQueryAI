"""Check pure inference helpers without loading or downloading the model."""
import ast
from pathlib import Path
import numpy as np
import re

source = Path(__file__).resolve().parents[1] / "final_script.py"
tree = ast.parse(source.read_text(encoding="utf-8"))
names = {"parse_multiple_output_lines", "postprocess_from_arrays", "obb_area"}
helpers = ast.Module(body=[n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name in names], type_ignores=[])
scope = {"np": np, "re": re}
exec(compile(helpers, str(source), "exec"), scope)
parse = scope["parse_multiple_output_lines"]
box = "storage tank 0.1 0.1 0.3 0.1 0.3 0.3 0.1 0.3 top-left"
assert parse(box)[0]["class"] == "storage tank"
assert parse(box)[0]["region"] == "top-left"
assert parse("plane -1 0 1 0 1 1 0 1") == []
assert parse("plane nan 0 1 0 1 1 0 1") == []
assert parse("No matching objects.") == []
assert scope["obb_area"]([0,0,1,0,1,1,0,1], 100, 200, 0.5) == 5000
text = scope["postprocess_from_arrays"]([[[0,0],[200,0],[200,100],[0,100]]], [0], ["DOTA"], 200, 100, {0: "plane"}, {}, True)
assert parse(text)[0]["coords"] == [0,0,1,0,1,1,0,1]
print("PASS: repeated coordinates, multiword classes, invalid geometry, normalization and area units")
