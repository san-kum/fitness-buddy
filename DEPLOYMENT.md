# Fitness Buddy - Render Deployment Guide

## Prerequisites
1. A [GitHub](https://github.com) account
2. A [Render](https://render.com) account (free)
3. A [Google Cloud Console](https://console.cloud.google.com) project for OAuth

---

## Step 1: Push to GitHub

If not already on GitHub:
```bash
cd /home/media/Code/fitness-buddy
git remote add origin https://github.com/YOUR_USERNAME/fitness-buddy.git
git branch -M main
git push -u origin main
```

---

## Step 2: Create PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **PostgreSQL**
3. Configure:
   - **Name**: `fitness-buddy-db`
   - **Region**: Choose closest to you
   - **Instance Type**: `Free` (limited to 90 days, then $7/month)
4. Click **Create Database**
5. Copy the **Internal Database URL** (starts with `postgres://`)

---

## Step 3: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure:
   - **Application type**: Web application
   - **Authorized redirect URIs**: `https://YOUR-APP-NAME.onrender.com/api/auth/google/callback`
6. Copy **Client ID** and **Client Secret**

---

## Step 4: Deploy Web Service on Render

1. Click **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `fitness-buddy`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Runtime**: `Docker`
   - **Instance Type**: `Free`

4. Add **Environment Variables**:
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Your PostgreSQL Internal URL |
   | `JWT_SECRET` | A random 32+ character string |
   | `GOOGLE_CLIENT_ID` | From Google Console |
   | `GOOGLE_CLIENT_SECRET` | From Google Console |
   | `GOOGLE_REDIRECT_URL` | `https://YOUR-APP-NAME.onrender.com/api/auth/google/callback` |
   | `FRONTEND_URL` | `https://YOUR-APP-NAME.onrender.com` |
   | `PORT` | `8080` |

5. Click **Create Web Service**

---

## Step 5: Update OAuth Redirect URL

After deployment, update Google OAuth redirect URI with your actual Render URL:
- `https://fitness-buddy-xxxx.onrender.com/api/auth/google/callback`

---

## Important Notes

### Free Tier Limitations
- **Spin-down**: Free services sleep after 15 mins of inactivity (first request takes ~30s)
- **Database**: Free PostgreSQL expires after 90 days
- **Build minutes**: 750 free minutes/month

### Generate JWT Secret
Run this to generate a secure secret:
```bash
openssl rand -hex 32
```

---

## Alternative: Railway.app

If you prefer Railway (also free):

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add PostgreSQL: `railway add postgresql`
5. Deploy: `railway up`
6. Add environment variables in Railway dashboard

---

## Troubleshooting

### "OAuth redirect_uri_mismatch"
- Ensure Google OAuth redirect URI matches exactly (including https)

### "Database connection failed"
- Use the **Internal** Database URL, not External
- Ensure DATABASE_URL starts with `postgres://` not `postgresql://`

### "App not starting"
- Check Render logs for errors
- Verify all environment variables are set
