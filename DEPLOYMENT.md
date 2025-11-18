# Deployment Guide for HRMS Application

This guide will help you deploy the HRMS application to Vercel (frontend) and a backend hosting service.

## Architecture

- **Frontend**: React/Vite application (deploy to Vercel)
- **Backend**: Node.js/Express API server (deploy to Railway, Render, or similar)

## Prerequisites

1. GitHub account
2. Vercel account (free tier available)
3. Railway/Render account for backend (or use Vercel serverless functions)

## Step 1: Deploy Backend API

### Option A: Deploy to Railway (Recommended)

1. Go to [Railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add a new service and select the `server` directory
5. Set environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `PORT`: 5050 (or leave default)
   - `SMTP_HOST`: Your email SMTP host
   - `SMTP_PORT`: Your email SMTP port
   - `SMTP_USER`: Your email SMTP user
   - `SMTP_PASS`: Your email SMTP password
   - `SMTP_SECURE`: true/false
   - `SMTP_FROM`: Your email address
   - `APP_LOGIN_URL`: Your frontend URL (will be set after frontend deployment)
   - `BCRYPT_SALT_ROUNDS`: 10

6. Railway will automatically detect it's a Node.js app and deploy
7. Copy the deployed URL (e.g., `https://your-app.railway.app`)

### Option B: Deploy to Render

1. Go to [Render.com](https://render.com) and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: hrms-backend
   - **Root Directory**: server
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables (same as Railway)
6. Deploy and copy the URL

## Step 2: Deploy Frontend to Vercel

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Go to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Sign up/login with GitHub

3. **Import Project**:
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite

4. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Add Environment Variables**:
   - `VITE_API_URL`: Your backend API URL (from Railway/Render)
     - Example: `https://your-app.railway.app/api` or `https://your-app.onrender.com/api`
   - Note: Vercel will automatically prefix with `VITE_` for client-side variables

6. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-app.vercel.app`

## Step 3: Update Backend Environment Variables

After frontend is deployed, update the backend's `APP_LOGIN_URL`:
- Go to Railway/Render dashboard
- Update `APP_LOGIN_URL` to your Vercel frontend URL
- Redeploy backend if needed

## Step 4: Update API Base URL in Code (if needed)

The frontend code should automatically use `VITE_API_URL` from environment variables. Check `src/lib/api.ts` to ensure it's using:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api";
```

## Environment Variables Summary

### Frontend (Vercel)
- `VITE_API_URL`: Backend API URL (e.g., `https://your-backend.railway.app/api`)

### Backend (Railway/Render)
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 5050)
- `SMTP_HOST`: Email SMTP host
- `SMTP_PORT`: Email SMTP port
- `SMTP_USER`: Email SMTP username
- `SMTP_PASS`: Email SMTP password
- `SMTP_SECURE`: true/false
- `SMTP_FROM`: Sender email address
- `APP_LOGIN_URL`: Frontend URL (e.g., `https://your-app.vercel.app`)
- `BCRYPT_SALT_ROUNDS`: 10

## Troubleshooting

### CORS Issues
- Ensure backend CORS is configured to allow your Vercel domain
- Check `server/index.js` for CORS settings

### API Not Found
- Verify `VITE_API_URL` is set correctly in Vercel
- Check backend is running and accessible
- Ensure API routes are prefixed with `/api`

### Build Errors
- Check Node.js version compatibility
- Ensure all dependencies are in `package.json`
- Review build logs in Vercel dashboard

## Custom Domain (Optional)

1. In Vercel dashboard, go to your project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `APP_LOGIN_URL` in backend with new domain

## Monitoring

- **Vercel**: Check deployment logs and analytics
- **Railway/Render**: Monitor server logs and resource usage
- Set up error tracking (e.g., Sentry) for production

