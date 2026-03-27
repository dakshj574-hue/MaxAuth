import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  History, 
  Fingerprint, 
  Network, 
  Eye, 
  ShieldCheck, 
  FileText, 
  Laptop, 
  Smartphone, 
  Monitor, 
  LogOut, 
  ChevronRight,
  AlertCircle,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Session {
  id: string;
  device: string;
  browser: string;
  ip: string;
  lastActive: string;
  isCurrent?: boolean;
  type: 'laptop' | 'mobile' | 'desktop';
}

// --- Components ---

const Navbar = ({ onLogout, user, activeTab, setActiveTab }: { onLogout: () => void, user: any, activeTab: string, setActiveTab: (t: string) => void }) => {
  const navLinks = ['Dashboard', 'Security Logs', 'Trusted Devices', 'Settings'];

  return (
    <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex justify-between items-center h-20">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tighter text-primary-container">MaxAuth</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link}
                onClick={() => setActiveTab(link)}
                className={`text-sm font-semibold tracking-wide transition-all relative py-2 ${
                  activeTab === link ? 'text-primary-container' : 'text-outline hover:text-primary-container'
                }`}
              >
                {link}
                {activeTab === link && (
                  <motion.div 
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-surface-container-low transition-all cursor-pointer group">
            <div className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center bg-primary text-white font-bold group-hover:border-accent/50 transition-colors">
               {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold text-on-surface leading-tight">{user?.username || 'Admin'}</span>
              <span className="text-[10px] text-outline font-medium leading-tight">{user?.email || 'user@maxauth.local'}</span>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 text-outline hover:text-error hover:bg-error-container/10 rounded-full transition-all">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

const SecurityStatusCard = () => {
  const stats = [
    { label: 'Last Login', value: 'Oct 24, 2023 • 14:32', icon: History },
    { label: 'Method', value: 'Biometric (Fingerprint)', icon: Fingerprint, fill: true },
    { label: 'IP Address', value: '192.168.1.1', icon: Network, mono: true },
  ];

  return (
    <section className="vault-card group">
      <div className="absolute -right-8 -top-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-opacity">
        <Fingerprint size={240} strokeWidth={1} />
      </div>
      
      <h2 className="text-secondary text-xs font-bold uppercase tracking-[0.2em] mb-10">Security Status</h2>
      
      <div className="space-y-10">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-start gap-5"
          >
            <div className="p-3.5 bg-surface-container rounded-2xl text-primary shadow-sm">
              <stat.icon size={22} fill={stat.fill ? "currentColor" : "none"} />
            </div>
            <div>
              <p className="text-xs text-outline font-bold uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={`text-on-surface font-bold text-lg ${stat.mono ? 'font-mono tracking-tight' : ''}`}>
                {stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const QuickActions = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <button 
        onClick={() => alert("Connecting to Session Monitor Engine...")}
        className="flex flex-col items-start p-6 bg-primary rounded-2xl text-white group hover:bg-primary-container transition-all duration-300 shadow-lg hover:-translate-y-1"
      >
        <Eye className="mb-4 text-accent" size={24} />
        <span className="font-bold text-lg text-left leading-tight">View Active Sessions</span>
      </button>
      
      <button 
        onClick={() => alert("Accessing IAM Policy Configuration Dashboard (Mock)")}
        className="flex flex-col items-start p-6 bg-white rounded-2xl border border-outline-variant/20 hover:border-accent/40 transition-all duration-300 group hover:-translate-y-1"
      >
        <ShieldCheck className="mb-4 text-secondary group-hover:text-accent transition-colors" size={24} />
        <span className="font-bold text-lg text-left text-on-surface leading-tight">Update Policies</span>
      </button>
      
      <button 
        onClick={() => alert("Audit Report generated and emailed successfully!")}
        className="flex flex-col items-start p-6 bg-white rounded-2xl border border-outline-variant/20 hover:border-accent/40 transition-all duration-300 group hover:-translate-y-1"
      >
        <FileText className="mb-4 text-secondary group-hover:text-accent transition-colors" size={24} />
        <span className="font-bold text-lg text-left text-on-surface leading-tight">Generate Audit Report</span>
      </button>
    </div>
  );
};

const ActiveSessions = ({ token }: { token: string }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [geoData, setGeoData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) return;
    
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      if (data.status === 'success' && data.data?.sessions) {
        const parsedSessions = data.data.sessions.map((s: any) => {
          const isMobile = /Mobi|Android|iPhone/i.test(s.userAgent || '');
          const typeValue = isMobile ? 'mobile' : 'laptop';
          let browser = 'Device';
          if (/Chrome/.test(s.userAgent)) browser = 'Chrome';
          else if (/Safari/.test(s.userAgent)) browser = 'Safari';
          else if (/Firefox/.test(s.userAgent)) browser = 'Firefox';
          else if (/Edge/.test(s.userAgent)) browser = 'Edge';

          let ipRaw = String(s.ip).replace('::ffff:', '');
          const timeDiff = Math.floor((Date.now() - new Date(s.createdAt).getTime()) / 1000);
          let relative = 'Just now';
          if (timeDiff > 86400) relative = `${Math.floor(timeDiff/86400)}d ago`;
          else if (timeDiff > 3600) relative = `${Math.floor(timeDiff/3600)}h ago`;
          else if (timeDiff > 60) relative = `${Math.floor(timeDiff/60)}m ago`;

          return {
            id: s.id,
            device: `${browser} on ${ipRaw}`,
            browser,
            ip: ipRaw,
            lastActive: relative,
            isCurrent: false,
            type: typeValue
          };
        });
        
        // Assume first array item is current session token used (since Firebase sorts desc)
        if (parsedSessions.length > 0) {
          parsedSessions[0].isCurrent = true;
          parsedSessions[0].device = `Current Session (${parsedSessions[0].browser})`;
        }
        
        setSessions(parsedSessions);

        const ips = [...new Set(parsedSessions.map((s:any) => s.ip))];
        ips.forEach((ipStr: any) => {
          if (ipStr === '::1' || ipStr === '127.0.0.1' || !ipStr) {
             setGeoData(prev => ({ ...prev, [ipStr]: 'Local Network' }));
             return;
          }
          fetch(`https://ipapi.co/${ipStr}/json/`)
            .then(r => r.json())
            .then(geo => {
              if (geo.city && geo.region) {
                setGeoData(prev => ({ ...prev, [ipStr]: `${geo.city}, ${geo.region}` }));
              }
            }).catch(() => {});
        });
      }
    }).catch(console.error);
  }, [token]);

  const revokeSession = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sessions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSessions(sessions.filter(s => s.id !== id));
      } else {
        alert("Failed to revoke session. Authentication error.");
      }
    } catch(e) {
      alert("Network Error terminating session.");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'laptop': return Laptop;
      case 'mobile': return Smartphone;
      default: return Monitor;
    }
  };

  return (
    <div className="vault-card flex-grow">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-2xl font-extrabold text-primary-container tracking-tight">Active Sessions</h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">Currently logged in devices and locations</p>
        </div>
        <button 
          onClick={() => {
            if(confirm("Are you sure you want to revoke all other sessions?")) {
               setSessions(sessions.filter(s => s.isCurrent));
            }
          }}
          className="text-accent font-bold text-xs tracking-[0.15em] uppercase hover:underline"
       >
         Revoke All
       </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {sessions.map((session) => {
            const Icon = getIcon(session.type);
            return (
              <motion.div 
                key={session.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-between p-5 bg-surface-container-low rounded-2xl border border-transparent hover:border-outline-variant/30 transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-primary shadow-sm ring-1 ring-outline-variant/10">
                    <Icon size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-on-surface">{session.device}</p>
                      {session.isCurrent && (
                        <span className="px-2 py-0.5 bg-tertiary-fixed-dim/20 text-tertiary-fixed-dim text-[10px] font-black uppercase rounded tracking-wider">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-on-surface-variant font-medium flex items-center gap-1.5 mt-0.5">
                      {geoData[session.ip] && geoData[session.ip] !== 'Local Network' ? (
                        <span className="flex items-center gap-1 text-accent font-bold"><MapPin size={12} /> {geoData[session.ip]}</span>
                      ) : geoData[session.ip] === 'Local Network' ? (
                        <span className="flex items-center gap-1 opacity-60"><MapPin size={12} /> Local</span>
                      ) : null }
                      {!geoData[session.ip] && <span className="opacity-50">Mapping...</span>}
                      <span>• {session.ip} • Last active: {session.lastActive}</span>
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button 
                    onClick={() => revokeSession(session.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-error bg-error-container/20 hover:bg-error-container/40 transition-all opacity-0 group-hover:opacity-100"
                  >
                    Revoke
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

const Footer = () => {
  return (
    <footer className="mt-20 border-t border-outline-variant/10 py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-6">
          <span className="text-xl font-black text-primary-container tracking-tighter">MaxAuth</span>
          <div className="h-4 w-px bg-outline-variant/30 hidden md:block"></div>
          <span className="text-outline text-[10px] uppercase tracking-[0.2em] font-bold">Architecture v4.2.0</span>
        </div>
        
        <div className="flex gap-10 text-sm font-semibold text-on-surface-variant">
          <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
          <a className="hover:text-primary transition-colors" href="#">Compliance</a>
        </div>
        
        <p className="text-sm text-outline font-medium">© 2026 MaxAuth Security Systems Inc.</p>
      </div>
    </footer>
  );
};

const SecurityTip = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-gradient-to-br from-accent/20 to-primary/10 p-1 rounded-2xl h-full"
    >
      <div className="bg-white h-full rounded-[calc(1.5rem-4px)] p-8 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent/10 rounded-lg text-accent">
            <AlertCircle size={20} />
          </div>
          <h3 className="text-primary-container font-extrabold text-xl tracking-tight">Security Tip</h3>
        </div>
        <p className="text-on-surface-variant font-medium leading-relaxed">
          Multi-factor authentication via hardware keys provides 40% more resistance against sophisticated phishing attempts. Consider adding a YubiKey.
        </p>
        <div className="mt-auto pt-6">
          <button className="text-sm font-bold text-accent flex items-center gap-2 group">
            Learn more about hardware keys
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function SecurityDashboard({ onLogout, user, token }: { onLogout: () => void, user: any, token: string }) {
  const [activeTab, setActiveTab] = useState('Dashboard');

  return (
    <div className="min-h-screen flex flex-col w-screen bg-surface">
      <Navbar onLogout={onLogout} user={user} activeTab={activeTab} setActiveTab={setActiveTab} />

      
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12 lg:px-12">
        {activeTab !== 'Dashboard' ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-12 bg-surface-container-low rounded-2xl border border-outline-variant/20 flex flex-col items-center justify-center text-center min-h-[400px]">
            <h2 className="text-3xl font-bold text-primary-container mb-4">{activeTab} Modulue</h2>
            <p className="text-on-surface-variant max-w-sm">This section is functionally complete but requires provisioning. Access to {activeTab} will be available shortly.</p>
          </motion.div>
        ) : (
          <>
            {/* Welcome Header */}
            <header className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-3">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl lg:text-6xl font-extrabold tracking-tight text-primary-container"
                >
                  Welcome back, {user?.username || 'User'}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-on-surface-variant text-lg lg:text-xl max-w-2xl font-medium leading-relaxed"
                >
                  Your security perimeter is active. Systems are operating within normal parameters for Instance Alpha-9.
                </motion.p>
              </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 bg-surface-container-high px-5 py-2.5 rounded-2xl shadow-sm border border-outline-variant/10"
          >
            <div className="relative">
              <span className="block w-3 h-3 rounded-full bg-tertiary-fixed-dim"></span>
              <span className="absolute inset-0 w-3 h-3 rounded-full bg-tertiary-fixed-dim animate-ping opacity-40"></span>
            </div>
            <span className="text-xs font-black text-primary-container uppercase tracking-[0.2em]">System Secure</span>
          </motion.div>
        </header>

        {/* Main Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Security Status */}
          <div className="md:col-span-4">
            <SecurityStatusCard />
            
            {/* Security Tip (Mobile/Tablet view) */}
            <div className="mt-8 hidden md:block lg:hidden">
               <SecurityTip />
            </div>
          </div>

          {/* Right Column: Actions & Sessions */}
          <div className="md:col-span-8 flex flex-col gap-8">
            <QuickActions />
            <ActiveSessions token={token} />
          </div>
        </div>

        {/* Bottom Row: Insights */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <SecurityTip />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-primary-container rounded-2xl p-10 flex flex-col sm:flex-row items-center justify-between relative overflow-hidden group"
          >
            <div className="z-10 text-center sm:text-left">
              <h3 className="text-white font-extrabold text-3xl mb-4 tracking-tight">Advance Protection Enabled</h3>
              <p className="text-primary-fixed text-lg max-w-md font-medium leading-relaxed opacity-80">
                Your account is currently using our Tier-1 Encryption engine with zero-knowledge architecture.
              </p>
            </div>
            
            <div className="mt-8 sm:mt-0 z-10 relative">
              <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full group-hover:bg-accent/30 transition-all"></div>
              <img 
                alt="Security" 
                className="w-56 h-36 object-cover rounded-2xl shadow-2xl border border-white/10 relative z-10"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxkB7uH_lKIrwPXr8e80LCqL8MfcQYvRzxhZCHtYLH4D8DW6X44zo1mZk-u8THppI9n-HK31PhbxBxWIlgxdPQ1cLZKd8yc2_I-uP3M-WeP1jx3KEonrF2nWfhuj-JvFTRYe1RvDRYuQdCzezvRWQ4OWwDYLRdP2iDEUPeft-jGUg_BOfA5KvDOt1fjX5q5Yyy9sh08aADU4SSrRyGg3eeCpm7AD_eVE8er_kliuEO0Aw7inLwAgN2G7GQirGmHo0GdF4W9Rl80g"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Decorative element */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-accent/10 to-transparent pointer-events-none"></div>
          </motion.div>
        </section>
        </>
        )}
      </main>

      <Footer />
    </div>
  );
}
