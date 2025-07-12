# Cloudflare Pages Environment Setup Guide

## Setting Environment Variables

To enable the chat functionality on Cloudflare Pages, you need to set the following environment variables:

1. **RUNPOD_API_KEY** - Your RunPod API key
2. **RUNPOD_TEXT_ENDPOINT_ID** - Your RunPod endpoint ID (default: 4cx6jtjdx6hdhr)
3. **NEXT_PUBLIC_SUPABASE_URL** - Your Supabase project URL (default: https://kuflobojizyttadwcbhe.supabase.co)
4. **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Your Supabase anonymous key

### Steps to Configure:

1. Go to your Cloudflare Pages project dashboard
2. Navigate to Settings → Environment variables
3. Add the following production variables:
   - Variable name: `RUNPOD_API_KEY`
   - Value: Your actual RunPod API key
   - Variable name: `RUNPOD_TEXT_ENDPOINT_ID`
   - Value: Your endpoint ID (or use default: 4cx6jtjdx6hdhr)
   - Variable name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: https://kuflobojizyttadwcbhe.supabase.co
   - Variable name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw

### How It Works:

The application uses multiple layers of environment variable handling:

1. **Build Time**: `generate-env-config.js` creates an `env-config.js` file during build
2. **Runtime**: `_worker.js` serves the env-config.js dynamically with proper headers
3. **Fallback**: `env-inject.js` provides multiple fallback mechanisms
4. **API Access**: The Cloudflare Function in `/functions/api/chat.js` accesses env variables directly

### Testing:

After deployment, visit `https://yourdomain.pages.dev/test-env.html` to verify that environment variables are properly loaded.

### Troubleshooting:

If you see "env-config.js MIME type error":
- This is handled by the fallback mechanisms
- Check browser console for "Environment configuration loaded" message
- Verify variables are set in Cloudflare Pages dashboard

If chat still uses mock responses:
- Ensure environment variables are set in production (not just preview)
- Check /api/chat responses in browser developer tools
- Verify the API key is correct and has sufficient credits