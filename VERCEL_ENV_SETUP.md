# Vercel Environment Variables Setup Guide

## 🚀 Quick Setup

### Step 1: Go to Vercel Dashboard
1. Visit https://vercel.com
2. Sign in to your account
3. Select your project: **hr-management**

### Step 2: Navigate to Environment Variables
1. Click on your project
2. Go to **Settings** (top menu)
3. Click **Environment Variables** (left sidebar)

### Step 3: Add Variables

Click **Add New** and add each variable:

#### 🔴 Required Variable

**Variable Name:** `MONGODB_URI`  
**Value:** `mongodb+srv://shruti_db_user:Mr2LQGNLr2o7XRxd@hrms.aeuawyb.mongodb.net/HRMS?retryWrites=true&w=majority`  
**Environment:** Select all (Production, Preview, Development)  
**Click:** Add

> **Note:** This is the MongoDB URI currently configured in your system.

#### 🟡 Recommended Variable

**Variable Name:** `VITE_API_URL`  
**Value:** `/api`  
**Environment:** Select all (Production, Preview, Development)  
**Click:** Add

### Step 4: Save and Redeploy
1. After adding all variables, click **Save**
2. Go to **Deployments** tab
3. Click the **⋯** (three dots) on the latest deployment
4. Click **Redeploy**

## 📋 Complete Variable List

### Minimum Required (Must Have)
```
MONGODB_URI=mongodb+srv://shruti_db_user:Mr2LQGNLr2o7XRxd@hrms.aeuawyb.mongodb.net/HRMS?retryWrites=true&w=majority
```

### Recommended
```
VITE_API_URL=/api
```

### Optional (For Email Features)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
SMTP_FROM=your-email@gmail.com
APP_LOGIN_URL=https://your-app.vercel.app
```

## 🎯 Copy-Paste Ready Values

### For Quick Setup (Minimum)
```
MONGODB_URI
mongodb+srv://shruti_db_user:Mr2LQGNLr2o7XRxd@hrms.aeuawyb.mongodb.net/HRMS?retryWrites=true&w=majority

VITE_API_URL
/api
```

## ✅ Verification

After setting variables and redeploying:

1. **Check Deployment Logs**
   - Go to **Deployments** → Click latest deployment
   - Check **Build Logs** for any errors

2. **Test Your App**
   - Visit: `https://your-app.vercel.app`
   - Try logging in
   - Check browser console for errors

3. **Check Function Logs**
   - Go to **Functions** tab
   - Click on `api/index.js`
   - Check logs for database connection status

## 🐛 Common Issues

### Issue: "MongoDB connection failed"
**Solution:** 
- Verify `MONGODB_URI` is set correctly
- Check MongoDB Atlas IP whitelist (allow `0.0.0.0/0` for Vercel)

### Issue: "API not found"
**Solution:**
- Verify `VITE_API_URL` is set to `/api`
- Check Vercel function logs
- Ensure deployment completed successfully

### Issue: "Environment variable not found"
**Solution:**
- Make sure you clicked **Save** after adding variables
- Redeploy the application
- Check variable name spelling (case-sensitive)

## 📸 Visual Guide

1. **Settings Page:**
   ```
   Project → Settings → Environment Variables
   ```

2. **Add Variable Form:**
   ```
   [Variable Name]  [Value]  [Environment: ☑ Production ☑ Preview ☑ Development]
   [Add]
   ```

3. **After Adding:**
   ```
   ✅ MONGODB_URI (Production, Preview, Development)
   ✅ VITE_API_URL (Production, Preview, Development)
   ```

## 🔒 Security Notes

- ✅ Never commit `.env` files to Git
- ✅ Use Vercel's environment variables (secure)
- ✅ Rotate passwords regularly
- ✅ Use MongoDB Atlas IP whitelist for security

## 📚 Need Help?

See `ENV_VARIABLES.md` for detailed descriptions of each variable.

