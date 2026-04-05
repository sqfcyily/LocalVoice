@echo off
setlocal enabledelayedexpansion

:: ==========================================
:: LocalVoice - Windows Startup Script
:: ==========================================

:: Switch to the script directory (server)
cd /d "%~dp0"

echo ==========================================
echo     LocalVoice Backend Startup Wizard
echo ==========================================
echo.

:: 1. Check Virtual Environment
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found in %CD%\venv
    echo Please create it and install dependencies first:
    echo   python -m venv venv
    echo   call venv\Scripts\activate.bat
    echo   pip install -r requirements.txt
    pause
    exit /b 1
)

:: 2. Scan Models Directory
set "MODELS_BASE_DIR=%CD%\resources\models"
if not exist "%MODELS_BASE_DIR%" (
    echo [ERROR] Models directory not found at %MODELS_BASE_DIR%
    pause
    exit /b 1
)

echo Scanning for available models in resources\models\...
echo.

:: Build a list of subdirectories containing .onnx files
set "count=0"
for /d %%D in ("%MODELS_BASE_DIR%\*") do (
    :: Check if the directory contains an .onnx file (max depth 2)
    dir /s /b "%%D\*.onnx" >nul 2>&1
    if not errorlevel 1 (
        set /a count+=1
        set "model_!count!=%%D"
        echo   [!count!] %%~nxD
    )
)

if !count! equ 0 (
    echo [WARNING] No valid ONNX models found in %MODELS_BASE_DIR%
    echo The server will start, but TTS engine will be disabled.
    echo Press any key to continue anyway, or Ctrl+C to abort.
    pause >nul
    set "SELECTED_MODEL_DIR="
) else (
    echo.
    set /p choice="Enter the number of the model you want to use [1-!count!] (Default: 1): "
    
    :: Default to 1 if empty input
    if "!choice!"=="" set "choice=1"

    :: Validate input (basic check)
    if !choice! lss 1 (
        echo [ERROR] Invalid choice. Aborting.
        pause
        exit /b 1
    )
    if !choice! gtr !count! (
        echo [ERROR] Invalid choice. Aborting.
        pause
        exit /b 1
    )

    :: Retrieve the chosen model path
    for %%i in (!choice!) do set "SELECTED_MODEL_DIR=!model_%%i!"
    
    :: Extract the folder name to display
    for %%i in ("!SELECTED_MODEL_DIR!") do echo Selected Model: %%~nxi
)

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Starting FastAPI Server...
echo ---------------------------------------------------

:: Set the environment variable for FastAPI
if defined SELECTED_MODEL_DIR (
    set "MODEL_DIR=!SELECTED_MODEL_DIR!"
)

:: Run the server
uvicorn app.main:app --host 0.0.0.0 --port 7860

pause
