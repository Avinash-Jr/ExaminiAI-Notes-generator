import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * A modal dialog: heading, body, and a footer for the actions.
 *
 * Rendered through a portal on `document.body`. The pages that open one sit
 * inside animated wrappers, and a transformed ancestor becomes the containing
 * block for `position: fixed` — a dialog rendered in place would be positioned
 * against, and clipped by, whatever opened it.
 *
 * A sheet rising from the bottom edge on a phone, a centred card from sm up.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}) {
  const panel = useRef(null);
  const restoreTo = useRef(null);
  const headingId = useId();
  const descriptionId = useId();
  const reduceMotion = useReducedMotion();

  /* Remember where focus came from, so closing puts it back on the control
     that opened the dialog rather than at the top of the document. */
  useEffect(() => {
    if (!open) return;

    restoreTo.current = document.activeElement;

    return () => {
      const target = restoreTo.current;

      if (target instanceof HTMLElement && document.contains(target)) {
        target.focus();
      }
    };
  }, [open]);

  /* The page behind a dialog must not scroll: on a phone the sheet and the
     page compete for the same drag otherwise. */
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /* Move focus in once the panel exists, preferring the first control so the
     dialog is usable from the keyboard straight away. */
  useEffect(() => {
    if (!open) return;

    const first = panel.current?.querySelector(FOCUSABLE);

    (first instanceof HTMLElement ? first : panel.current)?.focus();
  }, [open]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();

        return;
      }

      if (event.key !== "Tab") return;

      /* Keep Tab inside the dialog: a modal that leaks focus to the page
         behind it is only visually modal. */
      const items = Array.from(
        panel.current?.querySelectorAll(FOCUSABLE) ?? [],
      ).filter((node) => node.offsetParent !== null);

      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    },
    [onClose],
  );

  const rise = reduceMotion ? 0 : 24;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
          onKeyDown={handleKeyDown}
        >
          {/* Dimmed page behind. A click here closes, which is what everyone
              expects, so it is a real button for anyone who cannot click. */}
          <motion.button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/45 backdrop-blur-sm"
            tabIndex={-1}
          />

          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: rise, scale: reduceMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: rise, scale: reduceMotion ? 1 : 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="
              relative flex max-h-[92dvh] w-full flex-col
              rounded-t-panel border border-line bg-sheet shadow-2xl
              sm:max-h-[86dvh] sm:max-w-lg sm:rounded-panel
            "
          >
            <div className="flex items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
              <div className="min-w-0">
                <h2
                  id={headingId}
                  className="text-lg font-bold tracking-tight text-ink sm:text-xl"
                >
                  {title}
                </h2>

                {description ? (
                  <p
                    id={descriptionId}
                    className="mt-1.5 max-w-[52ch] text-sm text-ink-3"
                  >
                    {description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="-m-1.5 shrink-0 rounded-chip p-1.5 text-ink-3 transition-colors hover:bg-band hover:text-ink"
              >
                <FiX aria-hidden="true" className="size-5" />
                <span className="sr-only">Close</span>
              </button>
            </div>

            {/* The body scrolls, not the whole sheet, so the actions below stay
                reachable on a short screen. */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              {children}
            </div>

            {footer ? (
              <div className="border-t border-line p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
