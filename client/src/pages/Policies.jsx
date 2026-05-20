import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

export default function Policies() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8 md:p-12"
        >
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-neutral-100">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Privacy & Policies</h1>
              <p className="text-neutral-500 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="prose prose-neutral max-w-none">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2 mt-8 mb-4">
              <FileText className="w-5 h-5 text-teal-500" />
              1. Privacy Policy
            </h2>
            <p className="text-neutral-600 mb-4 leading-relaxed">
              At Schedulify, we take your privacy seriously. We collect minimal personal information necessary to provide our scheduling services. We do not sell your personal data to third parties. Data collected may include your name, email address, role, and schedule preferences, which are solely used to generate timetables and manage academic planning.
            </p>

            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2 mt-8 mb-4">
              <FileText className="w-5 h-5 text-teal-500" />
              2. Terms of Service
            </h2>
            <p className="text-neutral-600 mb-4 leading-relaxed">
              By using Schedulify, you agree to these Terms of Service. Schedulify is provided "as is" without warranty of any kind. We are not liable for any disruptions, delays, or errors in academic scheduling arising from the use of our software. You agree to use the platform only for its intended academic purposes.
            </p>

            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2 mt-8 mb-4">
              <FileText className="w-5 h-5 text-teal-500" />
              3. Data Security
            </h2>
            <p className="text-neutral-600 mb-4 leading-relaxed">
              We implement industry-standard security measures to protect your academic and personal information. All communications between your browser and our servers are securely encrypted.
            </p>

            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2 mt-8 mb-4">
              <FileText className="w-5 h-5 text-teal-500" />
              4. Contact Us
            </h2>
            <p className="text-neutral-600 mb-4 leading-relaxed">
              If you have any questions or concerns regarding our privacy practices or terms of service, please reach out via our contact page.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
