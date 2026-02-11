# AI Compliance & Decision Review System

A full-stack intelligent document analysis platform that uses multi-agent AI to automate compliance checking while keeping humans in the decision loop.

## What does this do?

This system helps organizations review legal/compliance documents faster. Instead of manually reading hundreds of pages, AI agents analyze the document, find risks, and explain their reasoning. A human reviewer then makes the final call.

## The Problem I Solved

Companies deal with tons of documents - contracts, policies, legal filings. Reading each one manually is:
- Time consuming (hours per document)
- Error prone (people miss things)
- Hard to scale (you need a huge team)

But fully automated AI can't be trusted for critical decisions. So I built a hybrid approach.

## Tech Stack

**Backend:**
- FastAPI (Python) - async API server
- MongoDB Atlas - document storage
- CrewAI - multi-agent orchestration
- Google Gemini Flash - LLM for analysis
- JWT - authentication

**Frontend:**
- React + Vite
- Recharts for analytics
- Framer Motion for animations
- Tailwind CSS styling

## How It Works

1. User uploads a PDF/DOCX/TXT document
2. Four AI agents analyze it in sequence:
   - **Preprocessor**: Cleans and structures the text
   - **Risk Auditor**: Finds compliance violations
   - **Reasoning Analyst**: Explains why things are risky
   - **Decision Maker**: Calculates a compliance score
3. Human reviewer sees all the AI findings on a dashboard
4. They approve or reject with their own comments
5. Everything gets logged for audit trails

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 16+
- MongoDB Atlas account
- Google AI API key

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=some_random_secret
GOOGLE_API_KEY=your_gemini_api_key
```

Run the server:
```bash
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## Key Features

- **Multi-Agent Analysis**: Different AI specialists for different tasks
- **Human-in-the-Loop**: Final decisions always made by humans
- **Audit Reports**: Download full analysis as text files
- **Analytics Dashboard**: Charts showing approval rates, risk trends
- **Role-Based Access**: Admin and User roles with different permissions

## Deployment

I've deployed this on Render. Check `RENDER_DEPLOYMENT_GUIDE.md` for instructions.

## What I Learned

- Orchestrating multiple LLM agents is way more accurate than single prompts
- FastAPI's async capabilities are great for handling AI API calls
- Human oversight is crucial in compliance - full automation isn't the answer
- MongoDB's flexible schema helps when AI outputs vary

## Future Improvements

- Add support for more document types (images, scanned PDFs)
- Implement real-time collaboration (multiple reviewers)
- Add email notifications for high-risk documents
- Create a mobile app version

## Project Structure

```
.
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── ai_agents.py         # CrewAI agent definitions
│   ├── database.py          # MongoDB connection
│   ├── document_utils.py    # Document processing
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/          # React pages
│   │   ├── components/     # Reusable components
│   │   └── index.css       # Global styles
│   └── package.json
└── README.md
```

## License

MIT

---

Built with ❤️ for making compliance reviews less painful.
