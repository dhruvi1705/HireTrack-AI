# HireTrack AI

> Full-stack career intelligence and job application tracking platform with deterministic AI-powered insights.

HireTrack AI is a full-stack career management platform designed to help job seekers organize their pipeline, track interview schedules, manage proactive outreach reminders, and leverage targeted AI tools for resume auditing, job matching, interview preparation, and cover letter generation. Built with a high-contrast Neo-Brutalist design system, the application enforces strict per-user data isolation across every query and mutation.

---

## Key Features

- **Multi-User Authentication & Data Isolation:** Secure JWT authentication with bcrypt password hashing. All companies, jobs, applications, interviews, follow-ups, and analytics are strictly isolated to the authenticated user.
- **Visual Application Pipeline:** Interactive Kanban-style tracker and list views spanning key application stages: *Not Started (Saved)*, *Applied*, *Screening*, *Interview*, *Offered*, *Rejected*, and *Withdrawn*.
- **Executive Dashboard:** Live metrics displaying total applications, scheduled interviews, active offers, pending follow-ups, an application pipeline funnel, recent submissions, upcoming interviews, and nearest pending reminders.
- **Follow-ups & Reminders:** Schedule outreach deadlines, recruiter check-ins, and post-interview thank-you notes. Filter by *Pending*, *Completed*, or derived *Overdue* status with one-click completion toggles and application deep-linking.
- **Interview Tracking & Scheduling:** Log technical, behavioral, HR, screening, and final rounds with dates, times, meeting links, and preparation notes.
- **Resume Analyzer with PDF Parsing:** Extract text directly from uploaded PDF resumes or pasted text. Detects standard sections, identifies technical competencies, scores overall resume strength, and provides concrete improvement recommendations.
- **Resume-to-Job Match Scoring:** Compares applicant skill sets against job descriptions to calculate alignment percentages, identify matching competencies, and pinpoint missing keywords.
- **Interview Question Generator:** Produces structured interview questions categorized into Technical, Role-Specific, Behavioral, and HR domains tailored to specific job opportunities or scheduled interviews.
- **Cover Letter Generator:** Synthesizes candidate experience with target company and role requirements to produce tailored cover letters.
- **Job Search Analytics:** Visual funnel and conversion metrics (application-to-interview rates, interview-to-offer rates, rejection rates, and stage breakdowns).
- **Graceful AI Fallback:** When Gemini API keys are absent or rate-limited, the backend automatically falls back to deterministic heuristic analyzers—guaranteeing zero application downtime.

---

## Application Screenshots

> *Screenshots can be stored in `docs/screenshots/` and referenced below. Replace placeholders with genuine screen captures of the running application.*

| Dashboard & Metrics | Application Pipeline |
| :---: | :---: |
| ![Dashboard Placeholder](https://via.placeholder.com/600x340/fcfbf7/111111?text=Dashboard+%26+Pipeline+Summary) | ![Pipeline Placeholder](https://via.placeholder.com/600x340/fcfbf7/111111?text=Application+Tracker+%26+Kanban) |

| Follow-ups & Reminders | AI Career Tools |
| :---: | :---: |
| ![Follow-ups Placeholder](https://via.placeholder.com/600x340/fcfbf7/111111?text=Follow-ups+%26+Reminders) | ![AI Tools Placeholder](https://via.placeholder.com/600x340/fcfbf7/111111?text=Resume+Analyzer+%26+Job+Match) |

*To add screenshots:*
1. Capture PNG screenshots of each page at `1440x900` resolution.
2. Save them to `docs/screenshots/dashboard.png`, `docs/screenshots/applications.png`, `docs/screenshots/follow_ups.png`, and `docs/screenshots/ai_tools.png`.
3. Update the markdown image links above.

---

## Technology Stack

### Frontend
- **Framework:** React 19 with Vite 8
- **Routing:** React Router v7
- **HTTP Client:** Axios
- **Iconography:** Lucide React
- **Design System:** Neo-Brutalism using Vanilla CSS
  - Surface: `#ffffff`
  - Background: `#fcfbf7` / `#f7f3ee`
  - Accent: `#f5c518` / `#f7cf55`
  - Typography & Borders: `#111111` / `#29231f`
  - Shadows: `3px 3px 0 #111` hard-edged offset, zero border radius
  - Typography: Google Fonts (*DM Sans* & *DM Mono*)
- **Code Quality:** ESLint 10

### Backend
- **Framework:** Python 3.10+ with FastAPI
- **ASGI Server:** Uvicorn
- **ORM & Database Toolkit:** SQLAlchemy 2.0
- **Database Migrations:** Alembic
- **Validation & Schemas:** Pydantic v2 & Pydantic-Settings
- **Authentication & Security:** Python-Jose (JWT), Passlib with bcrypt
- **PDF Extraction:** PyPDF 5.x
- **Testing:** Pytest with HTTPX / Starlette TestClient

### Database
- **Engine:** PostgreSQL 14+
- **Driver:** Psycopg2-binary

### AI Integration
- **SDK:** Google GenAI SDK (`google-genai`)
- **Models Supported:** `gemini-3.5-flash`, `gemini-flash-latest`
- **Fallback Architecture:** Local keyword dictionary and heuristic analyzers (no external API calls required in standard mode)

---

## Architecture

HireTrack AI uses a decoupled client-server architecture. The React frontend interacts with the FastAPI backend over RESTful JSON endpoints. Every protected request includes a Bearer JWT in the `Authorization` header, validated by FastAPI dependency injection.

```mermaid
flowchart TB
    subgraph Client["Frontend (React 19 + Vite)"]
        UI["Neo-Brutalist UI Pages"]
        AuthSvc["Auth Service (JWT Storage)"]
        ApiClients["Axios Service Layer"]
        UI --> ApiClients
        AuthSvc -.->|"Bearer Token"| ApiClients
    end

    subgraph API["Backend (FastAPI)"]
        Deps["Auth Dependency (get_current_user)"]
        Routers["Routers: Auth | Applications | Jobs | Companies | Interviews | Follow-ups | Analytics | AI | Dashboard"]
        GeminiSvc["Gemini Service (Enhanced Mode)"]
        FallbackSvc["Heuristic Analyzer (Standard Mode)"]
        
        ApiClients -->|"HTTP Requests"| Routers
        Routers --> Deps
        Routers --> GeminiSvc
        GeminiSvc -->|"On Quota / Offline"| FallbackSvc
    end

    subgraph DataStore["Data Layer"]
        Models["SQLAlchemy ORM Models"]
        DB[("PostgreSQL Database")]
        
        Routers --> Models
        Models --> DB
    end
```

### Data Isolation Model
Each table (`companies`, `jobs`, `applications`, `interviews`, `follow_ups`) is linked via foreign keys directly or indirectly to `users.id`. All database queries filter explicitly by `user_id == current_user.id`. Cascading deletions ensure that deleting a company or application safely cleans up related child records.

---

## Project Structure

```
HireTrack-AI/
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   │   ├── 6cddd2512e9b_create_core_hiretrack_tables.py
│   │   │   ├── 7cbd33e3b3a1_add_interviews_table.py
│   │   │   ├── 239aa43b06e5_add_user_id_to_companies.py
│   │   │   └── 7ab07b11c012_create_follow_ups_table.py
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── app/
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── application.py
│   │   │   ├── company.py
│   │   │   ├── follow_up.py
│   │   │   ├── interview.py
│   │   │   ├── job.py
│   │   │   └── user.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── ai.py
│   │   │   ├── analytics.py
│   │   │   ├── applications.py
│   │   │   ├── auth.py
│   │   │   ├── companies.py
│   │   │   ├── dashboard.py
│   │   │   ├── follow_ups.py
│   │   │   ├── interviews.py
│   │   │   └── jobs.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── ai.py
│   │   │   ├── analytics.py
│   │   │   ├── application.py
│   │   │   ├── auth.py
│   │   │   ├── company.py
│   │   │   ├── follow_up.py
│   │   │   ├── interview.py
│   │   │   └── job.py
│   │   ├── services/
│   │   │   ├── gemini_service.py
│   │   │   └── security.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   └── main.py
│   ├── tests/
│   │   ├── test_data_isolation.py
│   │   ├── test_follow_ups.py
│   │   ├── test_gemini_integration.py
│   │   └── test_resume_pdf.py
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env.example
├── docs/
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/
│   │   │   └── hero.png
│   │   ├── components/
│   │   │   ├── AddApplication.jsx / .css
│   │   │   ├── InterviewPreparationModal.jsx / .css
│   │   │   ├── Sidebar.jsx / .css
│   │   │   └── ...
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx
│   │   ├── pages/
│   │   │   ├── AiTools.jsx / .css
│   │   │   ├── Analytics.jsx / .css
│   │   │   ├── Applications.jsx / .css
│   │   │   ├── Companies.jsx / .css
│   │   │   ├── Dashboard.jsx / .css
│   │   │   ├── FollowUps.jsx / .css
│   │   │   ├── Interviews.jsx / .css
│   │   │   ├── Jobs.jsx / .css
│   │   │   ├── LaunchPage.jsx / .css
│   │   │   └── Login.jsx / .css
│   │   ├── services/
│   │   │   ├── aiService.js
│   │   │   ├── analyticsService.js
│   │   │   ├── api.js
│   │   │   ├── applicationService.js
│   │   │   ├── authService.js
│   │   │   ├── companyService.js
│   │   │   ├── dashboardService.js
│   │   │   ├── followUpService.js
│   │   │   ├── interviewService.js
│   │   │   └── jobService.js
│   │   ├── styles/
│   │   │   ├── common.css
│   │   │   └── variables.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── eslint.config.js
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
└── README.md
```

---

## Prerequisites

- **Python:** 3.10 to 3.14
- **Node.js:** 18.x or 20+ (tested on Node v24)
- **PostgreSQL:** 14 or higher
- **Package Managers:** `pip` (Python) and `npm` (Node.js)

---

## Installation and Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/dhruvi1705/HireTrack-AI.git
cd HireTrack-AI
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Database and Environment
1. Create a PostgreSQL database (e.g., named `hiretrack_db`):
   ```sql
   CREATE DATABASE hiretrack_db;
   ```
2. Copy the example environment file and update with your credentials:
   ```bash
   cp .env.example .env
   ```
3. Run Alembic migrations to apply all database tables:
   ```bash
   alembic upgrade head
   ```

### 4. Start the Backend API
```bash
uvicorn app.main:app --reload --port 8000
```
The FastAPI server will start at `http://localhost:8000`. Swagger documentation is available at `http://localhost:8000/docs`.

### 5. Frontend Setup
Open a new terminal window:
```bash
cd frontend

# Install Node dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start Vite dev server
npm run dev
```
The frontend application will be running at `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory based on `.env.example`:

| Variable | Description | Required | Example |
| :--- | :--- | :---: | :--- |
| `DATABASE_URL` | PostgreSQL SQLAlchemy connection URL | **Yes** | `postgresql+psycopg2://postgres:password@localhost:5432/hiretrack_db` |
| `JWT_SECRET_KEY` | Secret key used for signing HS256 tokens | **Yes** | `your-secure-random-secret-key-32-chars-min` |
| `JWT_ALGORITHM` | Algorithm for JWT encoding | No | `HS256` (default) |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Expiration time for access tokens | No | `60` (default) |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | No | `http://localhost:5173,http://127.0.0.1:5173` (default) |
| `GEMINI_API_KEY` | Google Gemini API key for enhanced AI features | Optional | `your_gemini_api_key` |
| `GEMINI_MODEL` | Gemini model name | Optional | `gemini-3.5-flash` (default) |

> *Note: If `GEMINI_API_KEY` is not provided, all AI tools automatically function in Standard Mode using deterministic local analyzers.*

### Frontend (`frontend/.env`)
Create a `.env` file in the `frontend/` directory based on `.env.example`:

| Variable | Description | Required | Example |
| :--- | :--- | :---: | :--- |
| `VITE_API_BASE_URL` | Base URL of the FastAPI backend | Optional | `http://localhost:8000` (default) |

---

## API Overview

When the backend is running, complete interactive OpenAPI documentation is accessible at `http://localhost:8000/docs`.

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT access token |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |

### Companies (`/api/companies`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/companies/` | List all companies for authenticated user |
| `POST` | `/api/companies/` | Create a company |
| `GET` | `/api/companies/{id}` | Get company by ID |
| `PUT` | `/api/companies/{id}` | Update company details |
| `DELETE` | `/api/companies/{id}` | Delete company (cascades linked records) |

### Jobs (`/api/jobs`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/jobs/` | List all jobs for authenticated user |
| `POST` | `/api/jobs/` | Create a job under a company |
| `GET` | `/api/jobs/{id}` | Get job details |
| `PUT` | `/api/jobs/{id}` | Update job title, description, or compensation |
| `DELETE` | `/api/jobs/{id}` | Delete job |

### Applications (`/api/applications`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/applications/` | List all tracked job applications |
| `POST` | `/api/applications/` | Submit new application entry |
| `GET` | `/api/applications/{id}` | Retrieve application details |
| `PUT` | `/api/applications/{id}` | Update stage, notes, or applied date |
| `DELETE` | `/api/applications/{id}` | Delete application (cascades interviews & follow-ups) |

### Interviews (`/api/interviews`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/interviews/` | List scheduled & completed interviews |
| `POST` | `/api/interviews/` | Schedule interview round for an application |
| `GET` | `/api/interviews/{id}` | Retrieve interview details |
| `PUT` | `/api/interviews/{id}` | Update interview timing, status, notes, or meeting link |
| `DELETE` | `/api/interviews/{id}` | Delete interview |

### Follow-ups & Reminders (`/api/follow-ups`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/follow-ups/?status={pending\|completed\|overdue\|all}` | Filtered follow-up list with dynamic overdue calculation |
| `POST` | `/api/follow-ups/` | Create follow-up reminder for an application |
| `GET` | `/api/follow-ups/{id}` | Retrieve follow-up details |
| `PUT` | `/api/follow-ups/{id}` | Update follow-up status, due date, title, or description |
| `DELETE` | `/api/follow-ups/{id}` | Delete follow-up |

### Dashboard & Analytics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | Aggregated dashboard stats, pipeline, upcoming interviews, and nearest pending reminders |
| `GET` | `/api/analytics/summary` | Funnel conversion metrics, stage counts, and response rates |

### AI Career Tools (`/api/ai`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/ai/status` | Current AI provider status (Enhanced vs Standard Mode) |
| `POST` | `/api/ai/resume-analyzer` | Parse PDF or text resume; score and evaluate sections |
| `POST` | `/api/ai/job-match` | Compare resume skills against job requirements |
| `POST` | `/api/ai/interview-questions` | Generate interview preparation questions by category |
| `POST` | `/api/ai/cover-letter` | Generate tailored cover letter |

---

## AI Functionality & Deterministic Fallback

HireTrack AI integrates with the official Google GenAI SDK (`google-genai`) while ensuring deterministic reliability through local fallback heuristics:

1. **Resume Analyzer:** Accepts uploaded PDF files (via `pypdf`) or pasted text. Detects standard sections (*Summary*, *Experience*, *Education*, *Skills*, *Projects*, *Certifications*), extracts technical skills against a built-in industry keyword dictionary, generates an objective strength score (15–98), and flags concrete areas for improvement.
2. **Job Match Score:** Analyzes skill overlaps and omissions between candidate resumes and job descriptions to output a percentage score, matching keywords, and missing qualifications.
3. **Interview Preparation Workflow:** Accessible directly from any scheduled interview. Tailors technical, role-specific, behavioral, and HR questions based on the exact job requirements.
4. **Cover Letter Generator:** Constructs professional, personalized cover letters highlighting role alignment and applicant competencies.

### Fallback Architecture
- **Gemini Enhanced Mode:** Activates when `GEMINI_API_KEY` is provided, querying models such as `gemini-3.5-flash` or `gemini-flash-latest` with structured JSON schemas.
- **Standard Analysis Mode:** If the API key is not configured, quota is exhausted, or the network is unavailable, the backend automatically transitions to deterministic algorithmic generators.
- **No Autonomous Agent:** HireTrack AI operates strictly as request-response generative utilities; it does not deploy autonomous background agents, web scrapers, or uncontrolled background tasks.

---

## Database and Migrations

HireTrack AI uses Alembic for declarative, version-controlled PostgreSQL schema migrations.

### Migration History
1. `6cddd2512e9b` — Initial schema (`users`, `companies`, `jobs`, `applications`)
2. `7cbd33e3b3a1` — Added `interviews` table with foreign key cascade
3. `239aa43b06e5` — Added `user_id` foreign key constraint to `companies`
4. `7ab07b11c012` — Added `follow_ups` table with check constraints and index optimizations

### Migration Commands
```bash
cd backend

# View current migration state
alembic current

# Verify schema synchronization (checks for unmigrated drift)
alembic check

# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

> *Caution: Never drop or recreate tables directly in production; always use Alembic migrations to preserve relational integrity.*

---

## Testing and Quality Verification

The project includes an end-to-end regression test suite covering authentication, multi-user data isolation, cascading deletions, PDF parsing, follow-up operations, overdue calculations, and AI fallback behavior.

### Run Backend Tests
```bash
cd backend
pytest tests/ -v
```
**Verified Results:** **39 passed**, 0 failures across:
- `test_auth_rate_limit.py` (5 tests)
- `test_data_isolation.py` (7 tests)
- `test_follow_ups.py` (7 tests)
- `test_gemini_integration.py` (13 tests)
- `test_resume_pdf.py` (7 tests)

### Run Frontend Linting
```bash
cd frontend
npm run lint
```
**Verified Results:** **0 errors, 0 warnings** (ESLint 10 with React 19 rules).

### Run Frontend Production Build
```bash
cd frontend
npm run build
```
**Verified Results:** Built production bundle cleanly via Vite in **< 1 second**.

### Check Database Schema Sync
```bash
cd backend
alembic check
```
**Verified Results:** `No new upgrade operations detected.` (Zero schema drift).

---

## Security and Privacy

- **Per-User Isolation:** Every read, creation, update, and deletion is checked against `current_user.id`. Cross-user data snooping or ID manipulation yields a strict `404 Not Found`.
- **Password Security:** Passwords are hashed using `bcrypt` via Passlib; plain text passwords are never stored or logged.
- **Stateless JWT Tokens:** Authentication tokens are signed with HMAC-SHA256 and verified on every protected request.
- **Input Sanitization & Validation:** All request payloads are strictly validated using Pydantic schemas.
- **Server-Side API Keys:** The Google Gemini API key resides solely on the backend server and is never exposed to client browsers.
- **Safe Environment Handling:** Real credential files (`.env`) are explicitly ignored by `.gitignore`.

---

## Current Status and Future Improvements

### Implemented & Verified
- Complete multi-user auth and JWT session management
- Companies, Jobs, Applications, and Interviews CRUD
- Follow-ups & Reminders with dynamic overdue detection and completion tracking
- Unified Dashboard with Upcoming Interviews and Upcoming Follow-ups
- Resume Analyzer supporting both PDF upload and raw text
- Job Match scoring and gap analysis
- Interview question generator and cover letter generator
- End-to-end automated testing suite and zero-drift database migrations

### Planned Enhancements
- Export application history to CSV / Excel
- Email and calendar notification integrations (e.g., Google Calendar, Outlook)
- Dark mode theme toggle
- Drag-and-drop Kanban pipeline board

---

## License

This repository does not currently include an open-source license. All rights are reserved by the repository owner.
