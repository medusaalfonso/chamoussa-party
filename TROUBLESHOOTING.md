# 🔧 Troubleshooting Guide

## Room Issues

### "Room not found" error when joining

**Possible causes:**
1. Room ID typed incorrectly
2. Room hasn't been created yet
3. Storage not working in browser

**Solutions:**
- Double-check the room ID (case-sensitive, 6 characters)
- Make sure the host has clicked "Start Party" 
- Try refreshing the page
- Check browser console (F12) for errors
- Ensure you're using a modern browser (Chrome, Firefox, Safari, Edge)

### People can't see my room

**Solutions:**
1. **Share the full URL**: Copy the entire URL from your browser including `?room=XXXXXX`
2. **Use the Share button**: Click the share icon in the chat header
3. **Check the room ID**: Make sure you're sharing the correct 6-character room ID

### Video not syncing between users

**Solutions:**
1. Click the **"Sync"** button in the top right of the video
2. Check internet connection - both host and viewers need stable internet
3. Make sure the host's video is actually playing
4. Refresh the page and rejoin the room
5. Check browser console for any errors

### Chat messages not appearing

**Solutions:**
1. Wait 1-2 seconds - messages sync every 1.5 seconds
2. Check if you're in the same room (verify room ID)
3. Refresh the page
4. Check browser console for storage errors

## Video Issues

### Stream won't play

**Check:**
1. Is the M3U8 URL correct and accessible?
2. Open the M3U8 URL directly in your browser - does it download/load?
3. Check if CORS is enabled on the stream server
4. Try a different M3U8 stream to test if it's a general issue

**Common M3U8 sources that work:**
- Most live TV streams
- Self-hosted media servers (Plex, Jellyfin)
- Public domain content servers

### "HLS not supported" error

**Solution:**
- Use a modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Update your browser to the latest version

### Video quality is poor

**Solutions:**
- This depends on the source stream quality
- Check your internet speed
- The M3U8 stream determines the quality, not the app

## Subtitle Issues

### Subtitles not showing

**Check:**
1. Did you upload a .vtt file? (not .srt or other formats)
2. Click the subtitle toggle button (CC icon)
3. Check browser console for subtitle loading errors
4. Make sure the .vtt file is properly formatted

### How to convert SRT to VTT

Use online converters or this simple method:
1. Open your .srt file in a text editor
2. Add `WEBVTT` as the first line
3. Save as filename.vtt
4. Upload to Chamoussa Party

### Subtitles out of sync

**Solutions:**
- Edit the .vtt file timecodes before uploading
- Use subtitle editing software to adjust timing

## Browser Issues

### Storage errors in console

**Check:**
1. Is localStorage enabled in your browser?
2. Are you in private/incognito mode? (Some browsers restrict storage)
3. Clear browser cache and try again
4. Try a different browser

### Page won't load

**Solutions:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Disable browser extensions temporarily
3. Try incognito/private mode
4. Check browser console for JavaScript errors

## Testing Locally

### How to test before deploying

1. Open `index.html` directly in your browser
2. Use a test M3U8 stream (search for "test m3u8 stream")
3. Open in multiple browser tabs to simulate multiple users
4. Check browser console for any errors

### Testing with friends

1. Deploy to Netlify first (it's free and takes 1 minute)
2. Share the deployed URL
3. Don't try to test locally with friends - it won't work

## Netlify Deployment Issues

### Build fails

**Solution:**
- This is a static site, no build step needed
- Just drag and drop files or use GitHub import
- Make sure all files are included

### Site not updating

**Solutions:**
1. Clear Netlify's cache: Deploys → Trigger deploy → Clear cache and deploy
2. Hard refresh browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
3. Wait a few seconds - CDN propagation takes time

### Custom domain not working

**Solutions:**
1. Follow Netlify's domain setup instructions
2. Wait for DNS propagation (can take 24-48 hours)
3. Use Netlify's provided subdomain in the meantime

## Performance Issues

### Lag or stuttering

**Check:**
1. Internet speed - both host and viewers
2. CPU usage - close other apps
3. Stream quality - try a lower bitrate stream
4. Browser - try Chrome for best performance

### High data usage

**Solutions:**
- This is normal for video streaming
- Use WiFi instead of mobile data
- Choose lower quality streams if available

## Debug Mode

### How to check what's happening

1. Press F12 to open browser console
2. Go to the "Console" tab
3. Look for errors (red text) or warnings (yellow text)
4. Take a screenshot and report issues

### Common console messages

- `"Room created: XXXXXX"` - Room successfully created ✓
- `"Room data retrieved:"` - Successfully joined room ✓
- `"Storage save error"` - Storage problem ⚠️
- `"Room not found"` - Invalid room ID ⚠️
- `"Fatal error"` - Stream loading failed ⚠️

## Still Having Issues?

1. **Check the README.md** for basic setup instructions
2. **Check browser console** for specific error messages
3. **Try a different browser** to isolate the issue
4. **Test with a known working M3U8 stream** to verify it's not the stream
5. **Create a new room** - sometimes helps clear glitches

## Tips for Best Experience

✅ Use Chrome or Firefox for best compatibility
✅ Strong internet connection (10+ Mbps recommended)
✅ Share the full URL including `?room=` parameter
✅ Click Sync button if you get out of sync
✅ Test with one friend first before a big watch party
✅ Use .vtt subtitle format (not .srt)

---

Happy watching! 🎉
