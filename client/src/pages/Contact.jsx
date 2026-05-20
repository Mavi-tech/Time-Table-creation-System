import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Clock, MessageSquare, Send } from 'lucide-react';
import BrandMark from '../components/BrandMark';
import { toast } from '../components/UI';

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function Contact() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const CONTACT_EMAIL = process.env.REACT_APP_CONTACT_EMAIL || '';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !message) return toast('Please fill all required fields', 'error');
    
    const targetEmail = "adityasdj05@gmail.com";
    const mailSubject = encodeURIComponent(subject || 'New Contact Request - Schedulify');
    const mailBody = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
    
    // Open Gmail directly in a new tab
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${targetEmail}&su=${mailSubject}&body=${mailBody}`;
    window.open(gmailUrl, '_blank');
    
    setName(''); setEmail(''); setSubject(''); setMessage('');
  }

  return (
    <div className="min-h-screen py-20 bg-[#f8fafc]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.header initial="hidden" animate="show" variants={fadeUp} className="text-center mb-12">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute w-44 h-44 rounded-full bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] opacity-10 blur-3xl" />
            <div className="relative z-10 flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-md">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#14b8a6] to-[#06b6d4] flex items-center justify-center text-white shadow-lg">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900">Get in Touch</h1>
          <p className="mt-3 text-neutral-600 max-w-2xl mx-auto">Have questions, feedback, or suggestions? We'd love to hear from you!</p>
        </motion.header>

        <motion.main initial="hidden" animate="show" variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <motion.div whileHover={{ y: -4 }} className="bg-white rounded-[20px] border border-neutral-100 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-neutral-900">Contact Information</h3>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-lg bg-[#ecfdf8] flex items-center justify-center text-[#0f766e]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-neutral-900">Email</div>
                    <div className="text-sm text-neutral-500">{CONTACT_EMAIL || 'adityasdj05@gmail.com'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-lg bg-[#ecfdf8] flex items-center justify-center text-[#0f766e]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-neutral-900">Response Time</div>
                    <div className="text-sm text-neutral-500">We typically respond within 24-48 hours</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} className="bg-white rounded-[20px] border border-neutral-100 shadow-sm p-6">
              <h3 className="text-xl font-semibold text-neutral-900">What can we help you with?</h3>
              <ul className="mt-4 text-neutral-600 list-disc pl-5 space-y-2">
                <li>Technical support</li>
                <li>Feature requests</li>
                <li>Bug reports</li>
                <li>General inquiries</li>
                <li>Partnership opportunities</li>
              </ul>
            </motion.div>
          </div>

          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="bg-white rounded-[20px] border border-neutral-100 shadow-sm p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg p-1 bg-white shadow-sm">
                <BrandMark size={36} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Send us a Message</h2>
                <p className="text-sm text-neutral-500">We'll get back to you as soon as we can.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700">Name</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className="mt-2 w-full rounded-lg border border-neutral-100 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-shadow" />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Email</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" className="mt-2 w-full rounded-lg border border-neutral-100 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-shadow" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-neutral-700">Subject</label>
                <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Short summary" className="mt-2 w-full rounded-lg border border-neutral-100 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-shadow" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-neutral-700">Message</label>
                <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={6} placeholder="Tell us more..." className="mt-2 w-full rounded-lg border border-neutral-100 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-shadow resize-none" />
              </div>
            </div>

            <div className="mt-6">
              <button type="submit" disabled={sending} className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-[#14b8a6] text-white font-semibold shadow hover:shadow-lg transform hover:-translate-y-0.5 transition-all">
                <Send className="w-4 h-4" />
                {sending ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </motion.form>
        </motion.main>
      </div>
    </div>
  );
}
