# Sahil & Co. Chatbot - Security Hardened

This is a secure version of the chatbot with the following improvements:

## Security Fixes Applied

✅ **API Key Protection**: Groq API key is now handled server-side, no longer exposed to the browser  
✅ **Input Validation**: All user inputs are sanitized and validated  
✅ **Form Validation**: Email, phone, and text field validation with max length limits  
✅ **CORS Protection**: Backend API with proper CORS configuration  
✅ **Error Handling**: Safe error messages that don't expose sensitive information  
✅ **XSS Prevention**: Input sanitization prevents malicious HTML injection  

## Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:
```
VITE_GEMINI_API_KEY=your_actual_groq_api_key_here
```

⚠️ **Important**: 
- Never commit `.env.local` to git (already in `.gitignore`)
- Rotate your API key if it was ever exposed
- For production, set environment variables in your hosting platform (Vercel, Netlify, etc.)

### 3. Run Development Mode (Both Frontend & Backend)

```bash
npm run dev-full
```

This starts:
- **Frontend**: Vite dev server at `http://localhost:5173`
- **Backend**: Express server at `http://localhost:3001`

### 4. Run Individually (if needed)

Backend only:
```bash
npm run server
```

Frontend only:
```bash
npm run dev
```

## Architecture

### Frontend (React + Vite)
- Location: `/SahilCoChatbot.jsx`, `/src/`
- Communicates with backend via `/api/chat`
- All user input is sanitized before sending
- No API keys exposed to client

### Backend (Express)
- Location: `/server.js`
- Handles Groq API calls securely
- Validates all incoming requests
- Returns safe error messages

## Security Features

### Input Sanitization
- Max 500 characters per message
- HTML tags removed
- Special characters escaped

### Form Validation
- Email format verification
- Phone number pattern validation
- Required field checks
- Max length enforcement

### API Security
- Request validation on backend
- Safe error messages (no API details exposed)
- Rate limit handling
- CORS enabled for frontend origin only

## Production Deployment

### For Vercel/Netlify

1. **Frontend**: Deploydirectly from git
2. **Backend**: Use a serverless function or separate backend

Alternative: Deploy Express backend to Heroku, Railway, or Render

### Environment Variables on Hosting Platform

Set `VITE_GEMINI_API_KEY` in your hosting platform's environment variable settings.

## Files Modified

- ✅ `SahilCoChatbot.jsx` - Removed API key, added sanitization
- ✅ `server.js` - New Express backend
- ✅ `package.json` - Added dependencies and scripts
- ✅ `vite.config.js` - Updated proxy to backend
- ✅ `.env.example` - Placeholder (remove real keys)
- ✅ `.env.local` - Local development (gitignored)

## Next Steps

1. Update your Groq API key (rotate it if exposed)
2. Test locally with `npm run dev-full`
3. Deploy backend and frontend separately
4. Set environment variables on your hosting platform
