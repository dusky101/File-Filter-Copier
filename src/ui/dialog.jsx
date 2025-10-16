import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";

export function Dialog({ open, onClose, children }) {
  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 rounded-2xl shadow-xl w-[90%] max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function DialogHeader({ children }) {
  return <h2 className="text-lg font-semibold mb-3">{children}</h2>;
}

export function DialogFooter({ children }) {
  return <div className="mt-5 flex justify-end gap-3">{children}</div>;
}
