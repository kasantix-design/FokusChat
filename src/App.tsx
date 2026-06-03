import React, { useState, useEffect } from 'react';
import { peergosService } from './services/peergos-client';
import { BottomNav } from './components/BottomNav';
import { ThemePicker } from './components/ThemePicker';
import { nb } from './i18n/nb';
import { en } from './i18n/en';

type Tab = 'profile' | 'chat' | 'calendar' | 'split';
type Theme = 'light' | 'dark' | 'pink' | 'custom';
type Language = 'nb' | 'en';
type AuthMode = 'login' | 'register' | 'reset';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login'); // 'login', 'register', 'reset'
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('nb');
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState(''); // For registrering
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const t = language === 'nb' ? nb : en;

  // Effekter for tema
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'pink');
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'pink') {
      root.classList.add('pink');
      root.style.setProperty('--primary-color', '#ec4899');
    }
    
    root.classList.add('light');
  }, [theme]);

  // --- LOGIKK FOR INNLØGNING ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      await peergosService.login(username, password);
      setIsLoggedIn(true);
      // Reset form
      setUsername('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || t.loginError);
    }
  };

  // --- LOGIKK FOR REGISTRERING ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (!inviteCode) {
      setError('Du trenger en invitasjonskode for å opprette en konto.');
      return;
    }

    try {
      // Her vil vi kalle en API-endepunkt for registrering med kode
      // For nå simulerer vi suksess
      console.log('Registrerer:', username, email, inviteCode);
      setSuccessMsg('Bruker opprettet! Du kan nå logge inn.');
      setAuthMode('login'); // Bytt tilbake til innlogging
      setUsername('');
      setPassword('');
      setEmail('');
      setInviteCode('');
    } catch (err: any) {
      setError(err.message || 'Kunne ikke opprette bruker.');
    }
  };

  // --- LOGIKK FOR GLEMT PASSORD ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Skriv inn e-postadressen din.');
      return;
    }

    try {
      // Simulerer at e-post er sendt
      console.log('Sender tilbakestilling til:', email);
      setSuccessMsg(`En lenke for tilbakestilling er sendt til ${email}. 
      ⚠️ Husk: Dette vil slette dine E2EE-chat-meldinger. Kalenderen din vil bli gjenopprettet.`);
      setAuthMode('login');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Kunne ikke sende tilbakestilling.');
    }
  };

  const handleLogout = () => {
    if (confirm(t.logoutConfirm)) {
      peergosService.logout();
      setIsLoggedIn(false);
      setAuthMode('login');
    }
  };

  // --- RENDERING AV INNLØGNINGSSIDER ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center text-blue-600 dark:text-blue-400">
            {t.appName}
          </h1>

          {/* HEADER FOR MODE SWITCHING */}
          <div className="flex justify-center gap-4 mb-6 text-sm">
            <button 
              onClick={() => { setAuthMode('login'); setError(''); setSuccessMsg(''); }}
              className={`px-3 py-1 rounded ${authMode === 'login' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-500'}`}
            >
              {t.save}
            </button>
            <button 
              onClick={() => { setAuthMode('register'); setError(''); setSuccessMsg(''); }}
              className={`px-3 py-1 rounded ${authMode === 'register' ? 'bg-green-100 text-green-700 font-bold' : 'text-gray-500'}`}
            >
              {t.create}
            </button>
            <button 
              onClick={() => { setAuthMode('reset'); setError(''); setSuccessMsg(''); }}
              className={`px-3 py-1 rounded ${authMode === 'reset' ? 'bg-yellow-100 text-yellow-700 font-bold' : 'text-gray-500'}`}
            >
              {t.resetPassword}
            </button>
          </div>

          {/* 1. INNLOGGING */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.username}</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.password}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" required />
              </div>
              
              {error && <div className="text-red-500 text-sm bg-red-100 p-2 rounded">{error}</div>}
              {successMsg && <div className="text-green-600 text-sm bg-green-100 p-2 rounded">{successMsg}</div>}

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{t.save}</button>
            </form>
          )}

          {/* 2. REGISTRERING */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.username}</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.email}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invitasjonskode</label>
                <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" placeholder="F.eks. FOKUS-2024" required />
                <p className="text-xs text-gray-500 mt-1">Du må få denne koden fra en eksisterende bruker eller admin.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.password}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" required />
              </div>

              {error && <div className="text-red-500 text-sm bg-red-100 p-2 rounded">{error}</div>}
              {successMsg && <div className="text-green-600 text-sm bg-green-100 p-2 rounded">{successMsg}</div>}

              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">{t.create}</button>
            </form>
          )}

          {/* 3. GLEMT PASSORD */}
          {authMode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.email}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" placeholder="din@email.no" required />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800">
                <strong>⚠️ Viktig advarsel:</strong><br/>
                Ved å tilbakestille passordet ditt vil du <strong>miste alle dine E2EE-chat-meldinger</strong>. 
                Serveren kan ikke dekryptere dem uten din gamle passord-nøkkel. 
                <br/><br/>
                Din <strong>Kalender</strong> vil bli gjenopprettet.
              </div>

              {error && <div className="text-red-500 text-sm bg-red-100 p-2 rounded">{error}</div>}
              {successMsg && <div className="text-green-600 text-sm bg-green-100 p-2 rounded">{successMsg}</div>}

              <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg">{t.resetPassword}</button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-gray-400">
            &copy; 2026 Fokus. E2EE Sikkerhet.
          </div>
        </div>
      </div>
    );
  }

  // --- INNLOGGET VISNING (Samme som før) ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">{t.appName}</h1>
          <div className="flex items-center gap-2">
            <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="text-sm border rounded p-1 dark:bg-gray-700 dark:text-white">
              <option value="nb">🇳🇴 Norsk</option>
              <option value="en">🇬🇧 English</option>
            </select>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">{t.logout}</button>
          </div>
        </div>
      </header>

      <main className="p-4">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">{t.profileTitle}</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{t.username}: <strong>{peergosService.getCurrentUser()}</strong></p>
              <ThemePicker currentTheme={theme} onThemeChange={setTheme} />
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">{t.notifications}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{t.notificationsOn}</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                  <span className="text-sm">{t.notificationsOff}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'chat' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
            <h2 className="text-2xl font-bold mb-4">{t.chatTitle}</h2>
            <p className="text-gray-500">{t.noChats}</p>
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">{t.startChat}</button>
          </div>
        )}
        {activeTab === 'calendar' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
            <h2 className="text-2xl font-bold mb-4">{t.calendarTitle}</h2>
            <div className="space-y-2">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded">{t.bulandet}</div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded">{t.hovet}</div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded">{t.hop}</div>
            </div>
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">{t.createCalendar}</button>
          </div>
        )}
        {activeTab === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"><h3 className="font-bold mb-2">{t.chatTitle}</h3><p className="text-sm text-gray-500">{t.noChats}</p></div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"><h3 className="font-bold mb-2">{t.calendarTitle}</h3><p className="text-sm text-gray-500">{t.busy}</p></div>
          </div>
        )}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
