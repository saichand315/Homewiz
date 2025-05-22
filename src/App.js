import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const API_URL = 'https://project-xl9a.onrender.com/book';

const initialMessage = {
  role: 'assistant',
  text: "Hello! I'm your Lead-to-Lease Concierge. Let's get started."
};

const steps = [
  { key: 'name', question: "What's your name?" },
  {
    key: 'email',
    question: "What's your email address?",
    validate: (val) => /\S+@\S+\.\S+/.test(val),
    error: "Please enter a valid email address."
  },
  {
    key: 'phone',
    question: "What's your phone number?",
    validate: (val) => /^[0-9]{10}$/.test(val),
    error: "Enter a valid 10-digit phone number."
  },
  { key: 'moveIn', question: "When would you like to move in?" },
  {
    key: 'beds',
    question: "How many beds are you looking for?",
    validate: (val) => /^[0-9]+$/.test(val),
    error: "Please enter a valid number of beds."
  }
];

function App() {
  const [messages, setMessages] = useState([
    initialMessage,
    { role: 'assistant', text: steps[0].question }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [userInfo, setUserInfo] = useState({});
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
  
    const userMessage = { role: 'user', text: input.trim() };
    setMessages((msgs) => [...msgs, userMessage]);
  
    // During onboarding
    if (stepIndex !== null && stepIndex < steps.length) {
      const currentStep = steps[stepIndex];
      const value = input.trim();
  
      if (currentStep.validate && !currentStep.validate(value)) {
        setMessages((msgs) => [
          ...msgs,
          { role: 'assistant', text: currentStep.error }
        ]);
        setInput('');
        return;
      }
  
      const updatedInfo = { ...userInfo, [currentStep.key]: value };
      setUserInfo(updatedInfo);
      setInput('');
  
      if (stepIndex < steps.length - 1) {
        const nextStep = steps[stepIndex + 1];
        setStepIndex(stepIndex + 1);
        setMessages((msgs) => [
          ...msgs,
          { role: 'assistant', text: nextStep.question }
        ]);
        return;
      } else {
        setStepIndex(null); // Onboarding complete
        setMessages((msgs) => [
          ...msgs,
          { role: 'assistant', text: "✅ Your Unit Id is generated." },
          { role: 'assistant', text: "Do you want to book your tour? If yes, please confirm with 'book'." }
        ]);
        return;
      }
    }
  
    // Handle 'book' confirmation
    if (input.trim().toLowerCase() === 'book') {
      setInput('');
      setLoading(true);
      const unitId = Math.floor(Math.random() * 9890) + 10;
      const requestBody = {
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
        move_in_date: userInfo.moveIn,
        beds_wanted: Number(userInfo.beds),
        message: "book",
        unit_id: unitId,
      };
  
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
  
        if (!res.ok) throw new Error('API failed');
  
        setMessages((msgs) => [
          ...msgs,
          {
            role: 'assistant',
            text: '✅ Your booking request has been received. An email has been sent with the tour details. Thank you!'
          }
        ]);
      } catch (error) {
        console.error('Booking error:', error);
        setMessages((msgs) => [
          ...msgs,
          {
            role: 'assistant',
            text: '❌ Something went wrong while booking your tour. Please try again later.'
          }
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }
  
    // Fallback: General message handling
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text }),
      });
  
      if (!res.ok) throw new Error('General message failed');
      const data = await res.json();
  
      setMessages((msgs) => [
        ...msgs,
        { role: 'assistant', text: data.reply || 'No response.' },
      ]);
    } catch (e) {
      setMessages((msgs) => [
        ...msgs,
        { role: 'assistant', text: 'Oops, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading) sendMessage();
    }
  };

  return (
    <div className="login-container">
      <div className="page-container">
        <h1 className="text-white" style={{marginRight:"150px"}}>Welcome to Homewiz Take Home</h1>
        <div className="chat-box ">
          <div className="app-container">
            <header className="chat-header">
              <h1>Lead-to-Lease Chat Concierge</h1>
            </header>
            <main className="chat-window" aria-live="polite" aria-label="Chat conversation">
              {messages.map((m, i) => (
                <ChatBubble key={i} message={m} />
              ))}
              <div ref={bottomRef} />
            </main>

            <form
              className="input-area"
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading) sendMessage();
              }}
            >
              <textarea
                placeholder="Type your message here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                disabled={loading}
                aria-label="Chat message input"
              />
              <button type="submit" disabled={loading || !input.trim()}>
                {loading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`chat-bubble ${isUser ? 'user' : 'assistant'}`}>
      <p>{message.text}</p>
    </div>
  );
}

export default App;
