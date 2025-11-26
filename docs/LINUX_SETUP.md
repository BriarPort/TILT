# TILT Dashboard - Linux Setup Guide

This guide explains how to set up and run the TILT Dashboard on Linux.

## Prerequisites

- **Python 3.12+** (check with `python3 --version`)
- **Node.js 16+** and npm (check with `node --version` and `npm --version`)
- **Linux** (tested on Ubuntu/Debian, should work on other distros)

## Quick Start

1. **Make the startup script executable:**
   ```bash
   chmod +x run.sh
   ```

2. **Run the application:**
   ```bash
   ./run.sh
   ```

   This script will:
   - Create a Python virtual environment in `/backend/venv` (if it doesn't exist)
   - Install Python dependencies from `backend/requirements.txt`
   - Start the FastAPI backend on `http://127.0.0.1:8000`
   - Install Node.js dependencies (if needed)
   - Start the React frontend dev server on `http://localhost:3000`

3. **Open your browser:**
   - Navigate to `http://localhost:3000`
   - The frontend will automatically connect to the backend API

## Manual Setup (Alternative)

If you prefer to run the servers manually:

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend Setup

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
TILT programming/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── api.js         # API utility (fetch calls)
│   │   └── utils/         # Risk calculator
│   ├── package.json
│   └── vite.config.js
├── backend/           # FastAPI backend
│   ├── main.py            # FastAPI app & endpoints
│   ├── database.py        # SQLite database layer
│   ├── risk_calculator.py # Risk calculation logic
│   ├── osint_service.py   # OSINT security checks
│   ├── requirements.txt
│   └── data/              # Question JSON files
├── run.sh             # Startup script
└── LINUX_SETUP.md     # This file
```

## Security Notes

### Current Implementation

- **Password Hashing:** Argon2 (via `passlib[argon2]`)
- **Database:** Standard SQLite3 (unencrypted)
- **Master Password:** Stored as Argon2 hash in `.tilt_key`

### Future: SQLCipher Migration

To enable database encryption (TILT Tier 3 compliance):

1. Install `libsqlcipher-dev`:
   ```bash
   sudo apt-get install libsqlcipher-dev
   ```

2. Install `pysqlcipher3`:
   ```bash
   cd backend
   source venv/bin/activate
   pip install pysqlcipher3
   ```

3. Update `backend/database.py` to use SQLCipher instead of sqlite3
4. The encryption key will be derived from the master password using Argon2

**WARNING:** The current implementation uses unencrypted SQLite. Do not use in production without SQLCipher.

## Troubleshooting

### Port Already in Use

If port 3000 or 8000 is already in use:

- **Backend:** Edit `backend/main.py` and change the port in `uvicorn.run()`
- **Frontend:** Edit `frontend/vite.config.js` and change the `server.port` value

### Python Virtual Environment Issues

If the venv fails to create:

```bash
sudo apt-get install python3-venv
```

### Node.js Not Found

Install Node.js:

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Database Locked Error

If you see "Database is locked" errors:

1. Make sure no other process is using the database
2. Check `backend/tilt_data.db` file permissions
3. Delete `backend/.tilt_key` to reset (WARNING: This will require setting a new password)

## Stopping the Application

Press `Ctrl+C` in the terminal running `run.sh`, or:

```bash
pkill -f 'uvicorn main:app'
pkill -f 'vite'
```

## Development

- **Backend logs:** `tail -f /tmp/tilt-backend.log`
- **Frontend logs:** `tail -f /tmp/tilt-frontend.log`
- **API docs:** Visit `http://127.0.0.1:8000/docs` (FastAPI auto-generated docs)

## Next Steps

1. Set your master password on first launch
2. Add vendors and run assessments
3. Use OSINT tools to check vendor security posture
4. Review the risk matrix visualization

For questions or issues, check the code comments (they're written for future-you).

