import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaPaperPlane } from 'react-icons/fa';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');

    // Simulate message sending
    setTimeout(() => {
      setLoading(false);
      setSuccess('Message sent successfully! Our clinical support team will respond within 24 hours.');
      setName('');
      setEmail('');
      setMessage('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold font-sans">Contact Clinical Support</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Get in touch with our tech support or clinical assistant team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        
        {/* Left column: Contact info */}
        <div className="space-y-6 text-left">
          <GlassCard className="space-y-4">
            <h3 className="font-bold text-sm text-primary-500">Support Details</h3>
            
            <div className="space-y-3.5 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-3">
                <FaEnvelope className="text-slate-400 flex-shrink-0" />
                <span>support@diapredict.ai</span>
              </div>
              <div className="flex items-center space-x-3">
                <FaPhone className="text-slate-400 flex-shrink-0" />
                <span>+1 (555) 234-5678</span>
              </div>
              <div className="flex items-center space-x-3">
                <FaMapMarkerAlt className="text-slate-400 flex-shrink-0" />
                <span>Healthcare Tech Center, San Francisco, CA</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right column: Form */}
        <div className="md:col-span-2 text-left">
          <GlassCard>
            <h3 className="font-bold text-sm mb-4">Send a Support Ticket</h3>
            
            {success && (
              <div className="p-3 mb-4 text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="glass-input"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="johndoe@example.com"
                  className="glass-input"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 pl-1">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your query or issue..."
                  rows={4}
                  className="glass-input resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <FaPaperPlane className="text-xs" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </GlassCard>
        </div>

      </div>

    </div>
  );
};

export default Contact;
