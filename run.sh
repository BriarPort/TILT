#!/bin/bash
# Startup script for TILT Dashboard
# Starts FastAPI backend and React frontend dev servers

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "🚀 Starting TILT Dashboard..."

# Check if Python venv exists, create if not
if [ ! -d "$BACKEND_DIR/venv" ]; then
    echo "📦 Creating Python virtual environment..."
    cd "$BACKEND_DIR"
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate venv and install requirements
echo "📥 Installing Python dependencies..."
cd "$BACKEND_DIR"
source venv/bin/activate
pip install --upgrade pip > /dev/null 2>&1
pip install -q -r requirements.txt
echo "✅ Python dependencies installed"

# Start FastAPI server in background
echo "🔧 Starting FastAPI backend on http://127.0.0.1:8000..."
cd "$BACKEND_DIR"
source venv/bin/activate
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload > /tmp/tilt-backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait a moment for backend to start
sleep 2

# Check if node_modules exists, install if not
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    cd "$FRONTEND_DIR"
    npm install
    echo "✅ Node.js dependencies installed"
fi

# Start React dev server
echo "⚛️  Starting React frontend on http://localhost:3000..."
cd "$FRONTEND_DIR"
npm run dev > /tmp/tilt-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "✨ TILT Dashboard is running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://127.0.0.1:8000"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f /tmp/tilt-backend.log"
echo "   Frontend: tail -f /tmp/tilt-frontend.log"
echo ""
echo "🛑 To stop: pkill -f 'uvicorn main:app' && pkill -f 'vite'"
echo ""

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait

