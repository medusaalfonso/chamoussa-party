# ✅ Upstash Quick Setup Checklist

Follow these steps in order to enable multi-device support:

## Step 1: Create Upstash Account
- [ ] Go to https://console.upstash.com
- [ ] Sign up (free, no credit card needed)
- [ ] Verify your email

## Step 2: Create Redis Database
- [ ] Click "Create Database"
- [ ] Name: `chamoussa-party`
- [ ] Type: Regional (free tier)
- [ ] Region: Choose closest to you
- [ ] Click "Create"

## Step 3: Choose Your Setup Method

### Option A: Direct Connection (Simpler, but may have CORS issues)
- [ ] Follow steps 3-4 below

### Option B: Netlify Function (Recommended - No CORS issues!)
- [ ] Skip to **NETLIFY_FUNCTION_SETUP.md** instead
- [ ] More secure, avoids CORS completely

---

## Steps for Option A (Direct Connection):

### Step 3A: Enable CORS (May not be available)
- [ ] In your database page, look for CORS settings
- [ ] If found, enable it
- [ ] If not found, **use Option B instead** (Netlify Function)

### Step 4A: Get Credentials
- [ ] In "REST API" section, copy:
  - `UPSTASH_REDIS_REST_URL` (looks like: https://xxx.upstash.io)
  - `UPSTASH_REDIS_REST_TOKEN` (long string)

## Step 5: Update app.js
- [ ] Open `app.js` in your code editor
- [ ] Find lines 13-14:
```javascript
const UPSTASH_CONFIG = {
    url: 'YOUR_UPSTASH_REDIS_REST_URL',
    token: 'YOUR_UPSTASH_REDIS_REST_TOKEN'
};
```
- [ ] Replace with your actual credentials:
```javascript
const UPSTASH_CONFIG = {
    url: 'https://your-actual-db.upstash.io',
    token: 'AXxxx...your-actual-token'
};
```
- [ ] Save the file

## Step 6: Deploy
- [ ] Commit changes:
```bash
git add app.js
git commit -m "Add Upstash credentials"
git push
```
- [ ] Wait ~30 seconds for Netlify to deploy
- [ ] Test it!

## Step 7: Test Multi-Device
- [ ] Open site on your computer
- [ ] Create a room
- [ ] Open site on your phone
- [ ] Join the same room with the room ID
- [ ] ✨ They should sync!

---

## Common Issues

### CORS Error
```
Access to fetch... has been blocked by CORS policy
```
**Fix:** Go back to Step 3 and enable CORS!

### "Room not found"
- Make sure CORS is enabled
- Check browser console (F12) for errors
- Verify credentials are correct in app.js

### Still not working?
1. Check browser console (F12) for errors
2. Make sure you copied the FULL URL and token
3. Try creating a new database in Upstash
4. Check TROUBLESHOOTING.md

---

## Verify It's Working

When Upstash is configured correctly, you'll see in the browser console:
```
✅ Upstash Redis configured - multi-device support enabled!
```

If you see:
```
⚠️ Upstash not configured! Using localStorage
```
Then check your credentials in app.js.

---

**Total time: ~5 minutes** ⏱️

Need help? Check UPSTASH_SETUP.md for detailed instructions!
