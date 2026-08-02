# WishJourney

Multilingual bucket-list, AI planning, and wish-fulfilment platform.

## About

WishJourney helps users discover life goals, create realistic AI-powered
plans within their budget, complete their wishes, and share memories
with friends and the community.

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Django, Django REST Framework
- Database: PostgreSQL
- Cache / Queue: Redis, Celery (upcoming)
- AI: Provider-independent service layer (upcoming)

## Project Status

🚧 Currently in active development.

## Completed Phases

- [x] Phase 0: Planning and Architecture
- [x] Phase 1: Base Project Setup
- [x] Phase 2: Authentication and Profiles
- [x] Phase 3: Multilingual Structure (English, Hindi — more languages planned)
- [x] Phase 4 (Backend): Categories, Wish Templates, and User Bucket List CRUD
- [ ] Phase 4 (Frontend): Bucket List UI (next)

## Local Setup

### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
Visit http://localhost:3000

### Backend
\`\`\`bash
cd backend
python -m venv venv
venv\\Scripts\\activate   # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
\`\`\`
Visit http://127.0.0.1:8000

Copy `.env.example` to `.env` and fill in your local PostgreSQL credentials before running the backend.

## License

Private and proprietary. All rights reserved.