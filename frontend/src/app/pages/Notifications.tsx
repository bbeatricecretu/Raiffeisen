import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, CircleAlert, Clock3, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { api } from '../services/api';
import { useI18n } from '../i18n';

type NotificationItem = {
  id: string;
  title: string;
  subtitle: string;
  when: string;
  kind: 'warning' | 'info' | 'success';
  action?: {
    inviteId: string;
    senderId: string;
  };
};

export function Notifications() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushAlertsEnabled, setPushAlertsEnabled] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      const userId = localStorage.getItem('userId') || 'me';

      if (userId !== 'me') {
        try {
          const prefs = await api.getUserPreferences(userId);
          setPushAlertsEnabled(!!prefs.push_alerts);
          if (!prefs.push_alerts) {
            setItems([]);
            setLoading(false);
            return;
          }
        } catch {
          // Fallback to local settings when backend pref is unavailable
          try {
            const local = localStorage.getItem('app-settings');
            if (local) {
              const parsed = JSON.parse(local) as { pushAlerts?: boolean };
              if (parsed.pushAlerts === false) {
                setPushAlertsEnabled(false);
                setItems([]);
                setLoading(false);
                return;
              }
            }
          } catch {
            // Ignore malformed local storage payloads.
          }
        }
      }

      try {
        const connectionInvites = await api.getConnectionInvites(userId, 'pending');
        const inviteItems = Array.isArray(connectionInvites)
          ? connectionInvites.slice(0, 20).map((invite: any) => ({
              id: `connect-${invite.id}`,
              title: `${invite.sender_name || 'Someone'} sent you a connection invite`,
              subtitle: invite.sender_career || 'Tap to accept and connect.',
              when: invite.created_at || 'Recently',
              kind: 'info' as const,
              action: {
                inviteId: invite.id,
                senderId: invite.sender_id,
              },
            }))
          : [];

        const pending = await api.getUserConfirmations(userId, 'pending');
        const pendingItems = Array.isArray(pending)
          ? pending.slice(0, 20).map((conf: any) => ({
              id: conf.id,
              title: `${t('notifications.confirmationRequired')} ${conf.merchant || t('notifications.unknownMerchant')}`,
              subtitle: `${(conf.amount || 0).toFixed(2)} ${conf.currency || 'RON'} • ${conf.category || t('notifications.category.transaction')}`,
              when: conf.created_at || conf.date || 'Recently',
              kind: 'warning' as const,
            }))
          : [];

        const staticItems: NotificationItem[] = [
          {
            id: 'profile-security',
            title: t('notifications.security.title'),
            subtitle: t('notifications.security.subtitle'),
            when: t('notifications.today'),
            kind: 'info',
          },
          {
            id: 'statement-ready',
            title: t('notifications.statement.title'),
            subtitle: t('notifications.statement.subtitle'),
            when: t('notifications.yesterday'),
            kind: 'success',
          },
        ];

        setItems([...inviteItems, ...pendingItems, ...staticItems]);
      } catch (error) {
        console.error('Failed to load notifications', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [t]);

  const iconForKind = (kind: NotificationItem['kind']) => {
    if (kind === 'warning') return <CircleAlert size={18} className="text-amber-500" />;
    if (kind === 'success') return <CheckCircle2 size={18} className="text-emerald-500" />;
    return <Bell size={18} className="text-[#1B2B4B]/70" />;
  };

  const handleInviteAction = async (inviteId: string, status: 'accepted' | 'rejected') => {
    const userId = localStorage.getItem('userId') || 'me';
    try {
      await api.respondConnectionInvite(inviteId, userId, status);
      setItems((prev) => prev.filter((it) => it.action?.inviteId !== inviteId));
    } catch (error) {
      console.error('Failed to respond to invite', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#FFD10020' }}>
            <Bell size={24} className="text-[#1B2B4B]" />
          </div>
          <div>
            <h1 className="font-bold text-[#1B2B4B]" style={{ fontSize: '22px' }}>{t('notifications.title')}</h1>
            <p className="text-muted-foreground" style={{ fontSize: '13px' }}>
              {t('notifications.subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/app/confirm')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all hover:brightness-105"
          style={{ background: '#FFD100', color: '#1B2B4B', fontSize: '14px' }}
        >
          {t('notifications.review')}
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border" style={{ background: '#1B2B4B' }}>
          <h2 className="font-semibold text-white" style={{ fontSize: '15px' }}>{t('notifications.section.recent')}</h2>
        </div>

        {!pushAlertsEnabled ? (
          <div className="p-6 text-muted-foreground" style={{ fontSize: '14px' }}>
            In-app notifications are turned off in Settings.
          </div>
        ) : loading ? (
          <div className="p-6 text-muted-foreground" style={{ fontSize: '14px' }}>{t('notifications.loading')}</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-muted-foreground" style={{ fontSize: '14px' }}>{t('notifications.empty')}</div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="px-6 py-4 flex items-start gap-3 hover:bg-black/5 transition-colors">
                <div className="mt-0.5">{iconForKind(item.kind)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#1B2B4B]" style={{ fontSize: '14px' }}>{item.title}</div>
                  <div className="text-muted-foreground mt-0.5" style={{ fontSize: '13px' }}>{item.subtitle}</div>
                  {item.action && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleInviteAction(item.action!.inviteId, 'accepted')}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                        style={{ background: '#FFD100', color: '#1B2B4B' }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleInviteAction(item.action!.inviteId, 'rejected')}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-border text-muted-foreground hover:text-[#1B2B4B]"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground shrink-0" style={{ fontSize: '12px' }}>
                  <Clock3 size={13} />
                  {item.when}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
