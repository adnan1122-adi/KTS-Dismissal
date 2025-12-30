
import React, { useState } from 'react';
import { Language, AdminUser } from '../types';
import { t } from '../i18n';
import { sheetsService } from '../services/googleSheetsService';

interface LoginViewProps {
  lang: Language;
  onSuccess: (user: AdminUser) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ lang, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    // Emergency Admin Fallback (Always check this first to guarantee access)
    if (inputUser === 'admin' && inputPass === '123') {
      onSuccess({ username: 'admin', password: '123', role: 'Admin' });
      setLoading(false);
      return;
    }

    try {
      const admins = await sheetsService.getAdmins();
      const user = admins.find(a => 
        String(a.username || '').toLowerCase().trim() === inputUser && 
        String(a.password || '').trim() === inputPass
      );

      if (user) {
        onSuccess(user);
      } else {
        setError(t('invalidLogin', lang));
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Connectivity issue. Please try 'admin/123' if the sheet is offline.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 w-full max-w-md animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-xl shadow-blue-200">
            🔐
          </div>
          <h2 className="text-3xl font-black text-slate-800">{t('loginTitle', lang)}</h2>
          <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-[10px]">Administrative Access Only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">
              {t('username', lang)}
            </label>
            <input 
              type="text"
              required
              autoFocus
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:ring-0 outline-none transition-all font-bold text-lg"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">
              {t('password', lang)}
            </label>
            <input 
              type="password"
              required
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:ring-0 outline-none transition-all font-bold text-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm font-black rounded-2xl border-2 border-red-100 text-center animate-shake">
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : t('loginButton', lang)}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginView;
