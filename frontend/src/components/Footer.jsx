import React from 'react';
import { Leaf } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-900 pb-8">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-brand-400 border border-brand-500/20">
              <Leaf className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-slate-200">EcoGuardian AI</span>
          </div>
          <p className="text-slate-400 text-sm max-w-md text-center md:text-right">
            EcoGuardian AI leverages advanced IBM & Google Gemini AI models to analyze environmental threats, predict severity, and recommend sustainable solutions to citizens.
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} EcoGuardian AI. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-slate-350 transition-colors">Privacy Policy</span>
            <span className="hover:text-slate-350 transition-colors">Terms of Service</span>
            <span className="hover:text-slate-350 transition-colors">Documentation</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
