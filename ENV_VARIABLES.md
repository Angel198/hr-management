# Environment Variables Guide

This document lists all environment variables needed for the HRMS application.

## 📋 Quick Setup for Vercel

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add each variable below
3. Set the **Environment** to **Production** (and Preview/Development if needed)
4. Click **Save**

## 🔴 Required Variables

### `MONGODB_URI`
- **Description**: MongoDB connection string
- **Current Value**: `mongodb+srv://shruti_db_user:Mr2LQGNLr2o7XRxd@hrms.aeuawyb.mongodb.net/HRMS?retryWrites=true&w=majority`
- **Where to get it**: MongoDB Atlas → Connect → Connect your application
- **Required**: ✅ Yes

## 🟡 Optional Variables

### `VITE_API_URL`
- **Description**: Frontend API base URL
- **For Vercel**: Set to `/api` (relative path, same domain)
- **For local dev**: Leave empty or set to `http://localhost:5050/api`
- **Default**: Auto-detects based on environment
- **Required**: ❌ No

### `PORT`
- **Description**: Server port (only for local development)
- **Default**: `5050`
- **Vercel**: Not needed (auto-managed)
- **Required**: ❌ No

### `NODE_ENV`
- **Description**: Node environment
- **Values**: `production`, `development`
- **Vercel**: Auto-set to `production`
- **Required**: ❌ No

## 📧 Email Configuration (Optional)

If you want email functionality (sending credentials to employees):

### `SMTP_HOST`
- **Description**: SMTP server hostname
- **Example**: `smtp.gmail.com`, `smtp.outlook.com`
- **Required**: ❌ No

### `SMTP_PORT`
- **Description**: SMTP server port
- **Common values**: `587` (TLS), `465` (SSL), `25`
- **Default**: `587`
- **Required**: ❌ No

### `SMTP_USER`
- **Description**: SMTP username (usually your email)
- **Example**: `your-email@gmail.com`
- **Required**: ❌ No

### `SMTP_PASS`
- **Description**: SMTP password or app password
- **Note**: For Gmail, use an App Password, not your regular password
- **Required**: ❌ No

### `SMTP_SECURE`
- **Description**: Use SSL/TLS
- **Values**: `true` or `false`
- **Default**: `false` (use STARTTLS on port 587)
- **Required**: ❌ No

### `SMTP_FROM`
- **Description**: Sender email address
- **Example**: `noreply@yourcompany.com`
- **Required**: ❌ No

## 🔗 Application URLs (Optional)

### `APP_LOGIN_URL`
- **Description**: Frontend URL for email links
- **Example**: `https://your-app.vercel.app`
- **Required**: ❌ No

## 🔐 Security (Optional)

### `BCRYPT_SALT_ROUNDS`
- **Description**: Bcrypt salt rounds for password hashing
- **Default**: `10`
- **Required**: ❌ No

## 📝 Vercel Setup Example

Here's what your Vercel Environment Variables should look like:

```
MONGODB_URI = mongodb+srv://shruti_db_user:Mr2LQGNLr2o7XRxd@hrms.aeuawyb.mongodb.net/HRMS?retryWrites=true&w=majority
VITE_API_URL = /api
```

**That's it!** The rest are optional.

## 🧪 Testing Your Variables

After setting environment variables in Vercel:

1. **Redeploy** your application
2. Check **Function Logs** in Vercel dashboard
3. Visit your app: `https://your-app.vercel.app`
4. Test login/API endpoints

## 🐛 Troubleshooting

### MongoDB Connection Fails
- ✅ Check `MONGODB_URI` is set correctly
- ✅ Verify MongoDB Atlas IP whitelist (allow Vercel IPs or `0.0.0.0/0`)
- ✅ Check connection string format

### API Not Working
- ✅ Verify `VITE_API_URL` is set to `/api`
- ✅ Check Vercel function logs
- ✅ Ensure server dependencies are installed

### Email Not Sending
- ✅ Verify all SMTP variables are set
- ✅ For Gmail: Use App Password, not regular password
- ✅ Check SMTP credentials are correct
- ✅ Verify SMTP port and security settings

## 📚 Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [MongoDB Atlas Connection String](https://www.mongodb.com/docs/atlas/connection-string/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

