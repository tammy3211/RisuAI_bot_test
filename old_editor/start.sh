#!/bin/bash

echo "========================================"
echo "RisuAI Character Editor Starting..."
echo "========================================"
echo ""
echo "This will open the Character Editor in your default browser."
echo ""
echo "You can test:"
echo "- CBS Scripts"
echo "- Lua Scripts"
echo "- Regex Triggers"
echo ""
echo "Press Ctrl+C to stop the server when done."
echo "========================================"
echo ""

# Change to script directory
cd "$(dirname "$0")"

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "Starting Python3 server on http://localhost:8000"
    echo ""
    
    # Open browser (try different commands for different OS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open http://localhost:8000
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open http://localhost:8000 2>/dev/null || echo "Please open http://localhost:8000 in your browser"
    fi
    
    python3 -m http.server 8000
    
elif command -v python &> /dev/null; then
    echo "Starting Python server on http://localhost:8000"
    echo ""
    
    # Open browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:8000
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:8000 2>/dev/null || echo "Please open http://localhost:8000 in your browser"
    fi
    
    python -m http.server 8000
    
else
    echo "Python not found!"
    echo "Please install Python or open index.html directly in your browser."
    echo ""
    
    # Try to open the file directly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open index.html
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open index.html 2>/dev/null
    fi
fi
