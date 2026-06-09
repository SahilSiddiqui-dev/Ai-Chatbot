import { useState, useEffect, useRef } from "react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;

// FAQ Knowledge Base for Hair Transplant Clinic
const FAQ_KNOWLEDGE_BASE = `
You are Chloe, a friendly, professional customer support specialist for Sahil Hair Clinic (a premium hair restoration clinic):

SERVICES OFFERED:
1. FUE (Follicular Unit Extraction): Modern, minimally invasive technique where individual hair grafts are extracted and transplanted. No linear scar, fast recovery (7-10 days). It is virtually painless and leaves tiny dot scars that are invisible under short hair.
2. FUT (Follicular Unit Transplantation): Strip method where a strip of scalp is taken to extract grafts. Ideal for maximum coverage in a single session. Leaves a fine linear scar in the donor area, which is covered by longer hair.
3. PRP (Platelet-Rich Plasma) Therapy: Non-surgical treatment using the patient's own blood plasma to stimulate hair follicles and treat thinning. It is great for thickening existing hair and promoting healing.
4. Beard & Eyebrow Transplants: Specialized restoration for facial hair, using hair follicles from the back of the scalp.

FAQS:
Q: Does the procedure hurt?
A: We use local anesthesia, so the procedure is virtually painless. You will feel a small pinch during the numbing injections, but during the actual extraction and transplantation, you won't feel anything. You might feel mild tightness or discomfort during the recovery period, which is easily managed with standard pain relievers.

Q: How long does recovery take?
A: Most patients return to light work in 2-3 days. The tiny scabs in the donor and recipient areas heal and fall off within 7-10 days. We provide a post-op wash kit and detailed instructions to make recovery smooth.

Q: When will I see the results?
A: Transplanted hair sheds in 2-4 weeks (this is the normal 'shock loss' phase), then starts growing new shafts. Visible improvement starts at 3-4 months, with final dense results appearing in 9-12 months.

Q: What is the cost of a hair transplant?
A: The cost depends entirely on the number of grafts required (typically 1,500 to 4,000+ grafts depending on your hair loss stage). We offer free consultations to estimate the graft count and give an exact quote. Never make up numbers, but explain this graft-based pricing structure clearly.

Q: Where are you located?
A: Our state-of-the-art clinic is located in the city center. We also offer online consultations for out-of-town patients.

TONE & BEHAVIOR:
- Warm, empathetic, informative, and professional. Hair loss is a sensitive topic, so be reassuring and kind.
- Give genuine, detailed answers to questions about procedures, recovery, and hair restoration. Do not give vague or evasive replies.
- Explain the science/procedure steps if asked.
- If the user wants to book an appointment or get an estimate, guide them to click the 'Book Now' button in the banner at the top of the chat window.
`;

const SYSTEM_INSTRUCTION = `You are Chloe, the warm, empathetic, and professional AI medical assistant for Sahil Hair Clinic.
Your goal is to guide visitors, answer their hair restoration questions with genuine, detailed, and clear information, and invite them to book a free consultation using our booking form.

${FAQ_KNOWLEDGE_BASE}

CONVERSATION FLOW:
1. Greet the visitor warmly. (e.g. "Welcome to Sahil Hair Clinic! I'm Chloe...")
2. Empathetically and thoroughly answer questions about hair transplants (FUE, FUT, PRP) or recovery. Provide genuine, detailed information.
3. If they ask about pricing, graft count, or want to book an appointment/consultation, explain how pricing works and politely direct them to click the "Book Now" button at the top of the chat window to open the consultation form.

CRITICAL RULES:
- Never give vague or evasive answers. Answer questions directly using the knowledge base.
- Do not mention any hidden tags like [SHOW_FORM]. Instead, direct the user to click the "Book Now" button in the blue banner at the top of the chat window.
- Keep your tone professional, medical, and supportive.
`;

const FIRST_BOT_MESSAGE = "Welcome to Sahil Hair Clinic! I'm Chloe. 🌟 Are you looking to restore your hairline, treat thinning areas, or get a free graft/cost estimate?";

function formatMessageText(text) {
  if (!text) return "";

  // Helper to replace markdown bold (**text**) with <strong>text</strong>
  const parseBold = (str) => {
    return str.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  };

  const lines = text.split("\n");
  const result = [];
  let currentList = null; // 'ul' | 'ol' | null
  let listItems = [];

  const closeList = () => {
    if (currentList === "ul") {
      result.push(
        <ul key={result.length} className="sc-formatted-list">
          {listItems.map((item, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: parseBold(item) }} />)}
        </ul>
      );
    } else if (currentList === "ol") {
      result.push(
        <ol key={result.length} className="sc-formatted-list-numbered">
          {listItems.map((item, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: parseBold(item) }} />)}
        </ol>
      );
    }
    listItems = [];
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (currentList) closeList();
      continue;
    }

    // Check for unordered list (- item, * item, • item)
    const ulMatch = line.match(/^[-*•]\s+(.*)/);
    // Check for ordered list (1. item, 2. item)
    const olMatch = line.match(/^\d+\.\s+(.*)/);

    if (ulMatch) {
      if (currentList && currentList !== "ul") {
        closeList();
      }
      currentList = "ul";
      listItems.push(ulMatch[1]);
    } else if (olMatch) {
      if (currentList && currentList !== "ol") {
        closeList();
      }
      currentList = "ol";
      listItems.push(olMatch[1]);
    } else {
      if (currentList) closeList();
      result.push(
        <p key={result.length} className="sc-formatted-paragraph" dangerouslySetInnerHTML={{ __html: parseBold(line) }} />
      );
    }
  }

  if (currentList) closeList();

  return result;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function SahilCoChatbot() {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showProactive, setShowProactive] = useState(false);
  const [proactiveDismissed, setProactiveDismissed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [chatAnimating, setChatAnimating] = useState(false);
  const [showFormOverlay, setShowFormOverlay] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 380, height: 580 });
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 440);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Appear after 500ms
  useEffect(() => {
    const t1 = setTimeout(() => setIsVisible(true), 500);
    // Proactive message after 2 seconds
    const t2 = setTimeout(() => {
      if (!isOpen) setShowProactive(true);
    }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Hide proactive message when chat opens
  useEffect(() => {
    if (isOpen) setShowProactive(false);
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when open
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const openChat = () => {
    setProactiveDismissed(true);
    setShowProactive(false);
    setChatAnimating(true);
    setIsOpen(true);

    if (!hasOpened) {
      setHasOpened(true);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages([
          {
            role: "model",
            text: FIRST_BOT_MESSAGE,
            time: formatTime(new Date()),
          },
        ]);
      }, 500);
    }
  };

  const closeChat = () => {
    setChatAnimating(false);
    setTimeout(() => setIsOpen(false), 280);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    if (!GROQ_API_KEY) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Error: API key not configured. Please set VITE_GROQ_API_KEY or VITE_GEMINI_API_KEY in your .env.local file.",
          time: formatTime(new Date()),
        },
      ]);
      return;
    }

    const userMsg = { role: "user", text, time: formatTime(new Date()) };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    try {
      // Build message history for the API (exclude first bot greeting, start from first user message)
      let history = updatedMessages.slice(0, -1);
      
      // If the first message is from the model (initial greeting), skip it
      if (history.length > 0 && history[0].role === "model") {
        history = history.slice(1);
      }
      
      // Convert to Groq API format (OpenAI compatible)
      const messagesForAPI = [
        { role: "system", content: SYSTEM_INSTRUCTION },
        ...history.map((m) => ({
          role: m.role === "model" ? "assistant" : "user",
          content: m.text,
        })),
        { role: "user", content: text }
      ];

      // Use the Vite dev server proxy in development to avoid CORS issues, or fallback to the direct URL in production
      const isDev = import.meta.env.DEV;
      const baseURL = isDev ? "/api-groq" : "https://api.groq.com";

      const response = await fetch(`${baseURL}/openai/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: messagesForAPI,
          temperature: 0.7,
          max_tokens: 400, // increased tokens so Chloe can give detailed answers
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const botText = data.choices?.[0]?.message?.content || "Something went wrong, please try again.";

      setMessages((prev) => [
        ...prev,
        { role: "model", text: botText, time: formatTime(new Date()) },
      ]);
    } catch (err) {
      console.error("Groq API error:", err);
      
      let errorMsg = "Something went wrong. Please try again.";
      const errMsgLower = (err.message || "").toLowerCase();
      
      if (errMsgLower.includes("key") || errMsgLower.includes("api key") || errMsgLower.includes("unauthorized") || errMsgLower.includes("invalid")) {
        errorMsg = "API Error: Please check your Groq API key configuration in .env.local.";
      } else if (errMsgLower.includes("quota") || errMsgLower.includes("limit") || errMsgLower.includes("429") || errMsgLower.includes("rate")) {
        errorMsg = "Quota exceeded: Please check your Groq API quota or plan details.";
      } else if (errMsgLower.includes("network") || errMsgLower.includes("fetch") || errMsgLower.includes("connect")) {
        errorMsg = "Network error: Please check your connection.";
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: errorMsg,
          time: formatTime(new Date()),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleOverlayFormSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get("name");
    const phone = formData.get("phone");
    const email = formData.get("email");
    const concern = formData.get("concern");

    setShowFormOverlay(false);

    const userConfirmMsg = {
      role: "user",
      text: `Submitted consultation details (Name: ${name}, Phone: ${phone}, stage/concern: ${concern})`,
      time: formatTime(new Date()),
    };

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        userConfirmMsg,
        {
          role: "model",
          text: `Thank you, ${name}! Your consultation request has been recorded. Chloe has sent these details to the Sahil Hair Clinic coordinator. We will contact you at ${phone} / ${email} within 24 hours to schedule your free graft assessment! 📞💇‍♂️`,
          time: formatTime(new Date()),
        }
      ]);
    }, 600);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      const newWidth = Math.max(320, Math.min(800, startWidth - deltaX));
      const newHeight = Math.max(400, Math.min(window.innerHeight - 60, startHeight - deltaY));
      
      setDimensions({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;

    const handleTouchMove = (moveEvent) => {
      const touchMove = moveEvent.touches[0];
      const deltaX = touchMove.clientX - startX;
      const deltaY = touchMove.clientY - startY;
      
      const newWidth = Math.max(320, Math.min(800, startWidth - deltaX));
      const newHeight = Math.max(400, Math.min(window.innerHeight - 60, startHeight - deltaY));
      
      setDimensions({ width: newWidth, height: newHeight });
    };

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        * { box-sizing: border-box; }

        .sc-widget {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          font-family: 'Inter', system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }

        /* Chat Window */
        .sc-window {
          position: relative;
          width: 380px;
          max-height: 580px;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transform-origin: bottom right;
          animation: sc-slide-up 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .sc-window.closing {
          animation: sc-slide-down 0.28s cubic-bezier(0.4,0,0.6,1) forwards;
        }

        @keyframes sc-slide-up {
          from { opacity: 0; transform: scale(0.85) translateY(24px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes sc-slide-down {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to   { opacity: 0; transform: scale(0.85) translateY(24px); }
        }

        /* Header */
        .sc-header {
          background: #0F172A;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .sc-header-left {
          display: flex;
          align-items: center;
          gap: 11px;
        }
        .sc-avatar {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.5px;
          flex-shrink: 0;
          overflow: hidden;
        }
        .sc-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .sc-header-info { display: flex; flex-direction: column; gap: 2px; }
        .sc-header-name {
          color: #f8fafc;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.2;
        }
        .sc-header-status {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          color: #94a3b8;
        }
        .sc-online-dot {
          width: 7px; height: 7px;
          background: #22c55e;
          border-radius: 50%;
          animation: sc-pulse-dot 2s ease-in-out infinite;
        }
        @keyframes sc-pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .sc-close-btn {
          background: rgba(255,255,255,0.08);
          border: none;
          border-radius: 8px;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
          color: #94a3b8;
        }
        .sc-close-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }

        /* Messages area */
        .sc-messages {
          flex: 1;
          overflow-y: auto;
          padding: 18px 14px 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: #f8fafc;
          scroll-behavior: smooth;
        }
        .sc-messages::-webkit-scrollbar { width: 4px; }
        .sc-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

        /* Message bubbles */
        .sc-msg-row {
          display: flex;
          flex-direction: column;
          max-width: 78%;
          gap: 3px;
        }
        .sc-msg-row.user { align-self: flex-end; align-items: flex-end; }
        .sc-msg-row.bot  { align-self: flex-start; align-items: flex-start; }

        .sc-bubble {
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 13.5px;
          line-height: 1.55;
          word-break: break-word;
        }
        .sc-bubble.user {
          background: #0F172A;
          color: #f1f5f9;
          border-bottom-right-radius: 4px;
        }
        .sc-bubble.bot {
          background: #F1F5F9;
          color: #1e293b;
          border-bottom-left-radius: 4px;
        }

        .sc-time {
          font-size: 10.5px;
          color: #94a3b8;
          padding: 0 2px;
        }

        /* Typing indicator */
        .sc-typing {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 12px 14px;
          background: #F1F5F9;
          border-radius: 14px;
          border-bottom-left-radius: 4px;
          width: fit-content;
        }
        .sc-dot {
          width: 7px; height: 7px;
          background: #94a3b8;
          border-radius: 50%;
          animation: sc-bounce 1.2s ease-in-out infinite;
        }
        .sc-dot:nth-child(2) { animation-delay: 0.2s; }
        .sc-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes sc-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }

        /* Input bar */
        .sc-input-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          border-top: 1px solid #e2e8f0;
          background: #fff;
          flex-shrink: 0;
        }
        .sc-input {
          flex: 1;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 9px 13px;
          font-size: 13.5px;
          font-family: inherit;
          color: #1e293b;
          background: #f8fafc;
          outline: none;
          transition: border-color 0.15s;
          resize: none;
        }
        .sc-input:focus { border-color: #0F172A; background: #fff; }
        .sc-input::placeholder { color: #94a3b8; }
        .sc-input:disabled { opacity: 0.5; cursor: not-allowed; }

        .sc-send-btn {
          width: 38px; height: 38px;
          background: #0F172A;
          border: none;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          flex-shrink: 0;
        }
        .sc-send-btn:hover:not(:disabled) { background: #1e3a5f; }
        .sc-send-btn:active:not(:disabled) { transform: scale(0.93); }
        .sc-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Proactive bubble */
        .sc-proactive {
          background: #0F172A;
          color: #f1f5f9;
          padding: 10px 16px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 500;
          white-space: nowrap;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          animation: sc-fade-in 0.4s ease forwards;
          cursor: pointer;
          position: relative;
        }
        .sc-proactive::after {
          content: '';
          position: absolute;
          bottom: -7px; right: 20px;
          width: 0; height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 7px solid #0F172A;
        }
        @keyframes sc-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Float button */
        .sc-fab {
          width: 56px; height: 56px;
          background: #0F172A;
          border: none;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(15,23,42,0.35);
          transition: transform 0.2s, box-shadow 0.2s;
          animation: sc-fab-bounce 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards, sc-pulse 2.5s ease-in-out 1s infinite;
          position: relative;
          overflow: hidden;
          padding: 0;
        }
        .sc-fab img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .sc-fab:hover {
          transform: scale(1.07);
          box-shadow: 0 6px 28px rgba(15,23,42,0.45);
        }
        @keyframes sc-fab-bounce {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes sc-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(15,23,42,0.35), 0 0 0 0 rgba(15,23,42,0.25); }
          50% { box-shadow: 0 4px 20px rgba(15,23,42,0.35), 0 0 0 10px rgba(15,23,42,0); }
        }

        /* Promo Banner Styling */
        .sc-promo-banner {
          background: #f0f9ff;
          border-bottom: 1px solid #e2e8f0;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: #0369a1;
          font-weight: 500;
          flex-shrink: 0;
        }
        .sc-promo-btn {
          background: #0ea5e9;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
        .sc-promo-btn:hover {
          background: #0284c7;
        }
        .sc-promo-btn:active {
          transform: scale(0.95);
        }

        /* Overlay Form Styling */
        .sc-overlay-container {
          position: absolute;
          top: 70px; /* height of header */
          left: 0;
          right: 0;
          bottom: 0;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          z-index: 10;
          animation: sc-slide-up-overlay 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes sc-slide-up-overlay {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .sc-overlay-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .sc-overlay-header h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #0F172A;
        }
        .sc-overlay-close {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          transition: background 0.15s, color 0.15s;
        }
        .sc-overlay-close:hover {
          background: #f1f5f9;
          color: #0F172A;
        }
        .sc-overlay-content {
          flex: 1;
          overflow-y: auto;
          padding: 18px;
        }

        /* Form Fields inside Overlay */
        .sc-inline-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sc-form-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: left;
        }
        .sc-form-field label {
          font-size: 10.5px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .sc-form-field input, .sc-form-field select {
          padding: 8px 10px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13px;
          color: #1e293b;
          outline: none;
          transition: border-color 0.15s;
          background: #f8fafc;
          width: 100%;
        }
        .sc-form-field input:focus, .sc-form-field select:focus {
          border-color: #0ea5e9;
          background: #ffffff;
        }
        .sc-form-submit-btn {
          background: #0ea5e9;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 10px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          margin-top: 8px;
        }
        .sc-form-submit-btn:hover {
          background: #0284c7;
        }

        /* Message Formatting Styles */
        .sc-formatted-paragraph {
          margin: 0 0 8px 0;
          line-height: 1.5;
        }
        .sc-formatted-paragraph:last-child {
          margin-bottom: 0;
        }
        .sc-formatted-list, .sc-formatted-list-numbered {
          margin: 6px 0 8px 0;
          padding-left: 20px;
        }
        .sc-formatted-list-numbered {
          list-style-type: decimal;
        }
        .sc-formatted-list {
          list-style-type: disc;
        }
        .sc-formatted-list li, .sc-formatted-list-numbered li {
          margin-bottom: 5px;
          line-height: 1.45;
        }
        .sc-formatted-list li:last-child, .sc-formatted-list-numbered li:last-child {
          margin-bottom: 0;
        }
        .sc-bubble strong {
          font-weight: 600;
        }

        /* Resize Handle Styles */
        .sc-resize-handle {
          position: absolute;
          top: 0;
          left: 0;
          width: 16px;
          height: 16px;
          cursor: nwse-resize;
          z-index: 99999;
          border-top-left-radius: 16px;
        }
        .sc-resize-handle::before {
          content: '';
          position: absolute;
          top: 4px;
          left: 4px;
          width: 8px;
          height: 8px;
          border-left: 2px solid #cbd5e1;
          border-top: 2px solid #cbd5e1;
        }
        .sc-resize-handle:hover::before {
          border-left-color: #0ea5e9;
          border-top-color: #0ea5e9;
        }

        .sc-fab-notification {
          position: absolute;
          top: -2px; right: -2px;
          width: 14px; height: 14px;
          background: #22c55e;
          border-radius: 50%;
          border: 2px solid #fff;
          animation: sc-pulse-dot 2s ease-in-out infinite;
        }

        /* Mobile */
        @media (max-width: 440px) {
          .sc-widget {
            bottom: 0; right: 0;
            width: 100%;
            align-items: center;
          }
          .sc-window {
            width: 100vw;
            max-height: 80vh;
            border-radius: 20px 20px 0 0;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
          }
          .sc-fab { margin-right: 20px; align-self: flex-end; }
          .sc-proactive { margin-right: 16px; align-self: flex-end; }
        }
      `}</style>

      <div className="sc-widget">
        {/* Chat Window */}
        {isOpen && (
          <div
            className={`sc-window${chatAnimating ? "" : " closing"}`}
            style={isMobile ? {} : {
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              maxHeight: "none",
            }}
          >
            {!isMobile && (
              <div
                className="sc-resize-handle"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              />
            )}
            {/* Header */}
            <div className="sc-header">
              <div className="sc-header-left">
                <div className="sc-avatar">
                  <img src="/support_avatar.png" alt="Chloe" />
                </div>
                <div className="sc-header-info">
                  <div className="sc-header-name">Chloe | Sahil Hair Clinic</div>
                  <div className="sc-header-status">
                    <div className="sc-online-dot" />
                    Online · Typically replies instantly
                  </div>
                </div>
              </div>
              <button className="sc-close-btn" onClick={closeChat} aria-label="Close chat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Promo Banner */}
            <div className="sc-promo-banner">
              <span>📅 Free Graft Estimate &amp; Consult</span>
              <button className="sc-promo-btn" onClick={() => setShowFormOverlay(true)}>Book Now</button>
            </div>

            {/* Messages */}
            <div className="sc-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`sc-msg-row ${msg.role === "user" ? "user" : "bot"}`}>
                  <div className={`sc-bubble ${msg.role === "user" ? "user" : "bot"}`}>
                    {formatMessageText(msg.text)}
                  </div>
                  <div className="sc-time">{msg.time}</div>
                </div>
              ))}

              {isTyping && (
                <div className="sc-msg-row bot">
                  <div className="sc-typing">
                    <div className="sc-dot" />
                    <div className="sc-dot" />
                    <div className="sc-dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Form Overlay */}
            {showFormOverlay && (
              <div className="sc-overlay-container">
                <div className="sc-overlay-header">
                  <h3>Book Free Consultation</h3>
                  <button className="sc-overlay-close" onClick={() => setShowFormOverlay(false)} aria-label="Close form">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="sc-overlay-content">
                  <form onSubmit={handleOverlayFormSubmit} className="sc-inline-form">
                    <div className="sc-form-field">
                      <label>Full Name</label>
                      <input type="text" name="name" required placeholder="John Doe" />
                    </div>
                    <div className="sc-form-field">
                      <label>Phone / WhatsApp</label>
                      <input type="tel" name="phone" required placeholder="+1 (555) 000-0000" />
                    </div>
                    <div className="sc-form-field">
                      <label>Email Address</label>
                      <input type="email" name="email" required placeholder="john@example.com" />
                    </div>
                    <div className="sc-form-field">
                      <label>Area of Concern</label>
                      <select name="concern" required>
                        <option value="Receding Hairline">Receding Hairline / Temples</option>
                        <option value="Thinning Crown">Thinning Crown / Vertex</option>
                        <option value="General Thinning">General Thinning</option>
                        <option value="Beard/Eyebrows">Beard or Eyebrow Restoration</option>
                      </select>
                    </div>
                    <button type="submit" className="sc-form-submit-btn">
                      Request Consultation
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="sc-input-bar">
              <input
                ref={inputRef}
                className="sc-input"
                type="text"
                placeholder="Type a message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                maxLength={500}
              />
              <button
                className="sc-send-btn"
                onClick={sendMessage}
                disabled={isTyping || !input.trim()}
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Proactive message */}
        {isVisible && showProactive && !proactiveDismissed && !isOpen && (
          <div className="sc-proactive" onClick={openChat}>
            👋 Need help? Let's talk!
          </div>
        )}

        {/* FAB */}
        {isVisible && (
          <button
            className="sc-fab"
            onClick={isOpen ? closeChat : openChat}
            aria-label={isOpen ? "Close chat" : "Open chat"}
          >
            {isOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <img src="/support_avatar.png" alt="Open chat" />
            )}
            {!isOpen && <div className="sc-fab-notification" />}
          </button>
        )}
      </div>
    </>
  );
}
