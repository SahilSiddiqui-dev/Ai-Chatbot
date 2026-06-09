import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config({ path: '.env.local' });

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request validation middleware
const validateChatRequest = (req, res, next) => {
  const { messages } = req.body;
  
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages must be an array' });
  }
  
  if (messages.length === 0) {
    return res.status(400).json({ error: 'Messages cannot be empty' });
  }
  
  // Validate each message
  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      return res.status(400).json({ error: 'Each message must have role and content' });
    }
    
    if (!['system', 'user', 'assistant'].includes(msg.role)) {
      return res.status(400).json({ error: 'Invalid message role' });
    }
    
    // Max 5000 chars for system instructions, 2000 for user/assistant messages
    const maxChars = msg.role === 'system' ? 5000 : 2000;
    if (msg.content.length > maxChars) {
      return res.status(400).json({ error: `Message content too long (max ${maxChars} chars)` });
    }
  }
  
  next();
};

// Chat endpoint (protected with API key validation)
app.post('/api/chat', validateChatRequest, async (req, res) => {
  const { messages } = req.body;
  const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  if (!GROQ_API_KEY) {
    return res.status(500).json({ 
      error: 'Server configuration error. Please contact support.' 
    });
  }
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 400,
      }),
    });
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const status = response.status;
      
      if (status === 401 || status === 403) {
        return res.status(500).json({ error: 'Authentication error. Please contact support.' });
      }
      if (status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      }
      
      throw new Error(`API error: ${status}`);
    }
    
    const data = await response.json();
    const botText = data.choices?.[0]?.message?.content || 'Something went wrong, please try again.';
    
    res.json({ content: botText });
  } catch (error) {
    console.error('Groq API error:', error);
    res.status(500).json({ 
      error: 'Failed to get response. Please try again.' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
