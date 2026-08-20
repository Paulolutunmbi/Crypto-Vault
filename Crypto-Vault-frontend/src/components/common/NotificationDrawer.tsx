import React from 'react';
import { X, Bell, CheckCircle2, Lock, Key, Clock, ExternalLink } from 'lucide-react';
import { useTimelock } from '../../context/TimelockContext';
import { formatAddress } from '../../utils/formatters';

export const NotificationDrawer: React.FC = () => {
  const {
    isNotifOpen,
    setIsNotifOpen,
    notifications,
    markAllNotificationsRead,
    wallet,
  } = useTimelock();

  if (!isNotifOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsNotifOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white border-l border-[#E2E1D8] shadow-2xl flex flex-col text-[#3A3D39]">
          {/* Header */}
          <div className="p-4 border-b border-[#E2E1D8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#7D8C7B]" />
              <h2 className="font-display font-bold text-sm text-[#2C332B]">Activity & Notifications</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllNotificationsRead}
                className="text-[11px] text-[#7A7E78] hover:text-[#2C332B] font-medium"
              >
                Mark all read
              </button>
              <button
                onClick={() => setIsNotifOpen(false)}
                className="text-[#7A7E78] hover:text-[#2C332B] p-1.5 rounded-lg hover:bg-[#F0F1ED]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {notifications.length > 0 ? (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border text-xs flex flex-col gap-1.5 transition-colors ${
                    notif.read
                      ? 'bg-[#F9F9F7] border-[#E2E1D8] text-[#7A7E78]'
                      : 'bg-white border-[#7D8C7B] text-[#2C332B] shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-[#2C332B]">
                      {notif.type === 'lock' && <Lock className="w-3.5 h-3.5 text-[#7D8C7B]" />}
                      {notif.type === 'withdraw' && <Key className="w-3.5 h-3.5 text-[#558755]" />}
                      {notif.type === 'unlock' && <CheckCircle2 className="w-3.5 h-3.5 text-[#558755]" />}
                      <span>{notif.title}</span>
                    </div>
                    <span className="text-[10px] text-[#7A7E78]">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-[#7A7E78] text-[11px] leading-relaxed">{notif.message}</p>

                  {notif.txHash && (
                    <a
                      href={`${wallet.network.explorerUrl}/tx/${notif.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-[#7D8C7B] hover:text-[#2C332B] hover:underline flex items-center gap-1 font-mono-numbers mt-1"
                    >
                      <span>Tx: {formatAddress(notif.txHash, 6, 4)}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-[#7A7E78]">
                No notifications to display.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
