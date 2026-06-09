# Sahil & Co. Support Chatbot - Setup Guide

## Overview
This is a React + Vite chatbot powered by Google's Gemini AI. It includes built-in FAQ knowledge for support and lead generation.

## What Was Fixed

✅ **Security**: Removed hardcoded API key (replaced with environment variables)
✅ **SDK Updated**: Changed from `@google/genai` to `@google/generative-ai` (correct package)
✅ **API Calls**: Fixed deprecated API call syntax for Gemini 2.0 Flash
✅ **FAQ System**: Added comprehensive FAQ knowledge base for support chat
✅ **Error Handling**: Better error messages for debugging

## Setup Steps

### 1. Get Your Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Get API Key"
3. Create a new API key or use existing one
4. Copy the key

### 2. Configure Environment Variables
1. Open `.env.local` file in the project root
2. Replace `your_gemini_api_key_here` with your actual API key:
   ```
   VITE_GEMINI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
   ```
3. **DO NOT commit this file** - it's in `.gitignore` for security

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

The chatbot will be available at `http://localhost:5173`

### 5. Build for Production
```bash
npm run build
```

## How It Works

- **Chatbot appears** after 3 seconds on the page
- **Proactive message** shows after 8 seconds if chat isn't opened
- **FAQs** are built into the system prompt for automatic responses
- **Lead collection** happens naturally through conversation (Name → Email/WhatsApp)
- **Support answers** pull from the FAQ knowledge base

## Key Features

✅ Modern, professional UI
✅ Mobile responsive (full screen on mobile)
✅ Real-time typing indicator
✅ Chat history persistence in conversation
✅ Smooth animations and transitions
✅ Online status indicator
✅ Proactive engagement bubble

## Customization

### Edit Company Information
Edit these lines in `SahilCoChatbot.jsx`:
```jsx
.sc-header-name: Change "Sahil & Co." to your company name
.sc-avatar: Change "S&C" to your company initials
FAQs: Add your actual FAQ content in the FAQ_KNOWLEDGE_BASE section
```

### Update System Instructions
Modify `SYSTEM_INSTRUCTION` in `SahilCoChatbot.jsx` to customize:
- Conversation flow
- Lead collection strategy
- Company details
- Service descriptions

### Adjust Timing
```jsx
const t1 = setTimeout(() => setIsVisible(true), 3000); // Appear after 3 seconds
const t2 = setTimeout(() => {...}, 8000); // Proactive after 8 seconds
```

## Troubleshooting

### Error: "API key not configured"
- Make sure `.env.local` file exists
- Check that `VITE_GEMINI_API_KEY` is set correctly
- Restart dev server after changing .env

### Chatbot not responding
- Check browser console for errors (F12 → Console tab)
- Verify API key is valid in Google AI Studio
- Check that API key has access to gemini-2.0-flash-lite model

### Styling issues
- Clear browser cache (Ctrl+Shift+Delete)
- Check that all CSS styles rendered correctly

## Deployment Options

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Upload `dist` folder to Netlify
```

### Deploy Anywhere
Build the project and serve the `dist` folder as static files. Remember to set environment variable:
```
VITE_GEMINI_API_KEY=your_key_here
```

## Support & Lead Collection

The chatbot automatically:
1. Greets visitors warmly
2. Understands their needs
3. Asks for their name
4. Collects email or WhatsApp
5. Confirms the team will follow up

All conversation data is logged in browser console (implement backend logging as needed).

## Security Notes

⚠️ **Never** commit `.env.local` to version control
⚠️ **Never** expose your API key in frontend code
⚠️ Consider backend proxy for production (calls API from server instead of client)
⚠️ Implement rate limiting for your API key

---

For questions or support, contact your development team.
