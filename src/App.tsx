import React, { useState, useEffect } from 'react';
import { BottomNav } from './components/BottomNav';
import { ThemePicker } from './components/ThemePicker';
import { ChatView } from './components/ChatView';
import { CalendarView } from './components/CalendarView';
import { CalendarProvider } from './context/CalendarContext';
import { nb } from './i18n/nb';
import { en } from './i18n/en';

type Tab = 'profile' | 'chat' | 'calendar' | 'split';
type Theme = 'light' | 'dark' | 'pink' | 'custom';
type Language = 'nb' | 'en';
type AuthMode = 'login' | 'register' | 'reset';
type CreateOption = 'none' | 'chat' | 'event'; // Menyvalg for + knappen

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [theme, setTheme] = useState<Theme>('light');
  
  // 🔧 LASTER Custom Color fra localStorage ved oppstart
  const [customColor, setCustomColor] = useState<string>(() => {
    const saved = localStorage.getItem('fokus_custom_color');
    return saved || '#3b82f6';
  });
  
  const [language, setLanguage] = useState<Language>('nb');
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Lagrer innlogget bruker for Admin-sjekk
  const [currentUser, setCurrentUser] = useState('');

  // 🔧 NYTT STATE FOR DEN STORE + KNAPPEN
  const [createOption, setCreateOption] = useState<CreateOption>('none');

  const t = language === 'nb' ? nb : en;

  // Mock database for invitasjonskoder
  const [validInviteCodes, setValidInviteCodes] = useState<string[]>(['FOKUS-DEV']);

  // 🔧 TEMA-EFFEKT
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'pink', 'custom');
    
    if (theme !== 'custom') {
      root.style.removeProperty('--custom-bg');
      root.style.removeProperty('--custom-text');
    }
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'pink') {
      root.classList.add('pink');
    } else if (theme === 'custom') {
      root.classList.add('custom');
      root.style.setProperty('--custom-bg', customColor);
      
      const hex = customColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
      
      if (luminance < 0.5) {
        root.style.setProperty('--custom-text', '#ffffff');
      } else {
        root.style.setProperty('--custom-text', '#111827');
      }
    } else {
      root.classList.add('light');
    }
  }, [theme, customColor]);

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    localStorage.setItem('fokus_custom_color', color);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  // --- FUNKSJONER ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const loggedInUser = username;
      setCurrentUser(loggedInUser);
      setIsLoggedIn(true);
      setUsername('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || t.loginError);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!validInviteCodes.includes(inviteCodeInput)) {
      setError('Ugyldig invitasjonskode.');
      return;
    }
    try {
      console.log('Registrerer:', username, email, inviteCodeInput);
      setSuccessMsg('Bruker opprettet! Du kan nå logge inn.');
      setAuthMode('login');
      setUsername('');
      setPassword('');
      setEmail('');
      setInviteCodeInput('');
    } catch (err: any) {
      setError(err.message || 'Kunne ikke opprette bruker.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!email) {
      setError('Skriv inn e-postadressen din.');
      return;
    }
    setSuccessMsg(`Lenke sendt til ${email}. ⚠️ Chat-meldinger vil gå tapt.`);
    setAuthMode('login');
    setEmail('');
  };

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'INV-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCode(code);
    setValidInviteCodes(prev => [...prev, code]);
    setSuccessMsg(`Ny kode generert: ${code}`);
  };

  const handleLogout = () => {
    if (confirm(t.logoutConfirm)) {
      setIsLoggedIn(false);
      setAuthMode('login');
      setCurrentUser('');
      setGeneratedCode(null);
    }
  };

  // Helper for å håndtere valg fra + knappen
  const handleCreateSelection = (option: CreateOption) => {
    if (option === 'none') {
      setCreateOption('none');
      return;
    }

    if (option === 'chat') {
      // Bytt til chat fanen og sett opp menyen der (vi sender event via props hvis nødvendig, 
      // men enklere er å bare bytte fanen og la ChatView vise sin egen "Ny Chat" meny)
      setActiveTab('chat');
      // Vi kan bruke en global ref eller event, men foreløpig:
      // La oss si at når man trykker "Ny Chat", så åpnes chat-fanen.
      // For enkelhets skyld, la oss la user velge ny chat inne i chat-fanen etterpå.
      // MEN: For å gjøre det mer dynamisk, kan vi sende en prop ned til Child-komponentene.
      // Foreløpig: Bare bytt tab og la brukeren se "Ny Chat" menyen der.
      setCreateOption('none'); 
    } else if (option === 'event') {
      setActiveTab('calendar');
      setCreateOption('none');
    }
  };

  const isAdmin = currentUser.toLowerCase() === 'admin';

  // --- RENDERING ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center text-blue-600 dark:text-blue-400">{t.appName}</h1>
          <div className="flex justify-center gap-4 mb-6 text-sm">
            <button onClick={() => { setAuthMode('login'); setError(''); setSuccessMsg(''); }} className={`px-3 py-1 rounded ${authMode === 'login' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-500'}`}>{t.btnLogin}</button>
            <button onClick={() => { setAuthMode('register'); setError(''); setSuccessMsg(''); }} className={`px-3 py-1 rounded ${authMode === 'register' ? 'bg-green-100 text-green-700 font-bold' : 'text-gray-500'}`}>{t.btnRegister}</button>
            <button onClick={() => { setAuthMode('reset'); setError(''); setSuccessMsg(''); }} className={`px-3 py-1 rounded ${authMode === 'reset' ? 'bg-yellow-100 text-yellow-700 font-bold' : 'text-gray-500'}`}>{t.btnResetPassword}</button>
          </div>

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <h3 className="text-xl font-bold text-center">{t.btnLogin}</h3>
              <div><label className="block text-sm font-medium mb-1">{t.username}</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" required /></div>
              <div><label className="block text-sm font-medium mb-1">{t.password}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" required /></div>
              {error && <div className="text-red-500 text-sm bg-red-100 p-2 rounded">{error}</div>}
              {successMsg && <div className="text-green-600 text-sm bg-green-100 p-2 rounded">{successMsg}</div>}
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">{t.btnLogin}</button>
            </form>
          )}

          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <h3 className="text-xl font-bold text-center">{t.btnRegister}</h3>
              <div><label className="block text-sm font-medium mb-1">{t.username}</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" required /></div>
              <div><label className="block text-sm font-medium mb-1">{t.email}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" required /></div>
              <div><label className="block text-sm font-medium mb-1">Invitasjonskode</label><input type="text" value={inviteCodeInput} onChange={(e) => setInviteCodeInput(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" placeholder="F.eks. INV-8X9Z" required /><p className="text-xs text-gray-500 mt-1">Bruk koden du fikk fra en admin eller venn.</p></div>
              <div><label className="block text-sm font-medium mb-1">{t.password}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" required /></div>
              {error && <div className="text-red-500 text-sm bg-red-100 p-2 rounded">{error}</div>}
              {successMsg && <div className="text-green-600 text-sm bg-green-100 p-2 rounded">{successMsg}</div>}
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">{t.btnRegister}</button>
            </form>
          )}

          {authMode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <h3 className="text-xl font-bold text-center">{t.btnResetPassword}</h3>
              <div><label className="block text-sm font-medium mb-1">{t.email}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" placeholder="din@email.no" required /></div>
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800"><strong>⚠️ Advarsel:</strong> Chat-meldinger vil gå tapt. Kalenderen gjenopprettes.</div>
              {error && <div className="text-red-500 text-sm bg-red-100 p-2 rounded">{error}</div>}
              {successMsg && <div className="text-green-600 text-sm bg-green-100 p-2 rounded">{successMsg}</div>}
              <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg">{t.btnResetPassword}</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- INNLOGGET VISNING ---
  return (
    <CalendarProvider>
      <div className="min-h-screen pb-24 transition-colors duration-300"> {/* pb-24 gir plass til FAB */}
        
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

        <main className="p-4 relative">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">{t.profileTitle}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{t.username}: <strong>{currentUser}</strong></p>
                
                {isAdmin && (
                  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-6 border border-blue-200">
                    <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">👑 Admin Panel</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">Generer nye invitasjonskoder for å invitere brukere.</p>
                    <button onClick={generateInviteCode} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold mb-3">Generer Ny Kode</button>
                    {generatedCode && (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-300">
                        <p className="text-xs text-gray-500">Din nye kode:</p>
                        <p className="text-xl font-mono font-bold text-blue-600 select-all">{generatedCode}</p>
                        <p className="text-xs text-gray-500 mt-1">Klikk på koden for å kopiere.</p>
                      </div>
                    )}
                  </div>
                )}

                <ThemePicker currentTheme={theme} onThemeChange={handleThemeChange} customColor={customColor} onCustomColorChange={handleCustomColorChange} />
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden h-[calc(100vh-180px)]">
              <ChatView currentUser={currentUser} onCreateNew={() => setCreateOption('chat')} />
            </div>
          )}
          
          {activeTab === 'calendar' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden h-[calc(100vh-180px)]">
              <CalendarView currentUser={currentUser} isAdmin={isAdmin} onCreateNew={() => setCreateOption('event')} />
            </div>
          )}
          
          {activeTab === 'split' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow h-[calc(100vh-250px)] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">{t.chatTitle}</h3>
                  <button onClick={() => setCreateOption('chat')} className="text-blue-600 text-sm font-bold">+ Ny Chat</button>
                </div>
                <p className="text-sm text-gray-500">Trykk + for å starte en ny samtale.</p>
                {/* Her kunne vi listet opp chatter kort */}
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow h-[calc(100vh-250px)] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">{t.calendarTitle}</h3>
                  <button onClick={() => setCreateOption('event')} className="text-blue-600 text-sm font-bold">+ Ny Hendelse</button>
                </div>
                <p className="text-sm text-gray-500">Trykk + for å legge til en hendelse.</p>
                 {/* Her kunne vi listet opp kommende hendelser kort */}
              </div>
            </div>
          )}
        </main>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 🔧 DEN STORE + KNAPPEN (FLOATING ACTION BUTTON) - SYN PÅ ALLE SIDENE */}
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-2">
          
          {/* Meny-valg som dukker opp når man trykker + */}
          {createOption === 'none' && (
             <>
               <button
                onClick={() => setCreateOption('chat')}
                className="bg-white dark:bg-gray-800 text-blue-600 shadow-lg px-4 py-2 rounded-full font-bold text-sm transform translate-x-4 opacity-0 animate-slide-in transition-all"
                style={{ animationDelay: '0.1s' }}
              >
                💬 Ny Chat
              </button>
              <button
                onClick={() => setCreateOption('event')}
                className="bg-white dark:bg-gray-800 text-purple-600 shadow-lg px-4 py-2 rounded-full font-bold text-sm transform translate-x-4 opacity-0 animate-slide-in transition-all"
                style={{ animationDelay: '0.05s' }}
              >
                📅 Ny Hendelse
              </button>
             </>
          )}

          {/* Hovedknapp (+) */}
          <button
            onClick={() => setCreateOption(createOption === 'none' ? 'show' : 'none')}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center text-3xl font-bold transform transition-transform hover:scale-110 active:scale-95"
          >
            {createOption === 'none' ? '+' : '✕'}
          </button>
        </div>

        {/* Hvis man velger en handling, utfør den og lukk menyen */}
        {createOption === 'chat' && (
           <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
             <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md animate-scale-up">
               <h3 className="text-xl font-bold mb-4">Nye Samtale</h3>
               {/* Dette er en forenklet versjon. I sanntid bør vi bruke ChatViews interne state. */}
               <p className="text-sm text-gray-500 mb-4">Gå til Chat-fanen for å opprette en ny samtale detaljert.</p>
               <button onClick={() => { setActiveTab('chat'); setCreateOption('none'); }} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">Gå til Chat</button>
               <button onClick={() => setCreateOption('none')} className="w-full mt-2 bg-gray-200 text-gray-800 py-2 rounded-lg font-bold">Avbryt</button>
             </div>
           </div>
        )}

        {createOption === 'event' && (
           <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
             <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md animate-scale-up">
               <h3 className="text-xl font-bold mb-4">Ny Hendelse</h3>
               <p className="text-sm text-gray-500 mb-4">Gå til Kalender-fanen for å legge til en ny hendelse.</p>
               <button onClick={() => { setActiveTab('calendar'); setCreateOption('none'); }} className="w-full bg-purple-600 text-white py-2 rounded-lg font-bold">Gå til Kalender</button>
               <button onClick={() => setCreateOption('none')} className="w-full mt-2 bg-gray-200 text-gray-800 py-2 rounded-lg font-bold">Avbryt</button>
             </div>
           </div>
        )}

      </div>
    </CalendarProvider>
  );
}

export default App;
