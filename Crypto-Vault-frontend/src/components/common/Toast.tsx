import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useTimelock } from '../../context/TimelockContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useTimelock();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 bg-white transition-all transform animate-in fade-in slide-in-from-bottom-2 duration-200 ${
              isSuccess
                ? 'border-[#86B086]/60 text-[#2C332B]'
                : isError
                ? 'border-[#D97706]/60 text-[#2C332B]'
                : 'border-[#E2E1D8] text-[#2C332B]'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#558755] shrink-0 mt-0.5" />}
            {isError && <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />}
            {isInfo && <Info className="w-4 h-4 text-[#7D8C7B] shrink-0 mt-0.5" />}

            <div className="flex-1">
              <div className="text-xs font-bold text-[#2C332B]">{toast.title}</div>
              {toast.message && (
                <div className="text-[11px] text-[#7A7E78] mt-0.5 leading-snug">
                  {toast.message}
                </div>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#7A7E78] hover:text-[#2C332B] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
