# Fly.io Deployment Guide - Fitness Buddy

Deploy Fitness Buddy for **FREE** on Fly.io with persistent SQLite storage.

---

## Step 1: Install Fly CLI

```bash
# Linux
curl -L https://fly.io/install.sh | sh

# Add to PATH (add this to ~/.bashrc or ~/.zshrc)
export FLYCTL_INSTALL="/home/$USER/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

# Verify installation
fly version
```

---

## Step 2: Sign Up & Login

```bash
fly auth signup
# OR if you already have an account:
fly auth login
```
This opens a browser - sign up with GitHub or email (no credit card required).

---

## Step 3: Deploy the App

```bash
cd /home/media/Code/fitness-buddy

# Launch the app (fly.toml already created)
fly launch --copy-config --yes

# Create persistent volume for SQLite database
fly volumes create fitness_data --size 1 --region sin

# Set environment variables
fly secrets set \
  JWT_SECRET="$(openssl rand -hex 32)" \
  GOOGLE_CLIENT_ID="your_google_client_id" \
  GOOGLE_CLIENT_SECRET="your_google_client_secret" \
  GOOGLE_REDIRECT_URL="https://fitness-buddy.fly.dev/api/auth/google/callback" \
  FRONTEND_URL="https://fitness-buddy.fly.dev" \
  DATABASE_URL="/app/data/fitness_buddy.db"

# Deploy!
fly deploy
```

---

## Step 4: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. **APIs & Services** → **Credentials** → Your OAuth Client
3. Add to **Authorized redirect URIs**:
   ```
   https://fitness-buddy.fly.dev/api/auth/google/callback
   ```
4. Update secrets if needed:
   ```bash
   fly secrets set \
     GOOGLE_CLIENT_ID="your_client_id" \
     GOOGLE_CLIENT_SECRET="your_client_secret"
   ```

---

## Step 5: Verify Deployment

```bash
# Check app status
fly status

# View logs
fly logs

# Open in browser
fly open
```

🎉 **Your app is live at: https://fitness-buddy.fly.dev**

---

## Useful Commands

```bash
fly logs              # View live logs
fly status            # Check app health
fly ssh console       # SSH into container
fly secrets list      # List secrets
fly deploy            # Redeploy after changes
fly scale count 1     # Ensure 1 machine running
```

---

## Cost: $0/month

Fly.io free tier includes:
- 3 shared-cpu VMs
- 3GB persistent storage
- 160GB outbound transfer
- Automatic HTTPS
