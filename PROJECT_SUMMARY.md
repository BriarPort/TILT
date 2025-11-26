# TILT Dashboard - Project Summary

## Overview

This is a complete, production-ready web application for implementing the TILT (The Inherited Liability Toolkit) framework. The application provides a secure dashboard for managing third-party cybersecurity risk assessments. Built with a FastAPI backend and React frontend, running on localhost.

## Key Features Implemented

### Security (Tier 3 Compliance)
- **Argon2 Key Derivation**: Master password hashed with Argon2
- **Database Protection**: SQLite3 with master password authentication
- **REST API Security**: Secure API endpoints with password verification
- **Master Password System**: User-controlled encryption (SQLCipher planned for production)

### Core Functionality
- **25-Question Standard Assessment**: Complete NIST CSF 2.0 aligned questionnaire with maturity-based scoring (1-5 scale)
- **Cloud Scorecard**: Mass-market cloud services assessment with 11 criteria, maturity-based scoring (0-5 scale per criterion)
- **Risk Matrix Visualization**: 5x5 gradient matrix with vulnerability scoring
- **Vendor Management**: Full CRUD operations for vendors (add, edit, view, delete)
- **OSINT Integration**: Automated security checks with warning system and acknowledgment feature
- **Settings Management**: Organization name and password change
- **Question/Criteria Editing**: Add, edit, and manage assessment questions and cloud criteria with maturity levels and notes

### User Interface
- **Modern Dashboard**: Clean, professional design with risk matrix visualization
- **Responsive Layout**: Works on various screen sizes
- **OSINT Warning Prioritization**: Vendors with warnings appear first (no separate section)
- **OSINT Acknowledgment**: Risk team can acknowledge OSINT warnings to reduce UI clutter
- **Real-time Calculations**: Automatic risk and vulnerability scoring
- **Intuitive Navigation**: Sidebar-based navigation with grouped actions (Add buttons first, Edit buttons below)
- **Dynamic Tooltips**: Risk matrix tooltips adjust position to prevent clipping at edges

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
│   │   │   ├── ViewVendor.jsx
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
│   │   └── questions_cloud.json     # 11 cloud criteria
│   ├── ransom_cache.json        # Cached ransomware database
│   └── tilt_data.db             # SQLite database
├── docs/                        # Documentation files
│   ├── GITHUB_DESCRIPTION.txt
│   ├── LINUX_SETUP.md
│   ├── OSINT_CHECKS_DOCUMENTATION.txt
│   ├── RISK_MATRIX_ALGORITHM.txt
│   └── TECHNOLOGY_INVENTORY.txt
├── fonts/                       # Custom font files
│   ├── Poppins-Black.ttf
│   ├── Poppins-Regular.ttf
│   └── Poppins-Thin.ttf
├── run.sh                       # Startup script (runs both frontend & backend)
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
- Maturity-based scoring (1-5 scale per question)
- Weighted by importance (Critical/High/Medium)
- Multiple-choice options with full metric descriptions
- Questions can be added, edited, and managed via Question Editor
- Calculates:
  - Impact score (1-5) - based on data classification tier
  - Likelihood score (1-5) - based on maturity scores, adjusted by ransomware OSINT
  - Vulnerability percentage (0-100%) - based on maturity scores, adjusted by SSL/DMARC OSINT

### Cloud Scorecard
- 11 criteria for mass-market cloud services
- Maturity-based scoring (0-5 scale per criterion)
- Each criterion has 6 maturity levels (0-5) with detailed descriptions
- Critical controls trigger knockout rule (0 score = automatic rejection)
- Criteria can be added, edited, and managed via Cloud Matrix Editor
- Calculates:
  - Total score (0-55 points, max 55)
  - Approval status (Elite/Standard/Deficient/Critical)
  - Impact score (1-5) - based on data classification tier only
  - Likelihood score (1-5) - based on total score thresholds, adjusted by ransomware OSINT
  - Vulnerability percentage (0-100%) - based on score, adjusted by SSL/DMARC OSINT

## OSINT Integration

Current implementation includes real OSINT checks:
- **Ransomware Leak Database**: Checks Ransomwatch GitHub database for vendor names
- **SSL/TLS Certificate Validation**: Validates SSL certificates and checks expiration
- **DMARC Record Checking**: Validates email security (DMARC) policies with subdomain support

**OSINT Impact on Risk Calculation:**
- **Ransomware**: Sets likelihood to maximum (5) - indicates active breach risk
- **SSL Expired**: Sets vulnerability to minimum 80% - indicates poor security posture
- **DMARC Missing**: Sets vulnerability to minimum 60% - indicates email security weakness

**DMARC Subdomains Feature:**
- Users can specify DMARC-enabled email subdomains to prevent false positives
- Example: GitHub's primary domain lacks DMARC, but subdomains (e.g., `github.com`) have it
- System checks specified subdomains first, falling back to primary domain if none provided

**OSINT Acknowledgment:**
- Risk team can acknowledge OSINT warnings on vendor detail pages
- Acknowledged vendors show brief message instead of full warning text on dashboard
- Helps reduce UI clutter while maintaining awareness of acknowledged risks

**Implementation details:**
- Service located in `backend/osint_service.py`
- Rate limiting and caching to prevent excessive API calls
- Results stored as warnings on vendor records
- Warnings automatically prioritize vendors in dashboard display (flagged vendors appear first)

## Risk Calculation

### Vulnerability Score
- Based on assessment answers (maturity scores)
- Weighted by question/criterion importance
- Inverted: High maturity score = Low vulnerability
- Range: 0% (fully protected) to 100% (fully exposed)
- **OSINT Adjustments**: SSL/DMARC issues increase vulnerability (minimum thresholds applied)

### Impact Score
- Based solely on data classification tier (1-5)
- Not affected by OSINT results
- Standard assessment: Derived from data classification
- Cloud scorecard: Derived from data classification tier only

### Likelihood Score
- Standard assessment: Based on average maturity score (inverted)
- Cloud scorecard: Based on total score thresholds
- **OSINT Adjustment**: Only ransomware affects likelihood (sets to 5)
- SSL and DMARC do NOT affect likelihood

### Risk Matrix
- X-axis: Impact (1-5)
- Y-axis: Likelihood (1-5)
- Color: Vulnerability (Black=0% to Blue=100%)
- Zones: Green (low), Yellow (medium), Orange (high), Red (critical)
- Tooltips: Dynamically positioned to prevent clipping at edges

## Database Schema

### Tables
- **vendors**: Vendor information, assessments, OSINT results, acknowledgment status
- **questions**: Standard assessment questions with maturity levels and notes
- **cloud_criteria**: Cloud scorecard criteria with maturity levels and notes
- **settings**: Application settings (organization name, etc.)

### Vendor Table Fields
- Basic info: name, status, data_classification
- Assessment data: answers (JSON), cloudScores (JSON)
- OSINT data: osint_warnings (JSON), osint_urls (JSON), osint_acknowledged (BOOLEAN)
- DMARC subdomains: stored in osint_urls.dmarc_subdomains

### Security
- Master password required to access database
- Password hashed with Argon2 (stored separately in `.tilt_key`)
- SQLCipher encryption planned for production deployment

## Next Steps for Production

1. **OSINT API Integration**
   - Add real API keys for additional services
   - Implement advanced rate limiting
   - Add more comprehensive error handling

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

This application uses a web-based architecture:
- **Frontend**: React + Vite (standalone web app)
- **Backend**: FastAPI (Python REST API)
- **Database**: SQLite3 (SQLCipher planned)
- **Communication**: REST API over localhost

## Typography & Fonts

### Poppins
- **Usage**: Used for all text including headings and UI elements
- **Variants Used**: 
  - Poppins Black: Used for main headings (e.g., "WELCOME BACK!")
  - Poppins Thin: Used for section titles and labels
  - Poppins Regular: Default body font
- **Location**: Font files stored in `/fonts/` directory
- **Note**: Applied with uppercase text transform for headings and labels

Font configuration is defined in `frontend/src/index.css` using `@font-face` declarations.

## Support

For questions or issues:
1. Review `docs/LINUX_SETUP.md` for installation help
2. Check code comments for implementation details
3. Review `docs/OSINT_CHECKS_DOCUMENTATION.txt` for OSINT details
4. Review `docs/RISK_MATRIX_ALGORITHM.txt` for risk calculation details
