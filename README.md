# AI Marketing Caption Generator

Full-stack Node/Express Web Service serving a React (Vite + Tailwind CSS) frontend for multi-platform marketing caption generation.

## 🚀 Deploying as a Render Web Service

This app is configured to run as a **Node.js Web Service** on Render.

### Option 1: Automatic Blueprint Deployment (Recommended)
1. Push this repository to GitHub or GitLab.
2. Go to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Select your repository. Render will automatically read `render.yaml` and configure:
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

---

### Option 2: Manual Web Service Setup
1. Go to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect your Git repository.
4. Fill in the service configuration:
   - **Name**: `caption-generator-web-service`
   - **Environment**: `Node`
   - **Region**: Any preferred region
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variable (Optional / Recommended):
   - **Key**: `NPM_CONFIG_PRODUCTION`
   - **Value**: `false`
6. Click **Create Web Service**.

---

## 🛠 Local Development Commands

```bash
# Install dependencies
npm install

# Start Express + Vite development server
npm run dev

# Bundle build for production
npm run build

# Run compiled production server
npm start
```
