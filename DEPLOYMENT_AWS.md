# AWS EC2 Deployment Guide - Fitness Buddy

Complete step-by-step guide for deploying Fitness Buddy on AWS EC2 (~$8/month).

---

## Step 1: AWS Account Setup

### 1.1 Create AWS Account (if needed)
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click **Create an AWS Account**
3. Enter email, choose account name
4. Add payment method (required, but won't be charged for free tier)
5. Complete phone verification & select Basic (free) support plan

---

## Step 2: Launch EC2 Instance

### 2.1 Open EC2 Console
1. Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2)
2. Select region closest to your users (e.g., `ap-south-1` Mumbai for India)
3. Click **Launch Instance**

### 2.2 Configure Instance

| Setting | Value |
|---------|-------|
| **Name** | `fitness-buddy` |
| **AMI** | Amazon Linux 2023 (free tier eligible) |
| **Instance Type** | `t2.micro` or `t3.micro` (free tier) |
| **Key Pair** | Create new → Download `.pem` file → **Save it safely!** |

### 2.3 Network Settings
Click **Edit** and configure:
- ✅ Allow SSH traffic from **My IP** (for security)
- ✅ Allow HTTP traffic from the internet
- ✅ Allow HTTPS traffic from the internet

### 2.4 Storage
- **Size**: 20 GB gp3 (free tier includes 30 GB)

### 2.5 Launch!
Click **Launch Instance** and wait ~2 minutes for it to start.

---

## Step 3: Connect to EC2 via SSH

### 3.1 Get Public IP
1. Go to EC2 Dashboard → Instances
2. Select your instance
3. Copy the **Public IPv4 address** (e.g., `52.66.123.45`)

### 3.2 Connect from Terminal
```bash
# Make key file secure
chmod 400 ~/Downloads/your-key-name.pem

# Connect (replace with your values)
ssh -i ~/Downloads/your-key-name.pem ec2-user@YOUR_PUBLIC_IP
```

---

## Step 4: Install Docker on EC2

Run these commands after SSH-ing into your instance:

```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group
sudo usermod -aG docker ec2-user

# Log out and back in
exit
```

Reconnect via SSH, then verify: `docker --version`

---

## Step 5: Deploy the Application

### 5.1 Clone Repository
```bash
sudo yum install -y git
git clone https://github.com/YOUR_USERNAME/fitness-buddy.git
cd fitness-buddy
```

### 5.2 Build Docker Image
```bash
docker build -t fitness-buddy .
```

### 5.3 Generate JWT Secret
```bash
JWT_SECRET=$(openssl rand -hex 32)
echo "Your JWT_SECRET: $JWT_SECRET"
```

### 5.4 Run the Container
```bash
docker run -d \
  --name fitness-buddy \
  --restart always \
  -p 80:8080 \
  -v fitness-data:/app/data \
  -e DATABASE_URL=/app/data/fitness_buddy.db \
  -e JWT_SECRET="YOUR_JWT_SECRET_HERE" \
  -e GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID" \
  -e GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET" \
  -e GOOGLE_REDIRECT_URL="http://YOUR_EC2_IP/api/auth/google/callback" \
  -e FRONTEND_URL="http://YOUR_EC2_IP" \
  -e PORT=8080 \
  fitness-buddy
```

### 5.5 Verify
```bash
docker ps
curl http://localhost/api/identity
```

🎉 **Visit `http://YOUR_EC2_IP` in your browser!**

---

## Step 6: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project → **APIs & Services** → **OAuth consent screen** → Configure
3. **Credentials** → **Create Credentials** → **OAuth client ID**
   - Type: Web application
   - Redirect URI: `http://YOUR_EC2_IP/api/auth/google/callback`
4. Copy Client ID and Secret
5. Restart container with real credentials:
```bash
docker stop fitness-buddy && docker rm fitness-buddy
docker run -d --name fitness-buddy --restart always \
  -p 80:8080 -v fitness-data:/app/data \
  -e DATABASE_URL=/app/data/fitness_buddy.db \
  -e JWT_SECRET="your_secret" \
  -e GOOGLE_CLIENT_ID="real_id" \
  -e GOOGLE_CLIENT_SECRET="real_secret" \
  -e GOOGLE_REDIRECT_URL="http://YOUR_EC2_IP/api/auth/google/callback" \
  -e FRONTEND_URL="http://YOUR_EC2_IP" \
  -e PORT=8080 \
  fitness-buddy
```

---

## Step 7: (Optional) Custom Domain & HTTPS

```bash
# Install Nginx + Certbot
sudo yum install -y nginx certbot python3-certbot-nginx

# Configure Nginx
sudo tee /etc/nginx/conf.d/fitness-buddy.conf << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Start Nginx
sudo systemctl start nginx && sudo systemctl enable nginx

# Get SSL
sudo certbot --nginx -d your-domain.com
```

Update Google OAuth and env vars to use `https://your-domain.com`

---

## Useful Commands

```bash
docker logs -f fitness-buddy    # View logs
docker restart fitness-buddy    # Restart
docker stop fitness-buddy       # Stop

# Update application
cd fitness-buddy && git pull
docker stop fitness-buddy && docker rm fitness-buddy
docker build -t fitness-buddy .
docker run -d ...  # run command from above
```

---

## Cost: ~$0-10/month
- EC2 t2.micro: Free (12 months) or ~$8.50/mo
- EBS 20GB: Free (30GB included) or ~$1.60/mo
