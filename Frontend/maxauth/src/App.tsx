/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
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
  LogOut,
  ArrowLeft,
  Wand2,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

import SecurityDashboard from './components/SecurityDashboard';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState('');
  
  // Adaptive Flow States
  const [step, setStep] = useState(1); // 1: Email, 2: Choose Method, 3: Input Auth, 4: Passkey Enrollment Prompt
  const [activeMethod, setActiveMethod] = useState(''); // 'password', 'otp', 'register'
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  
  // Form State
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Magic Link Interceptor
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const magicToken = urlParams.get('magic_token');

    if (magicToken) {
      setIsLoading(true);
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/verify-magiclink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: magicToken })
      })
      .then(res => Promise.all([res.ok, res.json()]))
      .then(([ok, data]) => {
        if (!ok) throw new Error(data.message || 'Invalid magic link');
        if (data.data?.accessToken) setSessionToken(data.data.accessToken);
        if (data.data?.user) setCurrentUser(data.data.user);
        setIsLoggedIn(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setIsLoading(false));
    }
  }, []);

  const getStrength = () => {
    if (password.length === 0) return 0;
    if (password.length < 6) return 1;
    if (password.length < 10) return 2;
    return 3;
  };

  const checkEmailState = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError('Email is required');
    setError('');
    setIsLoading(true);

    try {
      const checkRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const checkData = await checkRes.json();
      if (!checkRes.ok) throw new Error(checkData.message);

      if (checkData.data.exists) {
        setAvailableMethods(checkData.data.loginMethods || []);
        setStep(2); // Ask for method
      } else {
        setActiveMethod('register');
        setStep(3); // Start registration
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const loginRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.message || 'Login failed');
      
      if (loginData.data?.accessToken) setSessionToken(loginData.data.accessToken);
      if (loginData.data?.user) setCurrentUser(loginData.data.user);

      if (!availableMethods.includes('passkey')) {
        setStep(4); // Prompt passkey setup
      } else {
        setIsLoggedIn(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const checkRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const checkData = await checkRes.json();
      
      const optsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/passkey/login/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: checkData.data.userId })
      });
      const optsData = await optsRes.json();
      
      const asseResp = await startAuthentication({ optionsJSON: optsData.data.options });
      
      const finRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/passkey/login/finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: checkData.data.userId, response: asseResp })
      });
      
      const finData = await finRes.json();
      if (!finRes.ok) throw new Error(finData.message);
      
      if (finData.data?.accessToken) {
          setSessionToken(finData.data.accessToken);
          const userRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/me`, {
            headers: { Authorization: `Bearer ${finData.data.accessToken}` }
          });
          const userData = await userRes.json();
          if (userData.data?.user) setCurrentUser(userData.data.user);
      }
      setIsLoggedIn(true);
    } catch(e: any) {
      setError("Passkey sequence failed. " + (e.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const sendMagicLink = async () => {
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/send-magiclink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send magic link');
      setError("MAGIC LINK SENT! Check your real inbox.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtpRequest = async () => {
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      
      setActiveMethod('otp');
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return setError("Please enter the full 6-digit code");
    
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Verification failed');
      
      if (data.data?.accessToken) setSessionToken(data.data.accessToken);
      if (data.data?.user) setCurrentUser(data.data.user);

      if (!availableMethods.includes('passkey')) {
        setStep(4);
      } else {
        setIsLoggedIn(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, phoneNumber })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      
      if (data.data?.accessToken) setSessionToken(data.data.accessToken);
      if (data.data?.user) setCurrentUser(data.data.user);

      setStep(4); // Enroll passkey step
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const enrollPasskey = async () => {
    setIsLoading(true);
    try {
      const authHeaders = { Authorization: `Bearer ${sessionToken}` };
      const optsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/passkey/register/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders }
      });
      const optsData = await optsRes.json();
      
      const attResp = await startRegistration({ optionsJSON: optsData.data.options });
      
      const finRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/passkey/register/finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(attResp)
      });
      
      if (!finRes.ok) throw new Error("Verification failed at server");
      setIsLoggedIn(true);
    } catch (err: any) {
       console.warn("Passkey failed:", err);
       alert("Passkey setup cancelled or failed. You are still logged in natively.");
       setIsLoggedIn(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Input OTP handler
  const handleOtpChange = (index: number, val: string) => {
    if (isNaN(Number(val))) return;
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    if (val && index < 5) {
       inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  if (isLoggedIn) {
     return <SecurityDashboard onLogout={() => { setIsLoggedIn(false); setStep(1); }} user={currentUser} token={sessionToken} />;
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

      <main className="w-full max-w-[480px] z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-lowest rounded-[2rem] shadow-card px-8 py-10 flex flex-col items-center border border-outline-variant/10"
        >
          {step > 1 && step < 4 && (
             <button 
               onClick={() => { setStep(step - 1); setError(''); }} 
               className="self-start -ml-2 mb-4 p-2 text-outline hover:text-primary transition-colors hover:bg-surface-low rounded-full"
             >
               <ArrowLeft size={20} />
             </button>
          )}

          <div className="mb-8 text-center mt-2">
            <div className="flex justify-center mb-5">
              <div className="bg-primary/10 p-4 rounded-2xl shadow-sm border border-primary/20">
                {step === 4 ? <Fingerprint className="text-primary" size={32} /> : <ShieldCheck className="text-primary" size={32} />}
              </div>
            </div>
            <h1 className="font-headline text-3xl font-extrabold text-primary tracking-tight mb-2">
              {step === 1 && 'Welcome to MaxAuth'}
              {step === 2 && 'Verify Your Identity'}
              {step === 3 && activeMethod === 'register' && 'Complete Profile'}
              {step === 3 && activeMethod === 'otp' && 'Enter 6-Digit Code'}
              {step === 3 && activeMethod === 'password' && 'Enter Password'}
              {step === 4 && 'Upgrade Security'}
            </h1>
            <p className="text-on-surface-variant font-medium text-sm">
              {step === 1 && 'Enter your email to sign in or create an account.'}
              {step === 2 && `We found an account for \n${email}`}
              {step === 3 && activeMethod === 'otp' && `Code sent to ${email}`}
              {step === 4 && 'We highly recommend setting up a biometric passkey for future 1-click logins.'}
            </p>
          </div>

          <div className="w-full">
            {error && (() => {
               let errorText = error;
               let colorClasses = "bg-error/10 border-error/20 text-error";
               if (error.includes('3 attempt(s) remaining')) { colorClasses = "bg-warning/10 text-warning"; }
               if (error.includes('Too many failed')) { errorText = "Account temporarily locked."; colorClasses = "bg-error/20 text-error"; }
               return (
                 <div className={cn("p-4 mb-6 border rounded-xl text-sm font-bold text-center", colorClasses)}>
                   {errorText}
                 </div>
               );
            })()}

            {/* STEP 1: INITIAL EMAIL */}
            {step === 1 && (
              <form onSubmit={checkEmailState} className="space-y-6">
                <div className="space-y-2">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                      <Mail size={20} />
                    </div>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" 
                      className="w-full pl-12 pr-4 py-4 bg-surface-low rounded-xl text-primary font-medium focus:ring-2 focus:ring-accent outline-none transition-all" />
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-4 bg-primary hover:bg-primary-container text-white font-bold rounded-xl shadow-lg transition-colors">
                  {isLoading ? 'Scanning Vault...' : 'Continue Securely'}
                </button>
              </form>
            )}

            {/* STEP 2: CHOOSE METHOD */}
            {step === 2 && (
              <div className="space-y-3">
                {availableMethods.includes('passkey') && (
                  <button onClick={handlePasskeyLogin} className="w-full p-4 flex items-center gap-4 bg-primary text-white font-bold rounded-xl shadow-md hover:-translate-y-0.5 transition-all">
                    <Fingerprint size={24} /> Sign in with Passkey
                  </button>
                )}
                <button onClick={sendOtpRequest} className="w-full p-4 flex items-center gap-4 bg-surface-low border border-outline-variant/30 text-primary font-bold rounded-xl hover:border-accent hover:bg-surface-lowest transition-all">
                  <Mail size={24} className="text-accent" /> Send 6-Digit OTP via Email
                </button>
                <button onClick={sendMagicLink} className="w-full p-4 flex items-center gap-4 bg-surface-low border border-outline-variant/30 text-primary font-bold rounded-xl hover:border-accent hover:bg-surface-lowest transition-all">
                  <Wand2 size={24} className="text-secondary" /> Send Magic Login Link
                </button>
                <button onClick={() => { setActiveMethod('password'); setStep(3); }} className="w-full p-4 flex items-center gap-4 bg-surface-low border border-outline-variant/30 text-primary font-bold rounded-xl hover:border-accent hover:bg-surface-lowest transition-all">
                  <KeyRound size={24} className="text-outline" /> Sign in with Password
                </button>
              </div>
            )}

            {/* STEP 3: INPUT */}
            {step === 3 && activeMethod === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-8 flex flex-col items-center">
                <div className="flex justify-between w-full max-w-[320px] gap-2">
                  {otp.map((digit, i) => (
                    <input key={i} ref={(el) => (inputRefs.current[i] = el)} type="text" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-2xl font-black bg-surface-low border border-outline-variant/30 rounded-xl text-primary focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all focus:-translate-y-1 shadow-sm"
                    />
                  ))}
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-4 bg-vault-gradient text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
                  {isLoading ? 'Verifying Envelope...' : 'Verify Identity'}
                </button>
              </form>
            )}

            {step === 3 && activeMethod === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-6">
                <div className="relative group flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-outline"><Lock size={20} /></div>
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Vault Password"
                    className="w-full pl-12 pr-12 py-4 bg-surface-low rounded-xl text-primary focus:ring-2 focus:ring-accent outline-none" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-outline"><Eye size={20} /></button>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-4 bg-vault-gradient text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
                  {isLoading ? 'Decrypting...' : 'Unlock Account'}
                </button>
              </form>
            )}

            {step === 3 && activeMethod === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="relative"><User className="absolute top-4 left-4 text-outline" size={20}/><input type="text" required value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Username" className="w-full pl-12 p-4 bg-surface-low rounded-xl" /></div>
                <div className="relative"><Phone className="absolute top-4 left-4 text-outline" size={20}/><input type="tel" value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} placeholder="Phone Number" className="w-full pl-12 p-4 bg-surface-low rounded-xl" /></div>
                <div className="relative">
                  <Lock className="absolute top-4 left-4 text-outline" size={20}/>
                  <input type={showPassword?"text":"password"} required value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Master Password" className="w-full pl-12 pr-12 p-4 bg-surface-low rounded-xl focus:ring-2 focus:ring-accent" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-4 right-4 text-outline"><Eye size={20}/></button>
                </div>
                {/* password meter */}
                <div className="flex gap-1 pt-1">
                   <div className={cn("h-1 flex-1 rounded-full", getStrength()>=1?"bg-error":"bg-outline-variant/30")}/>
                   <div className={cn("h-1 flex-1 rounded-full", getStrength()>=2?"bg-warning":"bg-outline-variant/30")}/>
                   <div className={cn("h-1 flex-1 rounded-full", getStrength()>=3?"bg-success":"bg-outline-variant/30")}/>
                </div>
                <button type="submit" disabled={isLoading} className="w-full mt-4 py-4 bg-primary text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all">
                  {isLoading ? 'Provisioning Vault...' : 'Create Secure Profile'}
                </button>
              </form>
            )}

            {/* STEP 4: PASSKEY ENROLLMENT AFTER SUCCESS */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <button onClick={enrollPasskey} disabled={isLoading} className="w-full p-4 flex items-center justify-center gap-3 bg-secondary text-white font-bold rounded-xl shadow-lg hover:bg-accent hover:-translate-y-1 transition-all">
                  <Fingerprint size={20} /> Register Secure Passkey
                </button>
                <button onClick={() => setIsLoggedIn(true)} className="w-full p-4 text-outline hover:text-primary font-bold rounded-xl transition-all">
                  Skip for now
                </button>
              </div>
            )}
            
          </div>
        </motion.div>
      </main>
    </div>
  );
}
