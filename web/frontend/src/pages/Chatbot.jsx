import React, { useState, useEffect, useRef } from 'react';
import GlassCard from '../components/GlassCard';
import API from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { FaRobot, FaMicrophone, FaMicrophoneSlash, FaVolumeUp, FaVolumeMute, FaPaperPlane, FaUser } from 'react-icons/fa';

const Chatbot = () => {
  const { addListener, removeListener } = useSocket();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition & Synthesis Voices
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = 'en-US';
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev + ' ' + transcript);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        const savedVoice = localStorage.getItem('preferred_voice');
        if (savedVoice && availableVoices.some(v => v.name === savedVoice)) {
          setSelectedVoice(savedVoice);
        } else if (availableVoices.length > 0) {
          const englishVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
          setSelectedVoice(englishVoice.name);
        }
      }
    };

    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Fetch chat history
  const loadChatHistory = async () => {
    try {
      const res = await API.get('/chatbot');
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Error fetching chat history:', err.message);
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice output (TTS) helper
  const speakText = (text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    // Cancel previous speaking
    window.speechSynthesis.cancel();
    
    // Clean markdown before speaking
    const cleanText = text.replace(/[*#_`-]/g, ' ').replace(/Disclaimer:[\s\S]*/gi, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    if (selectedVoice) {
      const voiceObj = voices.find(v => v.name === selectedVoice);
      if (voiceObj) {
        utterance.voice = voiceObj;
      }
    }

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');
    setLoading(true);

    // Optimistically add user message to list
    const tempUserMsg = {
      id: Date.now().toString(),
      sender: 'user',
      message: userMessage,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await API.post('/chatbot', { message: userMessage });
      if (res.data.success) {
        const assistantMsg = res.data.assistantMessage;
        setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), res.data.userMessage, assistantMsg]);
        
        // Trigger voice reply if not muted
        speakText(assistantMsg.message);
      }
    } catch (err) {
      console.error('Error sending message:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleVoiceChange = (e) => {
    const voiceName = e.target.value;
    setSelectedVoice(voiceName);
    localStorage.setItem('preferred_voice', voiceName);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      
      {/* Title & Controls Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-extrabold font-sans">AI Endocrinology Advisor</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Consult DiaPredict AI on diet modifications, glucose spikes, and personalized lifestyle adjustments.
          </p>
        </div>
        
        {/* Speaker control button and voice selector */}
        <div className="flex items-center space-x-3 self-end md:self-center">
          {'speechSynthesis' in window && voices.length > 0 && (
            <select
              value={selectedVoice}
              onChange={handleVoiceChange}
              className="glass-input text-xs py-2 px-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/50 max-w-[200px]"
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={toggleMute}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
              isMuted 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20' 
                : 'bg-primary-500/10 border-primary-500/20 text-primary-500 hover:bg-primary-500/20'
            }`}
            title={isMuted ? 'Unmute Assistant Voice' : 'Mute Assistant Voice'}
          >
            {isMuted ? <FaVolumeMute className="text-base" /> : <FaVolumeUp className="text-base" />}
          </button>
        </div>
      </div>

      {/* Main chat window card */}
      <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden border border-slate-200/50 dark:border-slate-800/40 relative">
        
        {/* Chatbot Profile Card */}
        <div className="flex items-center space-x-3 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-200/30 dark:border-slate-800/30">
          <div className="p-2.5 bg-gradient-to-tr from-primary-500 to-emerald-600 rounded-xl text-white shadow-md shadow-primary-500/10">
            <FaRobot className="text-lg animate-pulse" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">DiaPredict AI Bot</h3>
            <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-extrabold flex items-center space-x-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Online • Clinical Specialist</span>
            </span>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-4 py-10">
              <div className="p-4 bg-primary-500/5 rounded-full text-primary-500">
                <FaRobot className="text-4xl" />
              </div>
              <h4 className="font-bold text-sm">Start Your Health Chat</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                "Hello Siva, I am DiaPredict. You can ask me questions like 'Should I avoid mangoes?' or ask for a metabolic assessment based on your stats."
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div 
                key={msg.id || index}
                className={`flex w-full items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant avatar */}
                {msg.sender === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-500 to-emerald-500 flex items-center justify-center text-white text-xs shadow-sm font-bold">
                    AI
                  </div>
                )}
                
                {/* Speech Bubble */}
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed text-left border relative whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-primary-500 to-emerald-600 border-primary-500/20 text-white rounded-tr-none shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/40 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm shadow-black/5'
                  }`}
                >
                  {msg.message}
                </div>

                {/* User avatar */}
                {msg.sender === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs shadow-sm">
                    <FaUser />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Typing state */}
          {loading && (
            <div className="flex items-start space-x-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                AI
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl rounded-tl-none px-4 py-3.5 shadow-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar Form */}
        <form 
          onSubmit={handleSendMessage}
          className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200/30 dark:border-slate-800/30 flex items-center space-x-3"
        >
          {/* Audio Input (Speech Recognition) button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-xl border flex items-center justify-center active:scale-95 transition-all ${
              isListening 
                ? 'bg-rose-500 text-white border-rose-500 animate-pulse shadow-md shadow-rose-500/20' 
                : 'bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
            title={isListening ? 'Stop Listening' : 'Voice Input (STT)'}
          >
            {isListening ? <FaMicrophoneSlash className="text-sm" /> : <FaMicrophone className="text-sm" />}
          </button>

          {/* Prompt input box */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            placeholder={isListening ? 'Listening... speak clearly' : 'Ask about meal glycemic ratings, glucose alerts...'}
            className="flex-1 glass-input py-3"
          />

          {/* Send message button */}
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="btn-primary p-3 rounded-xl flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all shadow-md shadow-primary-500/10"
          >
            <FaPaperPlane className="text-sm" />
          </button>
        </form>

      </GlassCard>
    </div>
  );
};

export default Chatbot;
