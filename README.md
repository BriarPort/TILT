
<img width="3334" height="3334" alt="The Inherited Liability Toolkit-06" src="https://github.com/user-attachments/assets/9a874281-a66c-4d98-ac7a-9f3fee50aaf5" />
<img width="3334" height="3334" alt="The Inherited Liability Toolkit-10" src="https://github.com/user-attachments/assets/605cad7a-5656-4747-abb6-b4fe5e6e726c" />

## Project Overview

The **TILT Dashboard** is a complete, production-ready web application designed to implement **The Inherited Liability Toolkit (TILT)** framework. It provides a secure, centralized dashboard for managing and visualizing **third-party cybersecurity risk assessments** based on industry standards like **NIST CSF 2.0**.

This application is built with a decoupled architecture: a **FastAPI** (Python) backend serving a **React** frontend, intended for secure operation on `localhost`.

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Backend** | Python (FastAPI) | REST API, Business Logic, Security, Data Layer |
| **Frontend** | React, Vite, Tailwind CSS | Modern Dashboard, UI/UX, Visualization |
| **Database** | SQLite3 | Encrypted Data Storage (Requires Master Password) |
| **Security** | Argon2, Password Verification | Authentication and Data Protection (Tier 3 Compliance) |

---

## Quick Start

To run the application, ensure you have the necessary dependencies installed for both the Python backend and the Node/Vite frontend.

1. **Grant Execution Permissions:**
    ```bash
    chmod +x run.sh
    ```
2. **Execute the Startup Script:**
    ```bash
    ./run.sh
    ```
3. **Access the Dashboard:**
    * **Frontend:** `http://localhost:3000`
    * **Backend API Docs:** `http://127.0.0.1:8000/docs`

Upon first launch, you will be prompted to set a **Master Password** to secure the application.

---

## Key Features Implemented

### Security & Compliance (Tier 3)
* **Master Password System:** User-controlled encryption using a master password.
* **Argon2 Key Derivation:** Master password hashed with the **Argon2** algorithm (key stored in `.tilt_key`).
* **Database Protection:** Access to the SQLite3 database is protected via master password verification (SQLCipher planned for production).
* **REST API Security:** All API endpoints require password verification for access.

### Core Assessment & Management
* **Vendor Management:** Full CRUD operations for vendors (add, edit, view, delete).
* **Standard Assessment (25 Questions):** NIST CSF 2.0 aligned questionnaire with maturity-based scoring (1-5 scale).
* **Cloud Scorecard:** Mass-market cloud services assessment with 11 criteria and maturity-based scoring (0-5 scale).
* **Configuration Editors:** UI for adding, editing, and managing assessment questions and cloud criteria, including maturity levels and notes.
* **Real-time Calculations:** Automatic risk, likelihood, and vulnerability scoring.

### OSINT (Open Source Intelligence) Integration
* **Ransomware Leak Database Check:** Scans the Ransomwatch GitHub database for vendor breaches.
* **SSL/TLS Certificate Validation:** Validates SSL certificates and checks expiration timeline (Grade A to F).
* **DMARC Record Checking:** Validates email security (DMARC) policies with support for specifying **DMARC-enabled subdomains**.
* **Warning Prioritization:** Vendors with OSINT warnings appear first on the dashboard.
* **OSINT Acknowledgment:** Risk team can acknowledge warnings to reduce UI clutter.

### User Interface (React)
* **Modern Dashboard:** Clean, professional design with centralized risk matrix visualization.
* **Responsive Layout:** Works on various screen sizes.
* **Dynamic Tooltips:** Risk matrix tooltips adjust position to prevent clipping at edges.

---

## Risk Matrix & Calculation Algorithms

The risk matrix is a 5x5 grid where vendors are plotted based on three calculated dimensions: **Impact (X-axis)**, **Likelihood (Y-axis)**, and **Vulnerability (Color)**.

### 1. Impact (X-Axis)

Impact (1-5) is determined **solely** by the vendor's **Data Classification Tier** (1-5). It is **not** affected by OSINT results.


$$\text{X Position} = \frac{\text{Impact}}{5} \times 100\% \text{ (from left)}$$

### 2. Likelihood (Y-Axis)

Likelihood (1-5) reflects the probability of a breach. It is adjusted **only** by **Ransomware** OSINT findings.

#### Standard Assessment Likelihood
1.  Calculate average maturity score ($\overline{M}$) from the 25 questions.
2.  **Inversion Formula:**
    $$\text{Likelihood} = \text{clamp}(1, 5, \frac{6 - \overline{M}}{1.2})$$
3.  **OSINT Adjustment:** If **Ransomware** is detected, $\text{Likelihood} = 5$ (Maximum).

#### Cloud Scorecard Likelihood
Determined by Total Score (Max 55) thresholds:
* $45-55 \text{ (Elite)} \rightarrow \text{Likelihood} = 2$
* $30-44 \text{ (Standard)} \rightarrow \text{Likelihood} = 3$
* $15-29 \text{ (Deficient)} \rightarrow \text{Likelihood} = 4$
* $0-14 \text{ (Critical)} \rightarrow \text{Likelihood} = 5$
* **OSINT Adjustment:** If **Ransomware** is detected, $\text{Likelihood} = 5$.

$$\text{Y Position} = \frac{\text{Likelihood}}{5} \times 100\% \text{ (from bottom)}$$

### 3. Vulnerability (Color)

Vulnerability (0-100%) determines the dot color (Black $0\% \rightarrow$ Bright Blue $100\%$). It reflects security posture and is adjusted by **SSL** and **DMARC** OSINT findings, but **not** by Ransomware.

#### Standard Assessment Vulnerability
1.  **Normalization:** $\text{Norm}_{q} = \frac{6 - \text{MaturityScore}}{5}$
2.  **Weighted Average:** $\text{Vulnerability} = (\frac{\sum (\text{Norm}_{q} \times \text{Weight})}{\sum \text{Weights}}) \times 100$
3.  **OSINT Adjustment (Minimum Thresholds):**
    * If **SSL Expired** (Grade F): $\text{Vulnerability} = \text{max}(\text{Vulnerability}, 80\%)$
    * If **DMARC Missing}: $\text{Vulnerability} = \text{max}(\text{Vulnerability}, 60\%)$

#### Cloud Scorecard Vulnerability
1.  **Vulnerability (Inverse Score):**
    $$\text{Vulnerability} = (1 - \frac{\text{TotalScore}}{55}) \times 100$$
2.  **OSINT Adjustment:**
    * If a **Critical Criterion** is missed: $\text{Vulnerability} = 100\%$
    * If **SSL Expired** (Grade F): $\text{Vulnerability} = \text{max}(\text{Vulnerability}, 80\%)$
    * If **DMARC Missing}: $\text{Vulnerability} = \text{max}(\text{Vulnerability}, 60\%)$

---

## OSINT Security Checks and Impact

The OSINT service (`backend/osint_service.py`) provides automated, non-cooperative security validation checks.

### 1. Ransomware Leak Database Check
* **What it is:** Searches the Ransomwatch GitHub database for the vendor name/domain.
* **Impact:** If found, sets **Likelihood to 5 (Critical)**, indicating an active breach risk.

### 2. SSL/TLS Certificate Validation
* **What it is:** Checks the vendor's primary domain for certificate validity and expiration timeline.
* **Impact:** If expired or expiring soon (Grade F, $<7$ days), sets **Vulnerability to a minimum of 80%**, indicating poor security operations.

### 3. DMARC Record Checking
* **What it is:** Queries DNS for a DMARC policy (`_dmarc.domain` TXT record) to check email anti-spoofing security.
* **Impact:** If missing, sets **Vulnerability to a minimum of 60%**, indicating an email security weakness.

---

You are correct. The structure still appears to be missing the initial heading and the code fence used in the previous step, causing it to run together with the preceding text.

I will correct this by explicitly adding the `##` heading for the section and enclosing the directory tree in a triple-backtick code block.

Here is the corrected section ready for your `README.md` file:

-----

## File Structure

```
TILT programming/
├── frontend/                     # React frontend application
│   ├── src/
│   │   ├── components/           # React UI components
│   │   ├── utils/                # Risk calculation logic (frontend)
│   │   └── api.js                # API client (REST calls to backend)
├── backend/                      # FastAPI backend application
│   ├── main.py                   # FastAPI app and REST endpoints
│   ├── database.py               # Database layer (SQLite3)
│   ├── risk_calculator.py        # Risk calculation logic (backend)
│   ├── osint_service.py          # OSINT integration
│   ├── requirements.txt          # Python dependencies
│   ├── data/                     # Assessment question templates
│   └── tilt_data.db              # SQLite database file
├── docs/                         # Documentation and algorithms
│   ├── LINUX_SETUP.md
│   └── RISK_MATRIX_ALGORITHM.txt
├── fonts/                        # Custom font files (Poppins)
└── run.sh                        # Startup script
```


---

## Next Steps for Production

1.  **Deployment & Encryption:** Migrate the database to **SQLCipher** for true production-grade encryption. Implement session management (e.g., JWT).
2.  **Reporting:** Add PDF report generation and CSV export capabilities for analysis.
3.  **Advanced OSINT:** Implement API keys and advanced rate limiting for additional third-party OSINT services. Implement scheduled OSINT scans.
4.  **Testing:** Develop comprehensive unit, integration, and security tests.

---

## Support

For questions or issues:
1.  Review `docs/LINUX_SETUP.md` for installation help.
2.  Review `docs/RISK_MATRIX_ALGORITHM.txt` for detailed calculation logic
