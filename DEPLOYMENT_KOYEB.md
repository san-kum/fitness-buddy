# Koyeb Deployment Guide - Fitness Buddy

Deploy Fitness Buddy for **FREE** on Koyeb - **no credit card required!**

---

## Prerequisites

1. **GitHub Account** - Your code must be on GitHub
2. **Google OAuth Credentials** - From Google Cloud Console

---

## Step 1: Push Code to GitHub

If not already on GitHub:

```bash
cd /home/media/Code/fitness-buddy

# Initialize git if needed
git init
git add .
git commit -m "Ready for Koyeb deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/fitness-buddy.git
git branch -M main
git push -u origin main
```

---

## Step 2: Create Koyeb Account

1. Go to [koyeb.com](https://www.koyeb.com)
2. Click **Get Started for Free**
3. Sign up with **GitHub** (recommended) or email
4. **No credit card required!**

---

## Step 3: Create New Service

1. From Koyeb dashboard, click **Create Service**
2. Select **GitHub** as deployment source
3. Connect your GitHub account if prompted
4. Select your **fitness-buddy** repository
5. Select branch: **main**

---

## Step 4: Configure Build Settings

| Setting | Value |
|---------|-------|
| **Builder** | Dockerfile |
| **Dockerfile location** | `Dockerfile` |
| **Build context** | `/` (root) |

---

## Step 5: Configure Service Settings

| Setting | Value |
|---------|-------|
| **Service name** | `fitness-buddy` |
| **Region** | Singapore (closest to India) |
| **Instance type** | Nano (Free) |
| **Port** | `8080` |

---

## Step 6: Add Environment Variables

Click **Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `PORT` | `8080` |
| `DATABASE_URL` | `/app/data/fitness_buddy.db` |
| `JWT_SECRET` | Generate with `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret |
| `GOOGLE_REDIRECT_URL` | `https://fitness-buddy-YOUR_ORG.koyeb.app/api/auth/google/callback` |
| `FRONTEND_URL` | `https://fitness-buddy-YOUR_ORG.koyeb.app` |

> **Note**: Replace `YOUR_ORG` with your Koyeb organization name. You'll see the exact URL after deployment.

---

## Step 7: Deploy!

1. Click **Deploy**
2. Wait 3-5 minutes for build and deployment
3. Once green, click the **URL** to open your app

🎉 **Your app is live at: `https://fitness-buddy-xxx.koyeb.app`**

---

## Step 8: Update Google OAuth

After deployment, update Google OAuth redirect URI:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client
4. Add to **Authorized redirect URIs**:
   ```
   https://fitness-buddy-YOUR_ORG.koyeb.app/api/auth/google/callback
   ```
5. Save

Then update the environment variable in Koyeb:
- Go to your service → **Settings** → **Environment Variables**
- Update `GOOGLE_REDIRECT_URL` with the correct URL
- Click **Redeploy**

---

## Important Notes

### ⚠️ SQLite Limitation on Koyeb

Koyeb's free tier **does not have persistent storage**. This means:
- Data is stored in SQLite but **will be lost on redeployment**
- For production, you'd need to use an external database

### Workaround Options:

1. **Use Turso (SQLite in the cloud)** - Free tier available
2. **Use Supabase PostgreSQL** - Free tier with 500MB
3. **Accept data loss on redeploy** - OK for demos/testing

---

## Useful Commands (Koyeb CLI - Optional)

```bash
# Install Koyeb CLI
curl -fsSL https://github.com/koyeb/koyeb-cli/raw/master/install.sh | bash

# Login
koyeb login

# List services
koyeb services list

# View logs
koyeb services logs fitness-buddy

# Redeploy
koyeb services redeploy fitness-buddy
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check Dockerfile syntax, ensure all files are committed |
| OAuth error | Verify redirect URI matches exactly in Google Console |
| App crashes | Check logs in Koyeb dashboard |
| Data lost after redeploy | This is expected - see SQLite limitation above |

---

## Cost: $0/month

Koyeb Free Tier includes:
- 1 Nano instance (0.1 vCPU, 512MB RAM)
- Always-on (no cold starts)
- Free SSL/HTTPS
- 100 GB bandwidth
