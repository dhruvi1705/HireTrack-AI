\# HireTrack AI



> AI-powered job application and career management platform.



HireTrack AI is a full-stack web application designed to help students and job seekers organize their job applications, track application progress, manage companies and job opportunities, and eventually use AI-powered tools for resume analysis, job matching, and interview preparation.



\---



\## 🚀 Project Status



\*\*Current Phase:\*\* Core full-stack foundation



The current version includes:



\- User registration and authentication

\- JWT-based authentication

\- Secure password hashing

\- Company management

\- Job management

\- Job application tracking

\- PostgreSQL database

\- SQLAlchemy ORM

\- Alembic database migrations

\- RESTful FastAPI backend

\- React + Vite frontend foundation



AI-powered career features are planned for the next development phases.



\---



\## 🛠️ Tech Stack



\### Frontend



\- React

\- Vite

\- JavaScript

\- React Router

\- Axios



\### Backend



\- Python

\- FastAPI

\- SQLAlchemy

\- Pydantic

\- JWT Authentication

\- Passlib / bcrypt



\### Database



\- PostgreSQL

\- Alembic



\### Development Tools



\- Git

\- GitHub

\- VS Code

\- Swagger / OpenAPI



\---



\## 🏗️ System Architecture



```mermaid

flowchart TB

&#x20;   U\[User<br/>Web Browser]



&#x20;   F\[React + Vite<br/>Frontend]



&#x20;   A\[FastAPI<br/>Backend]



&#x20;   AU\[Authentication<br/>Service]

&#x20;   AP\[Application<br/>Service]

&#x20;   BL\[Business<br/>Logic]



&#x20;   DB\[PostgreSQL<br/>Database]



&#x20;   U --> F

&#x20;   F -->|REST API / HTTP| A



&#x20;   A --> AU

&#x20;   A --> AP

&#x20;   A --> BL



&#x20;   AU --> DB

&#x20;   AP --> DB

&#x20;   BL --> DB

```



\---



\## 🗄️ Database Design



The current HireTrack AI database contains four core entities: Users, Companies, Jobs, and Applications.



```mermaid

erDiagram

&#x20;   USERS ||--o{ APPLICATIONS : submits

&#x20;   COMPANIES ||--o{ JOBS : offers

&#x20;   JOBS ||--o{ APPLICATIONS : receives



&#x20;   USERS {

&#x20;       int id

&#x20;       string full\_name

&#x20;       string email

&#x20;       string password\_hash

&#x20;       datetime created\_at

&#x20;       datetime updated\_at

&#x20;   }



&#x20;   COMPANIES {

&#x20;       int id

&#x20;       string name

&#x20;       string website

&#x20;       string location

&#x20;       datetime created\_at

&#x20;       datetime updated\_at

&#x20;   }



&#x20;   JOBS {

&#x20;       int id

&#x20;       int company\_id

&#x20;       string title

&#x20;       string description

&#x20;       string location

&#x20;       string employment\_type

&#x20;       int salary\_min

&#x20;       int salary\_max

&#x20;       datetime created\_at

&#x20;       datetime updated\_at

&#x20;   }



&#x20;   APPLICATIONS {

&#x20;       int id

&#x20;       int user\_id

&#x20;       int job\_id

&#x20;       string status

&#x20;       datetime applied\_at

&#x20;       string notes

&#x20;       datetime created\_at

&#x20;       datetime updated\_at

&#x20;   }

```

\---



\## ✨ Current Features



\### 🔐 Authentication



\- User registration

\- User login

\- JWT access tokens

\- Password hashing using bcrypt

\- Protected API endpoints

\- Email validation

\- Password validation

\- Duplicate email prevention



\### 🏢 Company Management



Users can manage company information including:



\- Company name

\- Website

\- Location



Supported operations:



\- Create company

\- View companies

\- View individual company

\- Update company

\- Delete company



\### 💼 Job Management



Jobs can be associated with companies and contain:



\- Job title

\- Description

\- Location

\- Employment type

\- Salary range

\- Company



Supported operations:



\- Create job

\- View jobs

\- View individual job

\- Update job

\- Delete job



\### 📋 Application Tracking



Users can track their applications through different stages:



```text

Saved

&#x20; ↓

Applied

&#x20; ↓

Screening

&#x20; ↓

Interview

&#x20; ↓

Offer

```



Other supported states include:



\- Rejected

\- Withdrawn



Application data includes:



\- Job

\- Status

\- Application date

\- Notes

\- Created date

\- Updated date



\---



\## 🔑 Authentication Flow



```text

User

&#x20;│

&#x20;│ Register

&#x20;▼

FastAPI

&#x20;│

&#x20;│ Validate input

&#x20;▼

Password Hashing

&#x20;│

&#x20;▼

PostgreSQL

&#x20;│

&#x20;│

&#x20;│ Login

&#x20;▼

Verify Password

&#x20;│

&#x20;▼

Generate JWT

&#x20;│

&#x20;▼

Authenticated API Requests

```



Protected endpoints require a Bearer token.



Example:



```text

Authorization: Bearer <JWT\_TOKEN>

```



\---



\## 📡 API Endpoints



\### Authentication



| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | `/api/auth/register` | Register a user |

| POST | `/api/auth/login` | Login and receive JWT |



\### Companies



| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | `/api/companies/` | Create company |

| GET | `/api/companies/` | Get companies |

| GET | `/api/companies/{id}` | Get company |

| PUT | `/api/companies/{id}` | Update company |

| DELETE | `/api/companies/{id}` | Delete company |



\### Jobs



| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | `/api/jobs/` | Create job |

| GET | `/api/jobs/` | Get jobs |

| GET | `/api/jobs/{id}` | Get job |

| PUT | `/api/jobs/{id}` | Update job |

| DELETE | `/api/jobs/{id}` | Delete job |



\### Applications



| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | `/api/applications/` | Create application |

| GET | `/api/applications/` | Get current user's applications |

| GET | `/api/applications/{id}` | Get application |

| PUT | `/api/applications/{id}` | Update application |

| DELETE | `/api/applications/{id}` | Delete application |



\---



\## 📖 API Documentation



HireTrack AI uses FastAPI's automatically generated API documentation.



After starting the backend, open:



```text

http://127.0.0.1:8000/docs

```



The Swagger UI allows developers to:



\- Explore API endpoints

\- Test requests

\- Authenticate using JWT

\- View request schemas

\- View response schemas



\---



\## ⚙️ Project Structure



```text

HireTrack-AI/

│

├── frontend/

│   ├── src/

│   ├── public/

│   ├── package.json

│   └── vite.config.js

│

├── backend/

│   ├── app/

│   │   ├── models/

│   │   ├── routers/

│   │   ├── schemas/

│   │   ├── services/

│   │   ├── database.py

│   │   ├── dependencies.py

│   │   └── main.py

│   │

│   ├── alembic/

│   │   └── versions/

│   │

│   ├── .env.example

│   ├── alembic.ini

│   └── requirements.txt

│

├── docs/

├── .gitignore

└── README.md

```



\---



\## 💻 Local Setup



\### 1. Clone the repository



```bash

git clone https://github.com/YOUR\_USERNAME/HireTrack-AI.git

cd HireTrack-AI

```



\### 2. Backend Setup



```bash

cd backend

```



Create a virtual environment:



```bash

py -m venv .venv

```



Activate it on Windows:



```powershell

.\\.venv\\Scripts\\Activate.ps1

```



Install dependencies:



```bash

pip install -r requirements.txt

```



\### 3. Configure Environment Variables



Create:



```text

backend/.env

```



Use `.env.example` as the template.



Example:



```env

DATABASE\_URL=postgresql+psycopg2://postgres:YOUR\_PASSWORD@localhost:5432/hiretrack\_db



JWT\_SECRET\_KEY=YOUR\_SECRET\_KEY

JWT\_ALGORITHM=HS256

JWT\_ACCESS\_TOKEN\_EXPIRE\_MINUTES=60

```



\*\*Never commit your real `.env` file or secrets to GitHub.\*\*



\### 4. Run Database Migrations



```bash

alembic upgrade head

```



\### 5. Start the Backend



From the `backend` directory:



```bash

uvicorn app.main:app --reload

```



Backend:



```text

http://127.0.0.1:8000

```



Swagger documentation:



```text

http://127.0.0.1:8000/docs

```



\### 6. Start the Frontend



Open another terminal:



```bash

cd frontend

npm install

npm run dev

```



\---



\## 🔒 Security



The project currently implements:



\- JWT authentication

\- Password hashing

\- Protected application endpoints

\- Input validation using Pydantic

\- Email validation

\- Password length validation

\- Environment-based configuration

\- Secret exclusion through `.gitignore`

\- User-specific application access



\---



\## 🧪 Database Migrations



Alembic is used to manage database schema changes.



Create a migration:



```bash

alembic revision --autogenerate -m "description"

```



Apply migrations:



```bash

alembic upgrade head

```



Check the current migration:



```bash

alembic current

```



Check for schema differences:



```bash

alembic check

```



\---



\## 🔮 Planned AI Features



The next development phase will introduce AI-powered career assistance.



\### 🤖 Resume Analysis



Analyze uploaded resumes and extract:



\- Skills

\- Education

\- Experience

\- Projects

\- Technologies



\### 🎯 Job-Resume Matching



Compare a candidate's resume with a job description and identify:



\- Matching skills

\- Missing skills

\- Relevant experience

\- Job compatibility



\### 📄 AI Resume Tailoring



Generate job-specific resume suggestions based on a selected job description.



\### 🧠 Skill Gap Analysis



Identify skills that may be useful for a target role and suggest areas for improvement.



\### 🎤 Interview Preparation



Generate role-specific interview questions and provide structured feedback.



\### 📊 Career Analytics



Provide insights such as:



\- Applications by status

\- Interview conversion

\- Application trends

\- Frequently targeted roles

\- Skill demand



\---



\## 🗺️ Development Roadmap



```text

Phase 1 ─ Core Backend

&#x20;  ✓ FastAPI

&#x20;  ✓ PostgreSQL

&#x20;  ✓ SQLAlchemy

&#x20;  ✓ Alembic

&#x20;  ✓ Authentication

&#x20;  ✓ Companies

&#x20;  ✓ Jobs

&#x20;  ✓ Applications



Phase 2 ─ Frontend

&#x20;  ├── Authentication UI

&#x20;  ├── Dashboard

&#x20;  ├── Job management

&#x20;  ├── Application Kanban

&#x20;  └── Analytics



Phase 3 ─ AI Integration

&#x20;  ├── Resume parsing

&#x20;  ├── Job matching

&#x20;  ├── Skill gap analysis

&#x20;  ├── Resume tailoring

&#x20;  └── Interview assistant



Phase 4 ─ Production

&#x20;  ├── Docker

&#x20;  ├── CI/CD

&#x20;  ├── Testing

&#x20;  ├── Deployment

&#x20;  └── Monitoring

```



\---



\## 🎯 Project Goals



HireTrack AI aims to provide a centralized platform for managing the job search process while reducing the manual effort involved in organizing applications, understanding job requirements, tailoring resumes, and preparing for interviews.



\---



\## 👩‍💻 Author



\*\*Dhruvi Khatri\*\*



B.Tech – Full-Stack Development



GitHub: `YOUR\_GITHUB\_USERNAME`



Portfolio: `YOUR\_PORTFOLIO\_URL`



\---



\## 📄 License



This project is currently developed as a personal/academic portfolio project.

