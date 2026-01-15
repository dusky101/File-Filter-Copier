import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

// Simple keyframe animation for the dialog entrance
const style = `
  @keyframes dialogOverlayShow {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes dialogContentShow {
    from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  .dialog-overlay { animation: dialogOverlayShow 0.15s cubic-bezier(0.16, 1, 0.3, 1); }
  .dialog-content { animation: dialogContentShow 0.15s cubic-bezier(0.16, 1, 0.3, 1); }
`;

export function Dialog({ open, onClose, children, className }) {
  // Inject styles once
  React.useEffect(() => {
    if (!document.getElementById("dialog-styles")) {
      const styleEl = document.createElement("style");
      styleEl.id = "dialog-styles";
      styleEl.innerHTML = style;
      document.head.appendChild(styleEl);
    }
  }, []);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center sm:items-center bg-black/40 backdrop-blur-sm dialog-overlay p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 dialog-content top-1/2 left-1/2 fixed -translate-x-1/2 -translate-y-1/2",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Icon in Top Right */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-slate-100 dark:ring-offset-slate-950 dark:focus:ring-slate-800 dark:data-[state=open]:bg-slate-800"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {children}
      </div>
    </div>,
    document.body
  );
}

export function DialogHeader({ children, className }) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left mb-4",
        className
      )}
    >
      <h2 className="text-lg font-semibold leading-none tracking-tight">
        {children}
      </h2>
    </div>
  );
}

export function DialogFooter({ children, className }) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DialogTitle({ children, className }) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function DialogDescription({ children, className }) {
  return (
    <p className={cn("text-sm text-slate-500 dark:text-slate-400", className)}>
      {children}
    </p>
  );
}
