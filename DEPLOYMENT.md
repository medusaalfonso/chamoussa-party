# 🚀 Quick Deployment Guide

## Step-by-Step Instructions

### 1. Upload to GitHub

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `chamoussa-party` (or any name you prefer)
3. **Don't** initialize with README (we already have one)
4. Click **Create repository**

5. Open your terminal and navigate to the project folder:
```bash
cd chamoussa-party
git init
git add .
git commit -m "Initial commit - Chamoussa Party"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/chamoussa-party.git
git push -u origin main
```

### 2. Deploy to Netlify

#### Method A: Automatic Deploy (Recommended)

1. Go to [Netlify](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub
5. Select the **chamoussa-party** repository
6. Netlify will auto-detect settings from `netlify.toml`
7. Click **"Deploy site"**
8. Wait 30-60 seconds for deployment
9. Your site is live! 🎉

#### Method B: Manual Deploy

1. Go to [Netlify](https://app.netlify.com)
2. Drag and drop the entire `chamoussa-party` folder to Netlify
3. Done! Your site is live instantly

### 3. Configure Your Site (Optional)

1. In Netlify dashboard, click on your site
2. Go to **"Site settings"** → **"Change site name"**
3. Choose a custom name (e.g., `chamoussa-party-yourname`)
4. Your site will be available at: `https://chamoussa-party-yourname.netlify.app`

### 4. Custom Domain (Optional)

1. In Netlify, go to **"Domain settings"**
2. Click **"Add custom domain"**
3. Follow the instructions to connect your domain
4. Netlify provides free HTTPS certificates!

## 🎬 Using Your Watch Party

### For Hosts:

1. Visit your Netlify URL
2. Paste your M3U8 stream URL
3. (Optional) Upload a .vtt subtitle file
4. Click "Start Party"
5. Share the room link with friends!

### For Viewers:

1. Click the shared link
2. Or enter the room ID on the homepage
3. Click "Join"
4. Enjoy watching together!

## 📱 Share Links

After deployment, you can share:
- Direct link: `https://your-site.netlify.app`
- Room link: `https://your-site.netlify.app?room=ABC123`

## 🔧 Updating Your Site

To update after making changes:

```bash
git add .
git commit -m "Description of changes"
git push
```

Netlify will automatically rebuild and deploy!

## ⚡ Pro Tips

- **Test locally**: Open `index.html` in your browser before deploying
- **Get M3U8 URLs**: Many video hosting platforms provide M3U8 streams
- **Subtitles**: Upload WebVTT (.vtt) files - they'll be shared with all viewers automatically
- **Mobile**: Works great on phones and tablets too!
- **Performance**: Netlify's CDN makes your site super fast worldwide

## 🆘 Need Help?

- Check the main README.md for detailed documentation
- Netlify has great [documentation](https://docs.netlify.com)
- For issues, check the browser console (F12)

---

Enjoy your watch parties! 🎉🍿
