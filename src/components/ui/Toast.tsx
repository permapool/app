"use client";

import React, { forwardRef, useImperativeHandle, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Variant = "default" | "success" | "error" | "warning";
type Position =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

interface ActionButton {
  label: string;
  onClick: () => void;
}

interface ToasterProps {
  title?: string;
  message: string;
  variant?: Variant;
  duration?: number;
  position?: Position;
  actions?: ActionButton;
  onDismiss?: () => void;
}

// extend props to include id internally
interface ToastItem extends ToasterProps {
  id: number;
}

export interface ToasterRef {
  show: (props: ToasterProps) => void;
}

const variantStyles: Record<Variant, string> = {
  default: "bg-background text-foreground",
  success: "bg-[oklch(76.5%_0.177_163.223)] border-green text-foreground",
  error: "bg-red-300 border-red-600 text-foreground",
  warning: "bg-yellow-300 text-foreground",
};

const toastAnimation = {
  initial: { opacity: 0, y: 40, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 40, scale: 0.95 },
};

const positionClasses: Record<Position, string> = {
  "top-left": "top-[12%] left-4 items-start",
  "top-center": "top-[12%] left-1/2 -translate-x-1/2 items-center",
  "top-right": "top-[12%] right-4 items-end",
  "bottom-left": "bottom-4 left-4 items-start",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "bottom-4 right-4 items-end",
};

const Toaster = forwardRef<ToasterRef, { defaultPosition?: Position }>(
  ({ defaultPosition = "bottom-right" }, ref) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    useImperativeHandle(ref, () => ({
      show(props: ToasterProps) {
        const id = Date.now();
        const toast: ToastItem = { ...props, id };

        setToasts((prev) => [...prev, toast]);

        if (props.duration !== 0) {
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
            props.onDismiss?.();
          }, props.duration || 4000);
        }
      },
    }));

    return (
      <div className="fixed inset-0 pointer-events-none">
        {(
          [
            "top-left",
            "top-center",
            "top-right",
            "bottom-left",
            "bottom-center",
            "bottom-right",
          ] as Position[]
        ).map((pos) => (
          <div
            key={pos}
            className={`absolute flex flex-col gap-6 ${positionClasses[pos]}`}
          >
            <AnimatePresence>
              {toasts
                .filter((t) => (t.position || defaultPosition) === pos)
                .map((t) => (
                  <motion.div
                    key={t.id}
                    variants={toastAnimation}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.25 }}
                    className={`pointer-events-auto flex items-start gap-1 px-4 py-1 shadow-solid border-[1px] border-foreground ${
                      variantStyles[t.variant || "default"]
                    }`}
                  >
                    <div className="flex-1">
                      {t.title && (
                        <h3 className="text-foreground">{t.title}</h3>
                      )}
                      <p className="text-sm font-light">{t.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.actions && (
                        <button
                          onClick={() => {
                            t.actions?.onClick();
                            setToasts((prev) =>
                              prev.filter((x) => x.id !== t.id)
                            );
                          }}
                          className="text-sm underline"
                        >
                          {t.actions.label}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        ))}
      </div>
    );
  }
);

Toaster.displayName = "Toaster";

export default Toaster;
