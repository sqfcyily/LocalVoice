#!/bin/bash
# Nuitka build script for Local TTS Backend

# Ensure Nuitka is installed
pip install nuitka

# Run Nuitka Compilation
# Note: In a real CI/CD pipeline, you will run this on Windows, macOS, and Linux separately.
python3 -m nuitka \
  --standalone \
  --assume-yes-for-downloads \
  --include-data-dir=resources/models=resources/models \
  --include-data-dir=../web/dist=web \
  --include-package=uvicorn \
  --include-package=fastapi \
  --include-package=pydantic \
  --include-package=sherpa_onnx \
  --output-dir=dist \
  app/main.py

echo "Build complete! Check the dist/ directory."
