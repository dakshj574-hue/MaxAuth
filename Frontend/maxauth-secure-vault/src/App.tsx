import { useState } from 'react';
import { 
  Fingerprint, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertTriangle, 
  KeyRound, 
  Wand2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type LoginMethod = 'password' | 'biometric' | 'magic';

export default function App() {
  const [method, setMethod] = useState<LoginMethod>('password');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#f9f9ff] font-['Inter'] text-[#141b2b] flex flex-col items-center justify-center p-6 selection:bg-[#b6c4ff] selection:text-[#00164e]">
      {/* Background Gradient Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#e1e8fd] rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-[#f1f3ff] rounded-full blur-[100px] opacity-50" />
      </div>

      <main className="relative w-full max-w-[540px] z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,35,111,0.05)] p-8 sm:p-12 relative overflow-hidden border border-white"
        >
          {/* Fingerprint Watermark */}
          <div className="absolute -top-16 -right-16 opacity-[0.03] pointer-events-none rotate-12">
            <Fingerprint size={320} strokeWidth={0.5} />
          </div>

          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10 relative">
            <div className="w-16 h-16 mb-6 flex items-center justify-center bg-[#f1f3ff] rounded-2xl shadow-inner">
              <img 
                alt="MaxAuth Logo" 
                className="w-10 h-10 object-contain" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBK1M-JhOChx8dRgF5_JeT3DCiqeI5NlJlM1d6OLZQpzJJE4ZNhrYFhr4msArd_LbptRPkURFocBZ_XCcvh0e4yz0fC-SWTn2Vn2x1scD3yDFTLq5bg_GQYhMr5vESw3hcvc9FXgHO3GLriq1RASdu_MDnJ1DrXz6DgpP1dIM0CTdte_ZrrSm3KzGzP1Iuy5kOCOL-D5APEyd1lQKivADvApDVfU2xKUnPNT6UrDfmK4lsIqhbphDa38rHibvOnHA1ehnYlvhp3KA"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="font-['Manrope'] text-[32px] font-extrabold text-[#00236f] tracking-tight mb-2">
              Welcome Back
            </h1>
            <p className="text-[#444651] text-sm text-center max-w-[280px] leading-relaxed font-medium opacity-80">
              Enter your credentials to access your secure vault.
            </p>
          </div>

          {/* Login Method Selector */}
          <div className="flex p-1.5 bg-[#f1f3ff] rounded-2xl mb-8 relative">
            <button 
              onClick={() => setMethod('password')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl transition-all duration-300 ${
                method === 'password' 
                  ? 'bg-white text-[#00236f] shadow-sm' 
                  : 'text-[#444651] hover:text-[#00236f]'
              }`}
            >
              <KeyRound size={16} strokeWidth={2.5} />
              Password
            </button>
            <button 
              onClick={() => setMethod('biometric')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl transition-all duration-300 ${
                method === 'biometric' 
                  ? 'bg-white text-[#00236f] shadow-sm' 
                  : 'text-[#444651] hover:text-[#00236f]'
              }`}
            >
              <Fingerprint size={16} strokeWidth={2.5} />
              Biometric
            </button>
            <button 
              onClick={() => setMethod('magic')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold rounded-xl transition-all duration-300 ${
                method === 'magic' 
                  ? 'bg-white text-[#00236f] shadow-sm' 
                  : 'text-[#444651] hover:text-[#00236f]'
              }`}
            >
              <Wand2 size={16} strokeWidth={2.5} />
              Magic Link
            </button>
          </div>

          {/* Alert Banner */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 flex items-start gap-3 p-4 bg-[#ffdad6]/40 rounded-2xl border border-[#ba1a1a]/10"
          >
            <AlertTriangle className="text-[#ba1a1a] shrink-0 mt-0.5" size={18} />
            <p className="text-xs font-semibold text-[#93000a] leading-relaxed">
              New login attempt detected from an unrecognized IP address.
            </p>
          </motion.div>

          {/* Form Content */}
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2.5">
              <label className="block text-[11px] uppercase tracking-[0.15em] font-extrabold text-[#775925] ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#757682] group-focus-within:text-[#00236f] transition-colors" size={18} />
                <input 
                  className="w-full pl-12 pr-4 py-4 bg-[#f1f3ff] border-none rounded-2xl focus:ring-2 focus:ring-[#775925]/10 focus:bg-white transition-all text-sm outline-none font-medium placeholder:text-[#757682]/60"
                  placeholder="admin@maxauth.network"
                  type="email"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center ml-1">
                <label className="block text-[11px] uppercase tracking-[0.15em] font-extrabold text-[#775925]">
                  Master Password
                </label>
                <a href="#" className="text-[11px] font-bold text-[#00236f] hover:text-[#775925] transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#757682] group-focus-within:text-[#00236f] transition-colors" size={18} />
                <input 
                  className="w-full pl-12 pr-12 py-4 bg-[#f1f3ff] border-none rounded-2xl focus:ring-2 focus:ring-[#775925]/10 focus:bg-white transition-all text-sm outline-none font-medium placeholder:text-[#757682]/60"
                  placeholder="••••••••••••"
                  type={showPassword ? "text" : "password"}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#757682] hover:text-[#00236f] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Attempt Counter */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-bold text-[#757682] uppercase tracking-[0.1em]">
                Attempt 1 of 5
              </span>
              <div className="flex gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#775925] shadow-sm" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#dce2f7]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#dce2f7]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#dce2f7]" />
              </div>
            </div>

            {/* Primary Action */}
            <button 
              className="w-full py-4.5 bg-gradient-to-br from-[#00236f] to-[#1e3a8a] text-white font-bold rounded-2xl shadow-[0_10px_25px_rgba(0,35,111,0.2)] hover:shadow-[0_15px_30px_rgba(0,35,111,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
            >
              <span>Continue to Vault</span>
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-10 text-center">
            <p className="text-sm text-[#444651] font-medium">
              Don't have an account? {' '}
              <a href="#" className="font-extrabold text-[#00236f] hover:underline underline-offset-4 decoration-[#775925] decoration-2">
                Register
              </a>
            </p>
          </div>
        </motion.div>

        {/* Security Badges Footer */}
        <footer className="mt-12 text-center space-y-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <span className="text-[10px] font-bold text-[#757682] uppercase tracking-[0.25em]">
              AES-256 ENCRYPTED
            </span>
            <div className="h-1.5 w-1.5 rounded-full bg-[#c5c5d3]" />
            <span className="text-[10px] font-bold text-[#757682] uppercase tracking-[0.25em]">
              ISO 27001 CERTIFIED
            </span>
            <div className="h-1.5 w-1.5 rounded-full bg-[#c5c5d3]" />
            <span className="text-[10px] font-bold text-[#757682] uppercase tracking-[0.25em]">
              SOC2 TYPE II
            </span>
          </div>
          <p className="text-[10px] font-bold text-[#c5c5d3] uppercase tracking-[0.1em]">
            © 2026 MaxAuth Security Systems. All nodes secured.
          </p>
        </footer>
      </main>
    </div>
  );
}
