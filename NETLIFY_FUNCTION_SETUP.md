# Using Netlify Functions to Bypass CORS

If you're getting CORS errors with Upstash, use this method instead. It's actually more secure because your Upstash credentials stay on the server!

## Setup (5 minutes)

### Step 1: The Function is Already Included!

The file `netlify/functions/redis.js` is already in your project. ✓

### Step 2: Configure Environment Variables in Netlify

1. **Go to your Netlify dashboard**
2. **Select your site** (chamoussa-party)
3. **Go to Site settings → Environment variables**
4. **Click "Add a variable"**
5. **Add these two variables:**

   **Variable 1:**
   - Key: `UPSTASH_REDIS_REST_URL`
   - Value: Your Upstash URL (e.g., `https://your-db.upstash.io`)

   **Variable 2:**
   - Key: `UPSTASH_REDIS_REST_TOKEN`
   - Value: Your Upstash token (the long string)

6. **Click "Save"**

### Step 3: Configure app.js

The code already supports Netlify Functions! Just update the configuration:

**In `app.js`, find lines 13-16 and change:**

```javascript
// FROM THIS:
const UPSTASH_CONFIG = {
    url: 'YOUR_UPSTASH_REDIS_REST_URL',
    token: 'YOUR_UPSTASH_REDIS_REST_TOKEN'
};

// TO THIS:
const UPSTASH_CONFIG = {
    url: 'USE_NETLIFY_FUNCTION',
    token: 'USE_NETLIFY_FUNCTION'
};
```

**That's it!** The app will automatically use the Netlify Function instead of direct calls.

### Step 4: Deploy

```bash
git add .
git commit -m "Use Netlify Function for Upstash (bypass CORS)"
git push
```

Wait ~30 seconds for Netlify to redeploy.

## Benefits of This Method

✅ **No CORS issues** - Requests go through your server
✅ **More secure** - Credentials never exposed to browser
✅ **Better** - This is actually the recommended approach!
✅ **Faster** - Can add caching later if needed

## Testing

1. **Create a room** - Should work without CORS errors
2. **Check browser console** - Should see successful requests to `/.netlify/functions/redis`
3. **Join from another device** - Multi-device sync should work!

## Troubleshooting

### "Upstash credentials not configured"

- Check Netlify environment variables are set correctly
- Make sure you redeployed after adding variables
- Variable names must be exact: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### Function not found (404)

- Make sure the file is in `netlify/functions/redis.js`
- Redeploy the site
- Check Netlify deploy logs for errors

### Still getting errors?

- Check Netlify function logs: Site → Functions → redis → Recent invocations
- Make sure environment variables have no extra spaces
- Verify Upstash credentials are correct

---

**This is the recommended method!** More secure and reliable than direct browser-to-Upstash calls.
