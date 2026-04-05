#!/bin/bash

# ==========================================
# LocalVoice - Linux/macOS Startup Script
# ==========================================

# Colors for terminal output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}==========================================${NC}"
echo -e "${CYAN}    LocalVoice Backend Startup Wizard     ${NC}"
echo -e "${CYAN}==========================================${NC}"
echo ""

# 1. Ensure we are in the correct directory (server)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# 2. Check Virtual Environment
if [ ! -d "venv" ]; then
    echo -e "${RED}[ERROR] Virtual environment not found in $SCRIPT_DIR/venv${NC}"
    echo "Please create it and install dependencies first:"
    echo "  python3 -m venv venv"
    echo "  source venv/bin/activate"
    echo "  pip install -r requirements.txt"
    exit 1
fi

# 3. Scan Models Directory
MODELS_BASE_DIR="$SCRIPT_DIR/resources/models"
if [ ! -d "$MODELS_BASE_DIR" ]; then
    echo -e "${RED}[ERROR] Models directory not found at $MODELS_BASE_DIR${NC}"
    exit 1
fi

echo -e "${YELLOW}Scanning for available models in resources/models/...${NC}"
echo ""

# Find subdirectories in resources/models (each subdir is assumed to be a model)
models=()
i=1
while IFS= read -r dir; do
    # Only list directories that contain an .onnx file somewhere inside them
    if find "$dir" -maxdepth 2 -name "*.onnx" | grep -q .; then
        models+=("$dir")
        # Extract just the folder name for display
        model_name=$(basename "$dir")
        echo -e "  [${GREEN}$i${NC}] $model_name"
        ((i++))
    fi
done < <(find "$MODELS_BASE_DIR" -mindepth 1 -maxdepth 1 -type d | sort)

if [ ${#models[@]} -eq 0 ]; then
    echo -e "${RED}[WARNING] No valid ONNX models found in $MODELS_BASE_DIR${NC}"
    echo "The server will start, but TTS engine will be disabled."
    echo "Press Enter to continue anyway, or Ctrl+C to abort."
    read -r
    SELECTED_MODEL_DIR=""
else
    echo ""
    echo -e "Enter the number of the model you want to use [1-${#models[@]}] (Default: 1): \c"
    read -r choice

    # Default to 1 if empty input
    if [ -z "$choice" ]; then
        choice=1
    fi

    # Validate input
    if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt "${#models[@]}" ]; then
        echo -e "${RED}[ERROR] Invalid choice. Aborting.${NC}"
        exit 1
    fi

    # Array is 0-indexed
    idx=$((choice-1))
    SELECTED_MODEL_DIR="${models[$idx]}"
    echo -e "${GREEN}Selected Model: $(basename "$SELECTED_MODEL_DIR")${NC}"
fi

echo ""
echo -e "${CYAN}Activating virtual environment...${NC}"
source venv/bin/activate

echo -e "${CYAN}Starting FastAPI Server...${NC}"
echo "---------------------------------------------------"

# Export the chosen model directory so FastAPI picks it up
if [ -n "$SELECTED_MODEL_DIR" ]; then
    export MODEL_DIR="$SELECTED_MODEL_DIR"
fi

# Run the server
uvicorn app.main:app --host 0.0.0.0 --port 7860
