# Supabase Configuration for Gcrush

## Required Redirect URLs

To ensure proper authentication flow, you need to add the following URLs to your Supabase project's redirect URL allowlist:

### 1. Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**

### 2. Add Redirect URLs

#### Production URLs (gcrush.org)
```
https://gcrush.org/reset-password.html
https://gcrush.org/forgot-password.html
https://gcrush.org/
```

#### Development URLs (if using local development)
```
http://localhost:3000/reset-password.html
http://localhost:3000/forgot-password.html
http://localhost:3000/
```

#### Cloudflare Pages URLs (if using preview deployments)
```
https://*.pages.dev/reset-password.html
https://*.pages.dev/forgot-password.html
https://*.pages.dev/
```

### 3. Site URL Configuration

Set your **Site URL** to:
- Production: `https://gcrush.org`
- Development: `http://localhost:3000`

### 4. Email Template Configuration

In **Authentication** → **Email Templates**, update the password reset template to use `{{ .RedirectTo }}` instead of `{{ .SiteURL }}`:

```html
<!-- Change this: -->
<a href="{{ .SiteURL }}/reset-password.html?token={{ .Token }}">Reset Password</a>

<!-- To this: -->
<a href="{{ .RedirectTo }}">Reset Password</a>
```

## Password Reset Flow

The current password reset flow works as follows:

1. User visits `/forgot-password.html` and enters their email
2. System calls `resetPasswordForEmail` with `redirectTo: '/reset-password.html'`
3. User receives email with reset link
4. User clicks link and is redirected to `/reset-password.html`
5. If link is expired/invalid, user sees error modal on main page
6. User can request new reset link from the error modal

**Important Notes:**
- Reset links are valid for **1 hour** by default (Supabase setting)
- Links can only be used once
- The system now provides more forgiving error handling to reduce false "expired" messages
- Users get multiple chances to verify their session before showing error

## Error Handling

The system handles the following error scenarios:

- **Link Expired**: `error_code=otp_expired` - Shows expiration message
- **Access Denied**: `error=access_denied` - Shows access denied message (only if definitely expired)
- **Rate Limiting**: Shows rate limit message with countdown
- **Email Not Found**: Shows email not found message
- **Session Recovery**: Attempts multiple times to recover session before failing

## Testing

Use the following test pages to verify functionality:

- `/reset-password-debug.html` - Debug password reset flow
- `/forgot-password-test.html` - Test forgot password functionality
- `/password-reset-flow-test.html` - Test complete flow with rate limiting

## Security Notes

- Rate limiting is enforced by Supabase (48 seconds between requests)
- Email validation is handled server-side
- All URLs must be explicitly whitelisted in Supabase
- HTTPS is required for production URLs 