import React, { useState } from 'react';
import { Truck, ShieldCheck, BarChart3, MapPin, ArrowRight, ChevronRight, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface LandingPageProps {
  onLogin: (user: User) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await api.auth.login(username, password);
      onLogin(user);
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navigation */}
      <nav className="fixed w-full z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
               <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl shadow-md">
                  <div className="absolute inset-0 rounded-xl border border-white/20"></div>
                  <span className="font-display font-bold text-white text-lg tracking-tight">LT</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-2xl font-display font-bold text-slate-900 leading-none tracking-wide">
                   LALANI
                 </span>
                 <span className="text-xs font-bold text-brand-600 tracking-[0.2em] uppercase">Traders</span>
               </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">About Us</a>
              <a href="#services" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">Services</a>
              <a href="#coverage" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">Coverage</a>
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-full font-medium transition-all shadow-lg shadow-brand-500/30 flex items-center"
              >
                Portal Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0 opacity-40">
           {/* Placeholder for background video/image */}
           <img 
            src="https://images.unsplash.com/photo-1578844251758-2f71da645217?q=80&w=2070&auto=format&fit=crop" 
            alt="Tire Warehouse" 
            className="w-full h-full object-cover"
           />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent z-10"></div>
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:w-2/3">
            <h1 className="text-5xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight">
              Moving Sindh Forward <br/>
              <span className="text-brand-500">One Wheel at a Time</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl leading-relaxed">
              Lalani Traders is the premier tire and tube distribution network serving vendors across Karachi, Hyderabad, Sukkur, and beyond. We connect global brands with local mobility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg shadow-brand-600/40 flex items-center justify-center"
              >
                Access Dealer Portal
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
              <a 
                href="#contact"
                className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 px-8 py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center"
              >
                Become a Partner
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-brand-600 font-bold tracking-wide uppercase text-sm mb-3">Why Choose Us</h2>
            <h3 className="text-4xl font-display font-bold text-slate-900">Driven by Efficiency</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all border border-slate-100 group">
              <div className="w-14 h-14 bg-brand-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Truck className="w-7 h-7 text-brand-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Province-Wide Logistics</h4>
              <p className="text-slate-600 leading-relaxed">
                Our fleet ensures timely deliveries to every district in Sindh, from the bustling streets of Karachi to the remote hubs of Tharparkar.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all border border-slate-100 group">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Genuine Products</h4>
              <p className="text-slate-600 leading-relaxed">
                Authorized distributor for top global and local tire brands. Guaranteed authenticity with every tube and tire supplied.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all border border-slate-100 group">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7 text-emerald-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Smart Management</h4>
              <p className="text-slate-600 leading-relaxed">
                Our state-of-the-art digital platform allows vendors to track inventory, manage invoices, and view ledgers in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-display font-bold text-brand-500 mb-2">500+</div>
              <div className="text-slate-400">Registered Vendors</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-display font-bold text-brand-500 mb-2">12k</div>
              <div className="text-slate-400">Monthly Deliveries</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-display font-bold text-brand-500 mb-2">24</div>
              <div className="text-slate-400">Districts Covered</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-display font-bold text-brand-500 mb-2">24/7</div>
              <div className="text-slate-400">Support System</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
             <div className="flex items-center gap-3 mb-4">
               <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl shadow-lg border border-white/5">
                  <span className="font-display font-bold text-white text-lg tracking-tight">LT</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-2xl font-display font-bold text-white leading-none tracking-wide">
                   LALANI
                 </span>
                 <span className="text-xs font-bold text-brand-500 tracking-[0.2em] uppercase">Traders</span>
               </div>
            </div>
            <p className="mt-2 text-sm max-w-xs">
              Empowering local businesses with reliable distribution networks.
            </p>
          </div>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Support</a>
          </div>
          <div className="mt-6 md:mt-0 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-brand-500" />
            <span>Head Office: Plot 44, SITE Area, Karachi</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-slate-900 text-center text-xs">
          &copy; 2023 Lalani Traders. All rights reserved.
        </div>
      </footer>

      {/* Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
             <div className="p-8">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h2 className="text-2xl font-display font-bold text-slate-900">Welcome Back</h2>
                   <p className="text-slate-500 text-sm mt-1">Sign in to access your distribution dashboard.</p>
                 </div>
                 <button onClick={() => setIsLoginOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                   <X className="w-6 h-6" />
                 </button>
               </div>

               {error && (
                 <div className="mb-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {error}
                 </div>
               )}

               <form onSubmit={handleLoginSubmit} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                   <input 
                     type="text" 
                     className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 py-2.5 px-3 border"
                     placeholder="Enter your username"
                     value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     required
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                   <input 
                     type="password" 
                     className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 py-2.5 px-3 border"
                     placeholder="••••••••"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     required
                   />
                 </div>
                 
                 <div className="pt-2">
                   <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-brand-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                   >
                     {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     ) : (
                        <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>
                     )}
                   </button>
                 </div>
               </form>

               <div className="mt-6 text-center text-xs text-slate-400">
                 <p>Protected by secure encryption. <br/> Access restricted to authorized personnel only.</p>
               </div>
             </div>
             <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
                <span className="text-sm text-slate-600">Don't have an account? </span>
                <a href="#contact" onClick={() => setIsLoginOpen(false)} className="text-sm font-bold text-brand-600 hover:text-brand-700">Contact Admin</a>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;