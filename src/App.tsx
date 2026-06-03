import React, { useState, useEffect } from 'react';
import { peergosService } from './services/peergos-client';
import { BottomNav } from './components/BottomNav';
import { ThemePicker } from './components/ThemePicker';
import { nb } from './i18n/nb';
import { en } from './i18n/en';

type Tab = 'profile' | 'chat' | 'calendar' | 'split';
type Theme = 'light' | 'dark' | 'pink' | 'custom';
type Language = 'nb' | 'en';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('nb');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
    } else if (theme === 'custom') {
      // Her kan du legge til logikk for egendefinert farge
    }
    
    root.classList.add('light'); // Default fallback
  }, [theme]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await peergosService.login(username, password);
      setIsLoggedIn(true);
      setUsername('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || t.loginError);
    }
  };

  const handleLogout = () => {
    if (confirm(t.logoutConfirm)) {
      peergosService.logout();
      setIsLoggedIn(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center text-blue-600 dark:text-blue-400">
            {t.appName}
          </h1>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.username}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.password}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-100 p-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              {t.save}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            <p>{t.resetWarning}</p>
          </div>
        </div>
      </div>
    );
  }

  // Innlogget visning
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {t.appName}
          </h1>
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="text-sm border rounded p-1 dark:bg-gray-700 dark:text-white"
            >
              <option value="nb">🇳🇴 Norsk</option>
              <option value="en">🇬🇧 English</option>
            </select>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700"
            >
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">{t.profileTitle}</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t.username}: <strong>{peergosService.getCurrentUser()}</strong>
              </p>
              
              <div className="space-y-4">
                <ThemePicker currentTheme={theme} onThemeChange={setTheme} />
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t.notifications}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{t.notificationsOn}</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                    <span className="text-sm">{t.notificationsOff}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
            <h2 className="text-2xl font-bold mb-4">{t.chatTitle}</h2>
            <p className="text-gray-500">{t.noChats}</p>
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
              {t.startChat}
            </button>
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
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
              {t.createCalendar}
            </button>
          </div>
        )}

        {activeTab === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-bold mb-2">{t.chatTitle}</h3>
              <p className="text-sm text-gray-500">{t.noChats}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-bold mb-2">{t.calendarTitle}</h3>
              <p className="text-sm text-gray-500">{t.busy}</p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
