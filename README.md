# 🍽️ BestFood - FP Menu Builder

A modern web app to track food products, create meals, rate them with friends, and find the best Fiyat/Performans (Price/Performance) combinations.

## 🚀 Features

- 📸 **Add Products** - Upload photos and prices of food items
- 🍱 **Create Meals** - Build custom menus from products
- ⭐ **Rate & Comment** - Rate meals and leave comments
- 🏆 **FP Ranking** - See which meals give the best value
- ✨ **Smart Suggestions** - Auto-generated menu recommendations
- 👥 **Multi-User** - Switch between different user profiles
- 📱 **Mobile Friendly** - Works great on phones

## 🌐 Deploy to GitHub Pages

### Quick Setup (5 minutes)

1. **Create a new GitHub repository**
   - Go to [github.com/new](https://github.com/new)
   - Name it something like `bestfood` or `fp-menu-builder`
   - Make it **Public** (required for free GitHub Pages)
   - Don't initialize with README (we already have one)

2. **Push this code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - BestFood app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to your repo on GitHub
   - Click **Settings** → **Pages** (in the left sidebar)
   - Under **Source**, select **GitHub Actions**
   - That's it! The workflow will automatically deploy

4. **Wait 2-3 minutes** for the first deployment
   - You can check progress in the **Actions** tab
   - Once done, your site will be live at:
     ```
     https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
     ```

### Updating the Site

Just push changes to the `main` branch:
```bash
git add .
git commit -m "Update something"
git push
```

GitHub Actions will automatically rebuild and deploy!

## 🛠️ Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Build

```bash
npm run build
```

The built files will be in `dist/`

## 🎨 Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- Vite
- LocalStorage (data persistence)

## 📝 Notes

- All data is stored in browser localStorage
- Each browser/device has its own data
- Share the URL with friends so they can use it too!
- Data persists across sessions in the same browser

## 🤝 Contributing

This is a personal project for friends to track their food adventures!

---

Made with ❤️ for finding the best FP menus!
