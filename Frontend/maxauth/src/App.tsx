/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Fingerprint, 
  User, 
  Phone, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield,
  ShieldCheck,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

// --- Dashboard Component ---
function Dashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-surface-lowest rounded-2xl shadow-card p-8 md:p-12 w-full flex flex-col items-center text-center"
    >
      <div className="bg-success/10 p-4 rounded-full mb-6 relative">
        <CheckCircle2 className="text-success" size={48} />
      </div>
      <h1 className="font-headline text-3xl font-extrabold text-primary mb-2">
        Dashboard Locked & Secured
      </h1>
      <p className="text-on-surface-variant mb-8 text-sm max-w-sm">
        You have successfully cleared the secure authentication gateway and accessed your private vault.
      </p>
      
      <div className="w-full bg-surface-low rounded-xl p-6 border border-outline-variant/20 mb-8 max-w-sm text-left shadow-inner">
        <p className="text-xs font-bold text-outline-variant uppercase tracking-widest mb-4">Security Status</p>
        <div className="flex items-center justify-between text-sm py-2 border-b border-outline-variant/10">
          <span className="text-primary font-bold">Network Connection</span>
          <span className="text-success font-bold flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-success"></div> Secured
          </span>
        </div>
        <div className="flex items-center justify-between text-sm py-2">
          <span className="text-primary font-bold">Auth Method</span>
          <span className="text-accent-gold font-bold">Verified</span>
        </div>
      </div>

      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onLogout}
        className="flex items-center gap-2 py-3 px-6 bg-error/10 text-error font-bold rounded-xl hover:bg-error/20 transition-all font-headline tracking-wide"
      >
        <LogOut size={18} />
        Sign Out Securely
      </motion.button>
    </motion.div>
  );
}

// --- Main App ---
export default function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form State
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [wantsFingerprint, setWantsFingerprint] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const getStrength = () => {
    if (password.length === 0) return 0;
    if (password.length < 6) return 1;
    if (password.length < 10) return 2;
    return 3;
  };

  const strength = getStrength();

  const handleLoginSubmit = async () => {
    // 1. Check if user exists and supports passkey
    const checkRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (!checkRes.ok) {
        throw new Error("Failed to check email state");
    }
    
    const checkData = await checkRes.json();
    if (!checkData.data?.exists) {
        throw new Error("Account not found");
    }

    // 2. Passkey Flow attempt
    if (checkData.data.loginMethods.includes('passkey')) {
        try {
            const optsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/passkey/login/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: checkData.data.userId })
            });
            const optsData = await optsRes.json();
            
            // Trigger browser biometric prompt
            const asseResp = await startAuthentication({ optionsJSON: optsData.data.options });
            
            const finRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/passkey/login/finish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: checkData.data.userId, response: asseResp })
            });
            
            if (!finRes.ok) {
                const errData = await finRes.json();
                throw new Error(errData.message);
            }
            
            const finData = await finRes.json();
            if (finData.data?.accessToken) {
               setSessionToken(finData.data.accessToken);
            }
            
            setIsLoggedIn(true);
            return;
        } catch(e: any) {
            console.warn("Passkey login cancelled or failed. Using password fallback...", e);
        }
    }

    // 3. Password Fallback
    if (!password) {
        throw new Error("Password is required to proceed without Fingerprint");
    }

    const loginRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
       throw new Error(loginData.message || 'Login failed');
    }
    
    if (loginData.data?.accessToken) {
       setSessionToken(loginData.data.accessToken);
    }
    
    setIsLoggedIn(true);
  };

  const handleRegisterSubmit = async () => {
    // 1. Standard registration
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password, phoneNumber })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    
    if (data.data?.accessToken) {
       setSessionToken(data.data.accessToken);
    }

    // 2. Fingerprint Enrollment if selected during registration
    if (wantsFingerprint) {
      try {
        const authHeaders = { Authorization: `Bearer ${data.data.accessToken}` };
        
        const optsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/passkey/register/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders }
        });
        const optsData = await optsRes.json();
        
        // Trigger browser biometric prompt
        const attResp = await startRegistration({ optionsJSON: optsData.data.options });
        
        const finRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/passkey/register/finish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify(attResp)
        });
        
        if (!finRes.ok) throw new Error("Verification failed at server");
        
      } catch (fpErr: any) {
        // We log the error but still let them in, since their account was created!
        console.warn("Fingerprint enrollment failed or cancelled by user", fpErr);
        alert("Account created, but fingerprint registration was skipped.");
      }
    }
    
    // Switch to Dashboard
    setIsLoggedIn(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await handleLoginSubmit();
      } else {
        await handleRegisterSubmit();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoggedIn) {
     window.location.href = `http://localhost:3001?access_token=${sessionToken}`;
     return (
       <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
         {/* Decorative Watermarks */}
         <div className="absolute -top-48 -left-48 opacity-[0.02] pointer-events-none">
           <Shield size={600} />
         </div>
         <main className="w-full max-w-xl z-10 flex flex-col items-center text-center">
           <div className="bg-surface-lowest rounded-2xl shadow-card p-8 md:p-12 w-full">
              <div className="flex justify-center mb-6">
                <div className="bg-success/10 p-4 rounded-full">
                  <CheckCircle2 className="text-success" size={48} />
                </div>
              </div>
              <h1 className="font-headline text-2xl font-bold text-primary mb-4">Authentication Successful</h1>
              <p className="text-on-surface-variant">Redirecting you to the MaxAuth Security Dashboard...</p>
              <p className="text-xs text-outline mt-4">If nothing happens, ensure the dashboard is running and navigate to <a href="http://localhost:3001" className="text-primary underline">http://localhost:3001</a></p>
           </div>
         </main>
       </div>
     );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Decorative Watermarks */}
      <div className="absolute -top-24 -left-24 opacity-[0.03] pointer-events-none">
        <Fingerprint size={400} />
      </div>
      <div className="absolute -bottom-24 -right-24 opacity-[0.03] pointer-events-none">
        <Shield size={400} />
      </div>

      <main className="w-full max-w-xl z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-surface-lowest rounded-2xl shadow-card p-8 md:p-12 flex flex-col items-center"
        >
          {/* Brand Anchor */}
          <div className="mb-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-primary p-3 rounded-lg shadow-sm">
                <ShieldCheck className="text-white" size={32} />
              </div>
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-3">
              {isLogin ? 'Sign In Securely' : 'Create Secure Account'}
            </h1>
            <p className="text-on-surface-variant text-sm md:text-base">
              {isLogin ? 'Welcome back to the secure vault.' : 'Join the most advanced authentication platform.'}
            </p>
          </div>

          {/* Form */}
          <form className="w-full space-y-6" onSubmit={handleSubmit}>
            {error && (() => {
              let errorText = error;
              let colorClasses = "bg-error/10 border-error/20 text-error"; // default Strong Red

              if (error.includes('3 attempt(s) remaining')) {
                errorText = "Invalid credentials, three more tries left";
                colorClasses = "bg-yellow-500/10 border-yellow-500/40 text-yellow-500"; // Yellow
              } else if (error.includes('2 attempt(s) remaining')) {
                errorText = "Invalid credentials, two tries left";
                colorClasses = "bg-orange-500/10 border-orange-500/40 text-orange-500"; // Yellowish-Red
              } else if (error.includes('1 attempt(s) remaining')) {
                errorText = "Invalid credentials, one attempt left";
                colorClasses = "bg-red-500/10 border-red-500/40 text-red-500"; // Bright Red
              } else if (error.toLowerCase().includes('locked')) {
                errorText = "Account temporarily locked";
                colorClasses = "bg-red-700/10 border-red-700/40 text-red-700"; // Strong Red
              }

              return (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("p-4 border rounded-xl text-sm font-bold text-center transition-colors duration-300", colorClasses)}
                >
                  {errorText}
                </motion.div>
              );
            })()}

            {!isLogin && (
              <>
                {/* Username */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-accent-gold mb-1 ml-1">
                    Username
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                      <User size={20} />
                    </div>
                    <input 
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. secure_admin"
                      className="w-full pl-12 pr-4 py-4 bg-surface-low border-none rounded-xl text-primary placeholder-outline focus:ring-2 focus:ring-accent-gold/30 transition-all duration-200 outline-none"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-accent-gold mb-1 ml-1">
                    Phone Number
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                      <Phone size={20} />
                    </div>
                    <input 
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="10-digit number"
                      className="w-full pl-12 pr-4 py-4 bg-surface-low border-none rounded-xl text-primary placeholder-outline focus:ring-2 focus:ring-accent-gold/30 transition-all duration-200 outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-accent-gold mb-1 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                  <Mail size={20} />
                </div>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@maxauth.com"
                  className="w-full pl-12 pr-4 py-4 bg-surface-low border-none rounded-xl text-primary placeholder-outline focus:ring-2 focus:ring-accent-gold/30 transition-all duration-200 outline-none"
                />
              </div>
            </div>

            {/* Password with Strength Meter */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-accent-gold mb-1 ml-1">
                {isLogin ? "Fallback Password" : "Password"}
              </label>
              <div className="relative group flex items-center">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                  <Lock size={20} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  required={!isLogin} // Password loosely required on login bcz fingerprint triggers first
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? "Required if Passkey fails" : "Min. 8 characters"}
                  className="w-full pl-12 pr-12 py-4 bg-surface-low border-none rounded-xl text-primary placeholder-outline focus:ring-2 focus:ring-accent-gold/30 transition-all duration-200 outline-none"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Password Strength Meter - Only show on Register */}
              {!isLogin && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
                      Security Strength
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-tighter transition-colors duration-300",
                      strength === 0 ? "text-outline" :
                      strength === 1 ? "text-error" :
                      strength === 2 ? "text-warning" : "text-success"
                    )}>
                      {strength === 0 ? "None" : strength === 1 ? "Weak" : strength === 2 ? "Medium" : "High (Encrypted)"}
                    </span>
                  </div>
                  <div className="flex gap-1.5 h-1.5">
                    <div className={cn("flex-1 rounded-full transition-all duration-500", strength >= 1 ? "bg-error" : "bg-outline-variant/30")} />
                    <div className={cn("flex-1 rounded-full transition-all duration-500", strength >= 2 ? "bg-warning" : "bg-outline-variant/30")} />
                    <div className={cn("flex-1 rounded-full transition-all duration-500", strength >= 3 ? "bg-success" : "bg-outline-variant/30")} />
                    <div className={cn("flex-1 rounded-full transition-all duration-500", strength >= 4 ? "bg-primary" : "bg-outline-variant/30")} />
                  </div>
                </div>
              )}
            </div>

            {/* Biometric Enrollment Toggle - Only show on Register as per user request */}
            {!isLogin && (
              <div className="pt-2">
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={() => setWantsFingerprint(!wantsFingerprint)}
                  className={cn(
                    "group w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 shadow-sm",
                    wantsFingerprint ? "bg-primary text-white border-primary shadow-md" : "bg-surface-lowest border-outline-variant/20 hover:border-accent-gold/30"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
                      wantsFingerprint ? "bg-white/20 text-white" : "bg-surface-low text-primary"
                    )}>
                      {wantsFingerprint ? <CheckCircle2 size={24} /> : <Fingerprint size={24} />}
                    </div>
                    <div className="text-left">
                      <p className={cn("text-sm font-bold transition-colors", wantsFingerprint ? "text-white" : "text-primary")}>
                        {wantsFingerprint ? "Fingerprint Enabled" : "Add Fingerprint"}
                      </p>
                      <p className={cn("text-[11px] transition-colors leading-tight mt-0.5", wantsFingerprint ? "text-white/80" : "text-on-surface-variant")}>
                        {wantsFingerprint ? "Will prompt automatically securely" : "Recommended for WebAuthn passkey login"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Indicator Dots */}
                  {!wantsFingerprint && (
                    <div className="flex items-center gap-1 opacity-60">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent-gold/40" />
                      <div className="h-1.5 w-1.5 rounded-full bg-accent-gold/60" />
                      <div className="h-1.5 w-1.5 rounded-full bg-accent-gold" />
                    </div>
                  )}
                </motion.button>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <motion.button 
                whileHover={{ scale: 1.01, boxShadow: "0 10px 20px -5px rgba(197, 160, 101, 0.2)" }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-4 px-6 bg-vault-gradient text-white font-headline font-bold text-lg rounded-xl shadow-lg transition-all duration-200",
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                )}
              >
                {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register Account')}
              </motion.button>
            </div>
          </form>

          {/* Sign In / Register Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-on-surface-variant">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button 
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="font-bold text-primary hover:text-accent-gold transition-colors underline-offset-4 hover:underline"
              >
                {isLogin ? "Create one" : "Sign In"}
              </button>
            </p>
          </div>
        </motion.div>

        {/* Trust Footer */}
        <footer className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary font-headline">SOC2 Compliant</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary font-headline">AES-256 Bit</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary font-headline">Fido2 Certified</span>
          </div>
          <p className="text-[11px] text-outline max-w-sm mx-auto leading-relaxed">
            By {isLogin ? 'signing in' : 'registering'}, you agree to our <a href="#" className="underline hover:text-primary transition-colors">Terms of Service</a> and <a href="#" className="underline hover:text-primary transition-colors">Privacy Architecture</a>. MaxAuth uses enterprise-grade WebAuthn for secure passkeys.
          </p>
        </footer>
      </main>
    </div>
  );
}
