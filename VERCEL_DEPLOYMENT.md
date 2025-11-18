# Vercel Deployment Guide - Full Stack (Frontend + Backend)

This guide shows how to deploy both frontend and backend as a **single Vercel project**.

## ✅ What's Configured

1. **Serverless API**: Express app wrapped as Vercel serverless function
2. **Frontend Build**: Vite builds React app to `dist/` folder
3. **API Routing**: All `/api/*` routes go to serverless function
4. **Frontend Routing**: All other routes serve the React app

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

### Step 2: Deploy on Vercel

1. **Go to Vercel**: https://vercel.com
2. **Sign in** with GitHub
3. **Add New Project**:
   - Click "Add New" → "Project"
   - Import your GitHub repository: `hr-management`
   - Vercel will auto-detect Vite

### Step 3: Configure Project Settings

In the Vercel project settings:

1. **Framework Preset**: Vite (auto-detected)
2. **Root Directory**: `./` (root)
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `dist` (default)
5. **Install Command**: `npm install` (default)

### Step 4: Add Environment Variables

Go to **Settings → Environment Variables** and add:

**Required:**
```
MONGODB_URI=mongodb+srv://shruti_db_user:Mr2LQGNLr2o7XRxd@hrms.aeuawyb.mongodb.net/HRMS?retryWrites=true&w=majority
```

**Optional (for frontend):**
```
VITE_API_URL=/api
```
(If not set, frontend will auto-detect from the same domain)

**Optional (for email):**
```
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_SECURE=false
SMTP_FROM=your-email@example.com
```

### Step 5: Deploy

Click **"Deploy"** and wait for the build to complete.

## 📁 Project Structure

```
/
├── api/
│   └── index.js          # Vercel serverless function wrapper
├── server/
│   ├── index.js          # Express app (exports app, doesn't start server in Vercel)
│   ├── routes/           # API routes
│   ├── controllers/      # Route controllers
│   └── models/           # Mongoose models
├── src/                  # React frontend
├── dist/                 # Built frontend (generated)
├── vercel.json           # Vercel configuration
└── package.json
```

## 🔍 How It Works

1. **Build Phase**:
   - Vercel runs `npm install` (installs root dependencies)
   - Vercel runs `npm run build` (builds frontend to `dist/`)
   - Server dependencies are installed automatically when the serverless function is invoked

2. **Runtime**:
   - Requests to `/api/*` → Go to `api/index.js` serverless function
   - Requests to `/*` → Serve static files from `dist/`
   - React Router handles client-side routing

3. **Serverless Function**:
   - `api/index.js` imports and wraps the Express app
   - Express app handles all API routes
   - Database connection is initialized when function loads

## 🎯 API Endpoints

All API endpoints are available at:
- `https://your-app.vercel.app/api/auth/login`
- `https://your-app.vercel.app/api/employees`
- `https://your-app.vercel.app/api/worksheet`
- etc.

## 🔍 Verify Deployment

1. **Visit your app**: `https://your-app.vercel.app`
2. **Check health**: `https://your-app.vercel.app/health`
3. **Test API**: `https://your-app.vercel.app/api/health` (if you add this endpoint)

## 🐛 Troubleshooting

### API Not Working

**Issue**: API endpoints return 404 or errors

**Solutions**:
- Check Vercel function logs in the dashboard
- Verify `MONGODB_URI` is set correctly
- Check that `api/index.js` exists and exports the handler
- Verify Express routes are properly configured

### Frontend Not Loading

**Issue**: Blank page or 404 errors

**Solutions**:
- Check build logs for errors
- Verify `dist/` folder was created
- Check `vercel.json` rewrites configuration
- Ensure `VITE_API_URL` is set to `/api` (relative path)

### Database Connection Issues

**Issue**: MongoDB connection fails

**Solutions**:
- Verify `MONGODB_URI` environment variable is set
- Check MongoDB Atlas IP whitelist (allow Vercel IPs or use 0.0.0.0/0)
- Check Vercel function logs for connection errors

### Build Fails

**Issue**: Deployment fails during build

**Solutions**:
- Check Node.js version compatibility
- Verify all dependencies are in `package.json`
- Review build logs in Vercel dashboard
- Ensure `server/package.json` dependencies are correct

## 📝 Environment Variables Summary

### Required
- `MONGODB_URI` - MongoDB connection string

### Optional
- `VITE_API_URL` - Frontend API URL (default: `/api` for same domain)
- `NODE_ENV` - Set to `production` (auto-set by Vercel)
- SMTP variables (if using email features)

## 🎉 Benefits of Vercel Deployment

✅ **Automatic HTTPS** - SSL certificates included  
✅ **Global CDN** - Fast content delivery worldwide  
✅ **Auto-scaling** - Handles traffic spikes automatically  
✅ **Zero-config** - Works out of the box  
✅ **Free tier** - Generous free tier for small projects  
✅ **Git integration** - Auto-deploy on git push  
✅ **Preview deployments** - Test PRs before merging  

## 🔄 Continuous Deployment

Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every push to other branches/PRs

## 📊 Monitoring

- **Vercel Dashboard**: View deployments, logs, analytics
- **Function Logs**: Check serverless function execution logs
- **Analytics**: View traffic, performance metrics (Pro plan)

## 🚀 Next Steps

1. Set up custom domain (optional)
2. Configure environment variables for production
3. Set up monitoring and error tracking
4. Configure MongoDB Atlas IP whitelist for Vercel

