# Railway Deployment Guide - Single Service (Frontend + Backend)

This guide shows how to deploy both frontend and backend as a **single service** on Railway.

## ✅ What's Configured

1. **Backend serves frontend**: The Express server now serves the React app from the `dist` folder
2. **Build process**: Railway will build the frontend, then start the backend
3. **Single URL**: Everything runs on one domain (e.g., `https://your-app.railway.app`)

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Configure for single-service Railway deployment"
git push origin main
```

### Step 2: Deploy on Railway

1. **Go to Railway**: https://railway.app
2. **Create New Project** → "Deploy from GitHub repo"
3. **Select your repository**: `hr-management`
4. **Add Service**:
   - Railway will auto-detect the project
   - **Root Directory**: Leave empty (uses root)
   - The `nixpacks.toml` in `server/` folder will be used

### Step 3: Configure Railway Settings

In your Railway service settings:

1. **Settings → Build & Deploy**:
   - **Root Directory**: Leave empty (root of repo)
   - Railway will use `server/nixpacks.toml` automatically

2. **Settings → Environment Variables**:
   Add these variables:
   ```
   MONGODB_URI=mongodb+srv://shruti_db_user:Mr2LQGNLr2o7XRxd@hrms.aeuawyb.mongodb.net/HRMS?retryWrites=true&w=majority
   PORT=5050
   NODE_ENV=production
   ```
   
   (Add SMTP variables if you have email configured)

3. **Settings → Networking**:
   - Railway will generate a public URL automatically
   - Copy this URL (e.g., `https://your-app.railway.app`)

### Step 4: Set Frontend API URL (Optional)

Since frontend and backend are on the same domain, you can either:

**Option A**: Set `VITE_API_URL` to relative path (recommended)
```
VITE_API_URL=/api
```

**Option B**: Set `VITE_API_URL` to full URL
```
VITE_API_URL=https://your-app.railway.app/api
```

**Option C**: Leave it empty - the frontend will auto-detect

### Step 5: Deploy

Railway will automatically:
1. Install root dependencies (frontend)
2. Install server dependencies
3. Build the frontend (`npm run build` in root)
4. Start the backend server (`npm start` in server folder)
5. Serve frontend from backend

## 📁 How It Works

1. **Build Phase**:
   - Installs frontend dependencies (root `package.json`)
   - Installs backend dependencies (`server/package.json`)
   - Builds frontend → creates `dist/` folder

2. **Start Phase**:
   - Starts Express server from `server/` folder
   - Server serves API routes at `/api/*`
   - Server serves frontend static files from `../dist/`
   - All routes go to the same domain

## 🔍 Verify Deployment

1. Visit your Railway URL: `https://your-app.railway.app`
2. Check health: `https://your-app.railway.app/health`
3. Check API: `https://your-app.railway.app/api/auth/login`

## 🐛 Troubleshooting

### Frontend not loading
- Check Railway logs for build errors
- Verify `dist/` folder was created during build
- Check that `VITE_API_URL` is set correctly

### API not working
- Check MongoDB connection in logs
- Verify `MONGODB_URI` environment variable
- Check Railway logs for errors

### Build fails
- Check that both `package.json` files are valid
- Verify Node.js version compatibility
- Check Railway build logs for specific errors

## 📝 Environment Variables Summary

**Required**:
- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 5050)

**Optional**:
- `VITE_API_URL` - Frontend API URL (default: auto-detects)
- `NODE_ENV` - Set to `production`
- SMTP variables (if using email)

## 🎉 Benefits of Single Service

✅ One URL for everything  
✅ No CORS issues  
✅ Simpler deployment  
✅ Lower cost (one service)  
✅ Easier to manage  

