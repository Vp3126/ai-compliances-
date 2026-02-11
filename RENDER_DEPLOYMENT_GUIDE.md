# 🚀 Render Deployment Guide

## Backend Deployment on Render

### Step 1: Create a Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `https://github.com/Vp3126/ai-compliances-.git`

### Step 2: Configure the Service
Fill in these details:

| Field | Value |
|-------|-------|
| **Name** | `ai-compliance-backend` (or any name) |
| **Region** | Choose closest to you (e.g., Singapore) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

### Step 3: Set Environment Variables
Click **"Environment"** tab and add these variables:

```
MONGODB_URI=mongodb+srv://vsuhani7770:PASSWORD@cluster0.mongodb.net/compliance_db?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-change-this-in-production
GOOGLE_API_KEY=your-gemini-api-key-here
```

**Important:** 
- Replace `PASSWORD` with your actual MongoDB password
- Get `GOOGLE_API_KEY` from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Change `JWT_SECRET` to a random secure string

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. Your backend will be live at: `https://ai-compliance-backend.onrender.com`

### Step 5: Test the API
Once deployed, test your API:
- Docs: `https://your-app.onrender.com/docs`
- Health check: `https://your-app.onrender.com/`

---

## Frontend Deployment on Render (Static Site)

### Step 1: Build Settings
1. Click **"New +"** → **"Static Site"**
2. Connect same GitHub repo
3. Configure:

| Field | Value |
|-------|-------|
| **Name** | `ai-compliance-frontend` |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

### Step 2: Update API URL
Before deploying frontend, update the backend URL in your React code:

In `frontend/src/pages/*.jsx`, replace:
```javascript
// Old
http://localhost:8000

// New
https://ai-compliance-backend.onrender.com
```

### Step 3: Deploy
Click **"Create Static Site"** and wait for deployment.

---

## 🎯 Quick Checklist
- [ ] Backend deployed on Render
- [ ] Environment variables set (MongoDB, JWT, API Key)
- [ ] API tested using `/docs` endpoint
- [ ] Frontend updated with production API URL
- [ ] Frontend deployed as Static Site
- [ ] Test the full flow (login → upload → analysis)

---

## 📝 Notes for Interview
- **"I deployed my backend using Render's Web Service with Python runtime"**
- **"Environment variables like API keys are securely stored in Render's environment config"**
- **"Frontend is deployed as a static site with production API endpoints"**
- **"The app automatically rebuilds when I push to GitHub (CI/CD)"**

Good luck! 🚀
