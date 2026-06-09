import SahilCoChatbot from '../SahilCoChatbot.jsx'

export default function App() {
  return (
    <>
      {/* Your page content goes here */}
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <h1 style={{ color: '#0F172A', fontSize: '2rem', fontWeight: 700 }}>
          Sahil & Co. — Chatbot Demo
        </h1>
      </div>

      {/* Chatbot widget */}
      <SahilCoChatbot />
    </>
  )
}
