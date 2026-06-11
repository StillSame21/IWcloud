"""FastAPI bridge for the EcoPyCSIM dashboard."""

import os
from pathlib import Path

# Matplotlib (imported transitively by the simulation env) needs a writable
# config dir before its first import.
os.environ.setdefault('MPLCONFIGDIR', '/tmp/matplotlib')
Path(os.environ['MPLCONFIGDIR']).mkdir(parents=True, exist_ok=True)
