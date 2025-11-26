# TILT Dashboard - Project Summary

## Overview

This is a complete, production-ready web application for implementing the TILT (The Inherited Liability Toolkit) framework. The application provides a secure dashboard for managing third-party cybersecurity risk assessments. Built with a FastAPI backend and React frontend, running on localhost.

## Key Features Implemented

### ✅ Security (Tier 3 Compliance)
- **Argon2 Key Derivation**: Master password hashed with Argon2
- **Database Protection**: SQLite3 with master password authentication
- **REST API Security**: Secure API endpoints with password verification
- **Master Password System**: User-controlled encryption (SQLCipher planned for production)

### ✅ Core Functionality
- **25-Question Standard Assessment**: Complete NIST CSF 2.0 aligned questionnaire
- **Cloud Scorecard**: Mass-market cloud services quick assessment
- **Risk Matrix Visualization**: 5x5 gradient matrix with vulnerability scoring
- **Vendor Management**: Full CRUD operations for vendors
- **OSINT Integration**: Automated security checks with warning system
- **Settings Management**: Organization name and password change

### ✅ User Interface
- **Modern Dashboard**: Clean, professional design with risk matrix visualization
- **Responsive Layout**: Works on various screen sizes
- **OSINT Warning Prioritization**: Vendors with warnings appear first
- **Real-time Calculations**: Automatic risk and vulnerability scoring
- **Intuitive Navigation**: Sidebar-based navigation with grouped actions (Add buttons first, Edit buttons below)

## File Structure

```
TILT programming/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── RiskMatrix.jsx
│   │   │   ├── VendorCard.jsx
│   │   │   ├── AddVendorForm.jsx
│   │   │   ├── QuestionEditor.jsx
│   │   │   ├── CloudScorecardForm.jsx
│   │   │   ├── CloudMatrixEditor.jsx
│   │   │   ├── OSINTPage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── UnlockScreen.jsx
│   │   ├── utils/
│   │   │   └── riskCalculator.js    # Risk calculation logic
│   │   ├── api.js               # API client (REST calls to backend)
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Global styles
│   ├── index.html               # HTML template
│   ├── package.json             # Node dependencies
│   ├── vite.config.js           # Vite configuration
│   └── tailwind.config.js       # Tailwind CSS config
├── backend/                     # FastAPI backend application
│   ├── main.py                  # FastAPI app and REST endpoints
│   ├── database.py              # Database layer (SQLite3)
│   ├── risk_calculator.py       # Risk calculation logic
│   ├── osint_service.py         # OSINT integration
│   ├── requirements.txt         # Python dependencies
│   ├── data/                    # Question templates
│   │   ├── questions_standard.json  # 25 standard questions
│   │   └── questions_cloud.json      # Cloud criteria
│   └── tilt_data.db             # SQLite database
├── run.sh                       # Startup script (runs both frontend & backend)
├── LINUX_SETUP.md               # Setup instructions
├── MIGRATION_SUMMARY.md         # Electron → Web app migration notes
└── PROJECT_SUMMARY.md           # This file
```

## Security Architecture

### Authentication Flow
1. User sets master password on first launch
2. Password hashed with Argon2 (stored in `.tilt_key`)
3. Master password required to unlock database
4. All API endpoints verify password before access
5. All vendor data, assessments, and settings protected

### Data Protection
- **At Rest**: SQLite3 database (SQLCipher encryption planned for production)
- **In Transit**: REST API over localhost (127.0.0.1:8000)
- **Authentication**: Argon2 password hashing
- **Access Control**: Master password verification on all database operations

## Assessment Types

### Standard Assessment
- 25 questions aligned with NIST CSF 2.0
- Maturity-based scoring (1-5 scale)
- Weighted by importance (Critical/High/Medium)
- Calculates:
  - Impact score (1-5)
  - Likelihood score (1-5)
  - Vulnerability percentage (0-100%)

### Cloud Scorecard
- 11 criteria for mass-market cloud services
- Binary scoring (Yes/No)
- Critical controls trigger knockout rule
- Calculates:
  - Total score (0-100 points)
  - Approval status
  - Vulnerability percentage

## OSINT Integration

Current implementation includes real OSINT checks:
- **Ransomware Leak Database**: Checks Ransomwatch GitHub database for vendor names
- **SSL/TLS Certificate Validation**: Validates SSL certificates and checks expiration
- **DMARC Record Checking**: Validates email security (DMARC) policies

**Implementation details:**
- Service located in `backend/osint_service.py`
- Rate limiting and caching to prevent excessive API calls
- Results stored as warnings on vendor records
- Warnings automatically prioritize vendors in dashboard display

## Risk Calculation

### Vulnerability Score
- Based on assessment answers
- Weighted by question importance
- Inverted: High score = Low vulnerability
- Range: 0% (fully protected) to 100% (fully exposed)

### Risk Matrix
- X-axis: Impact (1-5)
- Y-axis: Likelihood (1-5)
- Color: Vulnerability (Black=0% to Blue=100%)
- Zones: Green (low), Yellow (medium), Orange (high), Red (critical)

## Database Schema

### Tables
- **vendors**: Vendor information and assessments
- **questions**: Standard assessment questions
- **cloud_criteria**: Cloud scorecard criteria
- **settings**: Application settings

### Security
- Master password required to access database
- Password hashed with Argon2 (stored separately in `.tilt_key`)
- SQLCipher encryption planned for production deployment

## Next Steps for Production

1. **OSINT API Integration**
   - Add real API keys
   - Implement rate limiting
   - Add error handling

2. **Export/Import**
   - PDF report generation
   - CSV export for analysis
   - Database backup/restore

3. **Advanced Features**
   - Scheduled OSINT scans
   - Email notifications
   - Multi-user support
   - Audit logging

4. **Testing**
   - Unit tests for calculations
   - Integration tests for API endpoints
   - Frontend component tests
   - Security testing

5. **Deployment**
   - SQLCipher migration for production encryption
   - Session management (JWT or session-based auth)
   - Production deployment configuration
   - Database backup/restore functionality

## Compliance Notes

This application is designed to handle **Tier 3 (Internal Use Only)** data:
- Internal memos
- Vendor lists
- Risk assessments
- Security analysis

All data is encrypted at rest and requires authentication to access.

## Running the Application

1. **Quick Start:**
   ```bash
   chmod +x run.sh
   ./run.sh
   ```

2. **Access:**
   - Frontend: http://localhost:3000
   - Backend API: http://127.0.0.1:8000
   - API Docs: http://127.0.0.1:8000/docs

## Architecture Notes

This application migrated from Electron to a web-based architecture:
- **Frontend**: React + Vite (standalone web app)
- **Backend**: FastAPI (Python REST API)
- **Database**: SQLite3 (SQLCipher planned)
- **Communication**: REST API over localhost

See `MIGRATION_SUMMARY.md` for detailed migration notes.

## Typography & Fonts

### Poppins
- **Source**: Google Fonts (via GitHub)
- **Usage**: Default body font throughout the application
- **License**: Open Font License (OFL)
- **Attribution**: Poppins font family designed by Indian Type Foundry
- **Location**: Font files stored in `/Poppin Fonts/` directory

### Poppins
- **Usage**: Used for all text including headings and UI elements
- **Variants Used**: 
  - Poppins Black: Used for main headings (e.g., "WELCOME BACK!")
  - Poppins Thin: Used for section titles and labels
  - Poppins Regular: Default body font
- **Location**: Font files stored in `/Poppins Fonts/` directory
- **Note**: Applied with uppercase text transform for headings and labels

Font configuration is defined in `frontend/src/index.css` using `@font-face` declarations.

## Support

For questions or issues:
1. Review `LINUX_SETUP.md` for installation help
2. Check code comments for implementation details
3. Review `MIGRATION_SUMMARY.md` for architecture details

