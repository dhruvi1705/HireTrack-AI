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

flowchart LR

&#x20;   U\[Users]

&#x20;   C\[Companies]

&#x20;   J\[Jobs]

&#x20;   A\[Applications]



&#x20;   C -->|has many| J

&#x20;   U -->|submits| A

&#x20;   J -->|receives| A

```



\### Core Tables



| Table | Purpose |

|---|---|

| Users | Stores registered user accounts and authentication information |

| Companies | Stores company information |

| Jobs | Stores job opportunities linked to companies |

| Applications | Stores user applications and their current status |



\### Relationships



\- \*\*Company → Jobs:\*\* One company can have multiple job listings.

\- \*\*User → Applications:\*\* One user can submit multiple applications.

\- \*\*Job → Applications:\*\* One job can receive multiple applications.

\- \*\*Applications\*\* connects users with the jobs they apply for.---



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



### 📋 Application Tracking

Users can track their applications through different stages:

```mermaid
flowchart TB
    S[Saved]
    A[Applied]
    SC[Screening]
    I[Interview]
    O[Offer]

    S --> A
    A --> SC
    SC --> I
    I --> O
```

Other supported states include:

- Rejected
- Withdrawn

Application data includes:

- Job
- Status
- Application date
- Notes
- Created date
- Updated date

---


\## 🔑 Authentication Flow



```mermaid

flowchart TB

&#x20;   U\[User]



&#x20;   R\[Register]

&#x20;   V\[Validate Input]

&#x20;   H\[Password Hashing]

&#x20;   D\[(PostgreSQL)]



&#x20;   L\[Login]

&#x20;   VP\[Verify Password]

&#x20;   JWT\[Generate JWT]

&#x20;   AUTH\[Authenticated API Requests]



&#x20;   U --> R

&#x20;   R --> V

&#x20;   V --> H

&#x20;   H --> D



&#x20;   U --> L

&#x20;   L --> VP

&#x20;   VP --> JWT

&#x20;   JWT --> AUTH

```

\---



\## 📡 API Endpoints



\### Authentication



| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | `/api/auth/register` | Register a new user |

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



HireTrack AI uses FastAPI's automatically generated OpenAPI documentation.



After starting the backend, open:



```text

http://127.0.0.1:8000/docs

```



Swagger UI allows developers to:



\- Explore API endpoints

\- Test API requests

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



\### 1. Clone the Repository



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



The current backend implements:



\- JWT authentication

\- Bcrypt password hashing

\- Protected application endpoints

\- Pydantic input validation

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



```mermaid

flowchart LR

&#x20;   P1\[Phase 1<br/>Core Backend]

&#x20;   P2\[Phase 2<br/>Frontend]

&#x20;   P3\[Phase 3<br/>AI Integration]

&#x20;   P4\[Phase 4<br/>Production]



&#x20;   P1 --> P2

&#x20;   P2 --> P3

&#x20;   P3 --> P4

```



\### Phase 1 — Core Backend



\- FastAPI

\- PostgreSQL

\- SQLAlchemy

\- Alembic

\- Authentication

\- Companies

\- Jobs

\- Applications



\### Phase 2 — Frontend



\- Authentication UI

\- Dashboard

\- Job management

\- Application Kanban

\- Analytics



\### Phase 3 — AI Integration



\- Resume parsing

\- Job matching

\- Skill gap analysis

\- Resume tailoring

\- Interview assistant



\### Phase 4 — Production



\- Docker

\- CI/CD

\- Automated testing

\- Deployment

\- Monitoring



\---



\## 🎯 Project Goals



HireTrack AI aims to provide a centralized platform for managing the job search process while reducing the manual effort involved in organizing applications, understanding job requirements, tailoring resumes, and preparing for interviews.



\---



\## 👩‍💻 Author



\*\*Dhruvi Khatri\*\*



B.Tech – Full-Stack Development



GitHub: `https://github.com/dhruvi1705`



Portfolio: `https://dhruvi1705.github.io/portfolio/`



\---



\## 📄 License



This project is currently developed as a personal/academic portfolio project.

