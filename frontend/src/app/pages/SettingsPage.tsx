import { useEffect, useState } from 'react';
import { Settings, ShieldCheck, BellRing, Save, Globe } from 'lucide-react';
import { useI18n } from '../i18n';
import { api } from '../services/api';

type UserSettings = {
  emailAlerts: boolean;
  pushAlerts: boolean;
  hideSmallAmounts: boolean;
  language: 'en' | 'ro';
};

const STORAGE_KEY = 'app-settings';

export function SettingsPage() {
  const { t, language, setLanguage } = useI18n();
  const [settings, setSettings] = useState<UserSettings>({
    emailAlerts: true,
    pushAlerts: true,
    hideSmallAmounts: false,
    language,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<UserSettings>;
          setSettings((prev) => ({ ...prev, ...parsed }));
        } catch (error) {
          console.error('Failed to parse settings', error);
        }
      }

      const userId = localStorage.getItem('userId');
      if (!userId) return;

      try {
        const remote = await api.getUserPreferences(userId);
        setSettings((prev) => ({
          ...prev,
          emailAlerts: !!remote.email_alerts,
          pushAlerts: !!remote.push_alerts,
          hideSmallAmounts: !!remote.hide_small_amounts,
        }));
      } catch (error) {
        console.error('Failed to load user preferences from backend', error);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    setSettings((prev) => ({ ...prev, language }));
  }, [language]);

  const update = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSaved(false);
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    const userId = localStorage.getItem('userId');
    if (userId) {
      try {
        await api.updateUserPreferences(userId, {
          email_alerts: settings.emailAlerts,
          push_alerts: settings.pushAlerts,
          hide_small_amounts: settings.hideSmallAmounts,
        });
      } catch (error) {
        console.error('Failed to save user preferences to backend', error);
      }
    }

    setLanguage(settings.language);
    window.dispatchEvent(new Event('language-changed'));
    window.dispatchEvent(new Event('settings-changed'));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#FFD10020' }}>
          <Settings size={24} className="text-[#1B2B4B]" />
        </div>
        <div>
          <h1 className="font-bold text-[#1B2B4B]" style={{ fontSize: '22px' }}>{t('settings.title')}</h1>
          <p className="text-muted-foreground" style={{ fontSize: '13px' }}>{t('settings.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border" style={{ background: '#1B2B4B' }}>
          <h2 className="font-semibold text-white" style={{ fontSize: '15px' }}>{t('settings.section.preferences')}</h2>
        </div>

        <div className="divide-y divide-border">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <BellRing size={18} className="text-[#1B2B4B]/70 mt-0.5" />
              <div>
                <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '14px' }}>{t('settings.emailAlerts.title')}</div>
                <div className="text-muted-foreground" style={{ fontSize: '13px' }}>{t('settings.emailAlerts.subtitle')}</div>
              </div>
            </div>
            <input type="checkbox" checked={settings.emailAlerts} onChange={(e) => update('emailAlerts', e.target.checked)} />
          </div>

          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <BellRing size={18} className="text-[#1B2B4B]/70 mt-0.5" />
              <div>
                <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '14px' }}>{t('settings.pushAlerts.title')}</div>
                <div className="text-muted-foreground" style={{ fontSize: '13px' }}>{t('settings.pushAlerts.subtitle')}</div>
              </div>
            </div>
            <input type="checkbox" checked={settings.pushAlerts} onChange={(e) => update('pushAlerts', e.target.checked)} />
          </div>

          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="text-[#1B2B4B]/70 mt-0.5" />
              <div>
                <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '14px' }}>{t('settings.hideSmallAmounts.title')}</div>
                <div className="text-muted-foreground" style={{ fontSize: '13px' }}>{t('settings.hideSmallAmounts.subtitle')}</div>
              </div>
            </div>
            <input type="checkbox" checked={settings.hideSmallAmounts} onChange={(e) => update('hideSmallAmounts', e.target.checked)} />
          </div>

          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Globe size={18} className="text-[#1B2B4B]/70 mt-0.5" />
              <div>
                <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '14px' }}>{t('settings.language.title')}</div>
                <div className="text-muted-foreground" style={{ fontSize: '13px' }}>{t('settings.language.subtitle')}</div>
              </div>
            </div>
            <select
              value={settings.language}
              onChange={(e) => update('language', e.target.value as UserSettings['language'])}
              className="px-3 py-2 rounded-lg border border-border bg-white text-[#1B2B4B]"
            >
              <option value="en">{t('settings.language.english')}</option>
              <option value="ro">{t('settings.language.romanian')}</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={save}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all hover:brightness-105"
        style={{ background: '#FFD100', color: '#1B2B4B', fontSize: '14px' }}
      >
        <Save size={16} />
        {saved ? t('settings.saved') : t('settings.save')}
      </button>
    </div>
  );
}
