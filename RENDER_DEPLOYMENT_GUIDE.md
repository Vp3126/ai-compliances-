# Deploying to Render

Quick guide on how I deployed this project to Render (free tier works fine for demos).

## Backend Deployment

### 1. Create the Web Service

Go to render.com, sign up if you haven't. Click "New" and pick "Web Service".

Connect your GitHub repo. If this is your first time, you'll need to authorize Render to access your repos.

### 2. Configure Settings

When it asks for settings, fill these in:

- **Name**: Whatever you want (like ai-compliance-api)
- **Region**: Pick one close to you
- **Branch**: main
- **Root Directory**: backend
- **Runtime**: Python 3
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 3. Environment Variables

This is important. Click the "Environment" section and add these:

```
MONGODB_URI=your_actual_mongodb_connection_string
JWT_SECRET=make_this_something_random_and_long
GOOGLE_API_KEY=get_this_from_google_ai_studio
```

Notes:
- MongoDB URI: Get this from your MongoDB Atlas dashboard
- JWT Secret: Just bash your keyboard for a random string
- Google API Key: Go to aistudio.google.com/apikey

### 4. Deploy

Hit "Create Web Service". Grab some coffee - first deploy takes 5-10 minutes.

Once it's done, you'll get a URL like `https://something-random.onrender.com`

Test it by going to `https://your-url.onrender.com/docs` - you should see the FastAPI docs page.

## Frontend Deployment

### 1. Update API URLs First

Before deploying the frontend, you need to update all the API calls.

In your frontend code (all the .jsx files in src/pages), find everywhere you have:
```javascript
http://localhost:8000
```

Replace with your actual Render backend URL:
```javascript
https://your-backend-url.onrender.com
```

Commit and push these changes.

### 2. Create Static Site

Back on Render, click "New" again but this time pick "Static Site".

Settings:
- **Name**: ai-compliance-frontend (or whatever)
- **Branch**: main
- **Root Directory**: frontend
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: dist

### 3. Deploy Frontend

Click create. This one's faster, usually 2-3 minutes.

You'll get another URL for your frontend.

## Testing

1. Open your frontend URL
2. Try logging in (you might need to create an admin user first)
3. Upload a test document
4. Check if AI analysis works

If something breaks, check the logs on Render. The free tier sleeps after 15 min of no activity, so first request might be slow.

## Common Issues I Ran Into

- **MongoDB connection fails**: Check if your MongoDB Atlas allows connections from anywhere (0.0.0.0/0) or add Render's IPs
- **API key errors**: Make sure environment variables are spelled exactly right
- **Frontend can't reach backend**: CORS issue - check that your FastAPI has the right CORS settings
- **App is slow**: Free tier goes to sleep. First request after waking takes ~30 seconds

## For Your Interview

You can say:
- "I deployed using Render's managed services"
- "Backend runs on Python with environment variables for secrets"
- "Frontend is a static site built with Vite"
- "Configured CI/CD so it auto-deploys when I push to main"

That's it. Good luck!
