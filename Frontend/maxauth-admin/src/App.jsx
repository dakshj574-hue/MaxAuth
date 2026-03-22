import { useState, useEffect } from 'react'
import { AlertCircle, Activity, Globe, Monitor, List, Power, LogIn, Settings } from 'lucide-react'

const API_BASE = 'http://localhost:5000/api'

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('maxauth_api_key') || '')
  const [isConfigured, setIsConfigured] = useState(!!localStorage.getItem('maxauth_api_key'))
  const [activeTab, setActiveTab] = useState('sessions')
  
  const [sessions, setSessions] = useState([])
  const [suspiciousEvents, setSuspiciousEvents] = useState([])
  const [projectSettings, setProjectSettings] = useState({ mfaEnabled: false, mfaMethod: 'email_otp' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState(null)
  const [settingsError, setSettingsError] = useState(null)

  const handleSaveApiKey = () => {
    localStorage.setItem('maxauth_api_key', apiKey)
    setIsConfigured(true)
    fetchData()
  }

  const fetchData = async () => {
    if (!apiKey) return
    setLoading(true)
    setError(null)
    
    try {
      const headers = { 'x-api-key': apiKey }
      const [sessionsRes, suspiciousRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/sessions/admin`, { headers }),
        fetch(`${API_BASE}/suspicious`, { headers }),
        fetch(`${API_BASE}/projects/settings`, { headers })
      ])

      const sessionsData = await sessionsRes.json()
      const suspiciousData = await suspiciousRes.json()
      const settingsData = await settingsRes.json()

      if (!sessionsData.success) throw new Error(sessionsData.message || 'Failed to fetch sessions')
      
      setSessions(sessionsData.data.sessions || [])
      setSuspiciousEvents(suspiciousData.data?.events || [])
      
      if (settingsData.success && settingsData.data) {
        setProjectSettings({
          mfaEnabled: settingsData.data.mfaEnabled || false,
          mfaMethod: settingsData.data.mfaMethod || 'email_otp'
        })
      }
    } catch (err) {
      setError(err.message)
      if (err.message.includes('Invalid API key')) {
        setIsConfigured(false)
        localStorage.removeItem('maxauth_api_key')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isConfigured) {
      fetchData()
    }
  }, [isConfigured])

  const handleSaveSettings = async () => {
    setSettingsSaving(true)
    setSettingsError(null)
    setSettingsSuccess(null)
    try {
      const res = await fetch(`${API_BASE}/projects/settings`, {
        method: 'PATCH',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mfaEnabled: projectSettings.mfaEnabled,
          mfaMethod: projectSettings.mfaMethod
        })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setSettingsSuccess('Settings saved successfully!')
      setTimeout(() => setSettingsSuccess(null), 3000)
    } catch(err) {
      setSettingsError(err.message)
    } finally {
      setSettingsSaving(false)
    }
  }

  const terminateSession = async (sessionId) => {
    if (!confirm('Are you sure you want to terminate this session?')) return;
    
    try {
       const res = await fetch(`${API_BASE}/sessions/admin/${sessionId}`, {
         method: 'DELETE',
         headers: { 'x-api-key': apiKey }
       })
       const data = await res.json()
       if (!data.success) throw new Error(data.message)
       fetchData() // refresh
    } catch(err) {
       alert('Failed to terminate: ' + err.message)
    }
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
         <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-center mb-6">
               <div className="bg-blue-600 p-3 rounded-xl text-white">
                 <LogIn size={32} />
               </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">MaxAuth Admin</h1>
            <p className="text-slate-500 text-center mb-6 text-sm">Enter your Project API Key to access the dashboard</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="mxa_..."
                />
              </div>
              <button 
                onClick={handleSaveApiKey}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Access Dashboard
              </button>
            </div>
         </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Activity size={24} />
             </div>
             <h1 className="text-xl font-bold tracking-tight text-slate-800">MaxAuth Operations</h1>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={fetchData} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
               Refresh Data
             </button>
             <button 
               onClick={() => { setIsConfigured(false); setApiKey(''); localStorage.removeItem('maxauth_api_key'); }}
               className="text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors"
             >
               Change API Key
             </button>
          </div>
       </header>

       <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700">
              <AlertCircle size={20} />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-4 mb-8">
             <button 
               onClick={() => setActiveTab('sessions')}
               className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'sessions' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
             >
                <List size={20} /> Active Sessions
                <span className="bg-opacity-20 bg-white px-2 py-0.5 rounded-full text-xs ml-2">{sessions.length}</span>
             </button>
             <button 
               onClick={() => setActiveTab('suspicious')}
               className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'suspicious' ? 'bg-rose-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
             >
                <AlertCircle size={20} /> Suspicious Threats
                {suspiciousEvents.length > 0 && <span className="bg-opacity-20 bg-white px-2 py-0.5 rounded-full text-xs ml-2">{suspiciousEvents.length}</span>}
             </button>
             <button 
               onClick={() => setActiveTab('settings')}
               className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'settings' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
             >
                <Settings size={20} /> Project Settings
             </button>
          </div>

          {loading ? (
             <div className="flex-1 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
             </div>
          ) : activeTab === 'sessions' ? (
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm tracking-wider uppercase">
                         <th className="p-4 font-semibold">User ID</th>
                         <th className="p-4 font-semibold">IP Address</th>
                         <th className="p-4 font-semibold">Device</th>
                         <th className="p-4 font-semibold">Location</th>
                         <th className="p-4 font-semibold">Last Active</th>
                         <th className="p-4 font-semibold text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 text-sm">
                      {sessions.length === 0 ? (
                         <tr><td colSpan="6" className="p-8 text-center text-slate-500">No active sessions found.</td></tr>
                      ) : sessions.map(s => (
                         <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-medium text-slate-800">{s.userId.substring(0,8)}...</td>
                            <td className="p-4 text-slate-600 font-mono text-xs">{s.deviceInfo?.ip || 'N/A'}</td>
                            <td className="p-4 text-slate-600">
                               <div className="flex items-center gap-2">
                                  <Monitor size={16} className="text-slate-400" />
                                  {s.deviceInfo?.browser?.name || 'Unknown'} on {s.deviceInfo?.os?.name || 'Unknown OS'}
                               </div>
                            </td>
                            <td className="p-4 text-slate-600">
                               <div className="flex items-center gap-2">
                                  <Globe size={16} className="text-slate-400" />
                                  Local
                               </div>
                            </td>
                            <td className="p-4 text-slate-500">
                               {new Date(s.lastUsedAt?._seconds ? s.lastUsedAt._seconds*1000 : s.lastUsedAt).toLocaleString()}
                            </td>
                            <td className="p-4 text-right">
                               <button 
                                 onClick={() => terminateSession(s.id)}
                                 className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 font-medium text-xs"
                               >
                                 <Power size={14} /> Terminate
                               </button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          ) : activeTab === 'settings' ? (
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-2xl mx-auto w-full">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Multi-Factor Authentication (MFA)</h2>
                
                {settingsSuccess && (
                  <div className="mb-6 bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 text-emerald-700">
                    <Activity size={20} />
                    <p className="font-medium">{settingsSuccess}</p>
                  </div>
                )}
                {settingsError && (
                  <div className="mb-6 bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-700">
                    <AlertCircle size={20} />
                    <p className="font-medium">{settingsError}</p>
                  </div>
                )}

                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <h3 className="text-lg font-medium text-slate-800">Enable MFA</h3>
                       <p className="text-slate-500 text-sm mt-1">Require users to complete an additional verification step when signing in.</p>
                     </div>
                     <button 
                       onClick={() => setProjectSettings({...projectSettings, mfaEnabled: !projectSettings.mfaEnabled})}
                       className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${projectSettings.mfaEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                     >
                       <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${projectSettings.mfaEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                     </button>
                   </div>
                   
                   {projectSettings.mfaEnabled && (
                     <div className="pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">MFA Method</label>
                        <select 
                          value={projectSettings.mfaMethod}
                          onChange={(e) => setProjectSettings({...projectSettings, mfaMethod: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                        >
                           <option value="email_otp">Email OTP</option>
                           <option value="phone_otp">Phone OTP</option>
                        </select>
                     </div>
                   )}
                   
                   <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button 
                         onClick={handleSaveSettings}
                         disabled={settingsSaving}
                         className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors shadow-sm hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                         {settingsSaving ? 'Saving...' : 'Save Settings'}
                      </button>
                   </div>
                </div>
             </div>
          ) : (
             <div className="space-y-4">
                {suspiciousEvents.length === 0 ? (
                   <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 tracking-tight">System is Secure</h3>
                      <p className="text-slate-500 mt-2">No suspicious activities detected in your project.</p>
                   </div>
                ) : suspiciousEvents.map(e => (
                   <div key={e.id} className="bg-white p-6 rounded-2xl border-l-4 border-rose-500 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-3">
                            <span className="bg-rose-100 text-rose-700 font-bold px-3 py-1 rounded-lg text-xs tracking-wider uppercase">
                               {e.type}
                            </span>
                            <span className="text-sm text-slate-500 font-medium">
                               {new Date(e.timestamp?._seconds ? e.timestamp._seconds*1000 : e.timestamp).toLocaleString()}
                            </span>
                         </div>
                         <span className={`px-3 py-1 rounded-full text-xs font-bold ${e.actionTaken.includes('LOGGED') ? 'bg-slate-100 text-slate-600' : 'bg-rose-600 text-white'}`}>
                            {e.actionTaken.replace(/_/g, ' ')}
                         </span>
                      </div>
                      <p className="text-slate-800 font-medium mt-3 text-lg">{e.description}</p>
                      <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                         <div><span className="font-semibold text-slate-700">Account:</span> {e.userId}</div>
                         <div><span className="font-semibold text-slate-700">IP:</span> {e.ip}</div>
                         {e.device && <div><span className="font-semibold text-slate-700">Device:</span> <span dangerouslySetInnerHTML={{__html: e.device.substring(0,30)}} />...</div>}
                      </div>
                   </div>
                ))}
             </div>
          )}
       </main>
    </div>
  )
}

export default App
