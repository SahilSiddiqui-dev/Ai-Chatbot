import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Request validation helper
const validateChatRequest = (messages) => {
  if (!Array.isArray(messages)) return 'Messages must be an array';
  if (messages.length === 0) return 'Messages cannot be empty';
  
  for (const msg of messages) {
    if (!msg.role || !msg.content) return 'Each message must have role and content';
    if (!['system', 'user', 'assistant'].includes(msg.role)) return 'Invalid message role';
    
    const maxChars = msg.role === 'system' ? 5000 : 2000;
    if (msg.content.length > maxChars) return `Message content too long (max ${maxChars} chars)`;
  }
  return null;
};

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;
  const validationError = validateChatRequest(messages);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

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
}
