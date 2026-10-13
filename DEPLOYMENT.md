# 🚀 GitHub Pages Deployment - Quick Guide

## ✅ What's Already Done

- ✅ GitHub Actions workflow created (`.github/workflows/deploy.yml`)
- ✅ Vite config updated for GitHub Pages (`base: './'`)
- ✅ `.gitignore` file created
- ✅ README with instructions
- ✅ Project builds successfully

## 📋 Your Steps (5 minutes)

### Step 1: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `bestfood` (or whatever you want)
3. Make it **Public** (required for free GitHub Pages)
4. **DON'T** check "Add a README file" (we have one)
5. Click "Create repository"

### Step 2: Push Code to GitHub
Open your terminal in this project folder and run:

```bash
git init
git add .
git commit -m "Initial commit - BestFood FP Menu Builder"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bestfood.git
git push -u origin main
```

⚠️ Replace `YOUR_USERNAME` with your actual GitHub username!

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Click **Pages** in the left sidebar
4. Under "Source", select **GitHub Actions**
5. That's it!

### Step 4: Wait for Deployment
- Go to the **Actions** tab in your repo
- You'll see the workflow running
- Takes about 2-3 minutes
- When done, your site is live at:
  ```
  https://YOUR_USERNAME.github.io/bestfood/
  ```

## 🎉 You're Done!

Share the URL with your friends and start adding food products!

## 📝 How to Update the Site

Whenever you make changes:

```bash
git add .
git commit -m "Describe your changes"
git push
```

GitHub Actions will automatically rebuild and deploy!

## 🔧 Troubleshooting

**Site not loading?**
- Check the Actions tab for build errors
- Make sure you selected "GitHub Actions" as the source in Pages settings
- Wait a few minutes after the workflow completes

**Assets not loading (CSS/JS)?**
- The `base: './'` in vite.config.js should handle this
- If issues persist, check that you're accessing via `https://username.github.io/repo/` not just the root

**Need to change the repo name?**
- Update the workflow file or just keep using the same repo
- The `base: './'` makes it work with any repo name

---

Need help? Check the main README.md for more details!
