/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { FiX, FiCheckCircle, FiAlertCircle, FiInfo } from "react-icons/fi";
const ToastCtx = createContext(null);
const icons = { success: FiCheckCircle, error: FiAlertCircle, info: FiInfo };
const tones = { success: "border-success-border bg-success-soft text-success", error: "border-danger-border bg-danger-soft text-danger", info: "border-info-border bg-info-soft text-info" };
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, tone = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => {
            const Icon = icons[t.tone] || FiInfo;
            return (
              <div key={t.id} role="status" className={`pointer-events-auto flex items-center gap-2 rounded-panel border px-4 py-3 shadow-float text-sm font-medium ${tones[t.tone] || tones.info}`}>
                <Icon className="shrink-0" aria-hidden="true" />
                <span className="flex-1">{t.message}</span>
                <button type="button" onClick={() => dismiss(t.id)} className="shrink-0 rounded p-1 hover:bg-black/5"><FiX aria-hidden="true" /></button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  );
}
export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) return { push: () => {} };
  return ctx;
}
export default ToastProvider;
