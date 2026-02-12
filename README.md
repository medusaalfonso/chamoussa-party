# 🎉 Chamoussa Party - Watch Together Platform

A beautiful, real-time watch party platform where you can watch M3U8 streams together with friends, complete with synchronized playback, subtitles, and live chat.

## ✨ Features

- 🎬 **M3U8 Stream Support**: Watch any HLS stream together
- 🔄 **Real-time Sync**: Automatic playback synchronization across all viewers
- 💬 **Live Chat**: Chat with friends while watching
- 📝 **Subtitle Support**: Add and sync subtitles (.vtt format)
- 🎨 **Beautiful Dark Mode UI**: Modern, sleek interface
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🔗 **Easy Sharing**: Share room links with friends
- 👥 **Room System**: Create or join watch party rooms

## 🚀 Deploy to Netlify

### Option 1: Direct Deploy (Recommended)

1. **Fork this repository** to your GitHub account
2. **Go to Netlify** (https://netlify.com)
3. Click **"Add new site" → "Import an existing project"**
4. Choose **GitHub** and authorize Netlify
5. Select your **chamoussa-party** repository
6. Click **Deploy** (all settings are already configured in netlify.toml)

### Option 2: Manual Deploy

1. **Build the site** (no build step needed, it's ready to go!)
2. **Drag and drop** the entire folder to Netlify
3. Your site will be live in seconds!

## 📖 How to Use

### Starting a Watch Party

1. Visit your deployed site
2. Paste your **M3U8 stream URL** (e.g., `https://example.com/stream.m3u8`)
3. Optionally add a **subtitle URL** (.vtt format)
4. Click **"Start Party"**
5. Share the **room link** with friends!

### Joining a Watch Party

1. Click the shared room link, or
2. Enter the **room ID** on the home page
3. Click **"Join"**

### Controls

- **Sync Button**: Manually sync with the room if you get out of sync
- **Subtitle Toggle**: Show/hide subtitles
- **Share Button**: Copy the room link to share with others
- **Chat**: Send messages to everyone in the room

## 🛠️ Technical Details

### Technologies Used

- **HLS.js**: For M3U8 stream playback
- **Vanilla JavaScript**: No framework dependencies
- **CSS3**: Modern styling with gradients and animations
- **Persistent Storage API**: For room state and chat synchronization

### How Synchronization Works

- The host controls playback (play, pause, seek)
- Room state is stored in shared storage
- All viewers auto-sync every 3 seconds
- Manual sync available via sync button

### Storage Structure

```
room:{roomId} - Room configuration and current state
messages:{roomId} - Chat messages for the room
```

## 🎨 Customization

You can customize the colors by editing the CSS variables in `styles.css`:

```css
:root {
    --bg-primary: #0f0f1a;
    --bg-secondary: #1a1a2e;
    --accent-primary: #8B5CF6;
    --accent-secondary: #EC4899;
    /* ... more variables */
}
```

## 📝 Finding M3U8 Streams

You can use M3U8 streams from:
- Personal media servers
- Public domain content
- Legal streaming services you have access to
- Your own recorded content

**Note**: Always ensure you have the right to stream content.

## 🐛 Troubleshooting

### Stream won't play
- Check if the M3U8 URL is accessible
- Ensure CORS is enabled on the stream server
- Try opening the stream URL directly in your browser

### Out of sync
- Click the **Sync button** to manually synchronize
- Check your internet connection
- Refresh the page and rejoin the room

### Subtitles not showing
- Ensure the subtitle URL is accessible
- Subtitles must be in .vtt (WebVTT) format
- Click the subtitle button to toggle them on

## 🤝 Contributing

Feel free to fork this project and make it your own! Some ideas for enhancements:

- Video quality selection
- Picture-in-picture mode
- Audio-only mode
- Reactions/emojis
- User avatars
- Private rooms with passwords
- Watch history

## 📄 License

MIT License - feel free to use this for your own projects!

## 💖 Support

If you enjoy using Chamoussa Party, give it a ⭐ on GitHub!

---

Made with 💜 by the community
