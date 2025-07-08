# Gcrush - AI Boyfriend Chat Platform

## Overview
Gcrush is a modern web application that provides an AI-powered boyfriend chat experience with a sophisticated glassmorphism UI design.

## Features
- 12 unique AI boyfriend characters
- Interactive video previews on hover
- Glassmorphism design with purple/blue gradient theme
- Responsive sidebar navigation
- FAQ section with accordion functionality
- Cloudflare R2 integration for media assets

## Tech Stack
- HTML5
- CSS3 (with glassmorphism effects)
- Vanilla JavaScript
- Font Awesome icons
- Cloudflare R2 for asset storage

## Deployment on Cloudflare Pages

### Prerequisites
1. A Cloudflare account
2. This GitHub repository connected to your account

### Deployment Steps

1. **Connect to Cloudflare Pages**
   - Log in to your Cloudflare dashboard
   - Navigate to Pages
   - Click "Create a project"
   - Connect your GitHub account and select this repository

2. **Configure Build Settings**
   - Framework preset: None
   - Build command: (leave empty)
   - Build output directory: /
   - Root directory: /

3. **Environment Variables**
   No environment variables are required as all assets are served from Cloudflare R2 public URLs.

4. **Deploy**
   - Click "Save and Deploy"
   - Wait for the deployment to complete
   - Your site will be available at `https://[your-project-name].pages.dev`

### Custom Domain (Optional)
1. Go to your Pages project settings
2. Navigate to "Custom domains"
3. Add your custom domain
4. Update your DNS records as instructed

## File Structure
```
├── index.html          # Main HTML file
├── candy-combined.css  # Main stylesheet
├── candy-combined.js   # Main JavaScript file
├── character-lobby.css # Character grid styles (if needed)
├── styles.css         # Additional styles (if needed)
├── script.js          # Additional scripts (if needed)
└── README.md          # This file
```

## Asset Management
All media assets (images, videos, logos) are hosted on Cloudflare R2 and accessed via public URLs:
- Base URL: `https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/`
- Logo: `/asset/logo.png`
- Favicon: `/asset/Favicon.png`
- Character images: `/image/[CharacterName]/[CharacterName]1.png`
- Character videos: `/video/[CharacterName]/[CharacterName]1.mov` or `.mp4`

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimization
- Videos are loaded with `preload="metadata"` for faster initial page load
- Glassmorphism effects use hardware-accelerated CSS
- Images and videos are served from Cloudflare's global CDN

## Security
- All external assets are served over HTTPS
- No sensitive data is stored client-side
- CORS is properly configured for R2 assets

## License
This project is proprietary and confidential.

## Support
For any issues or questions, please contact the development team. 