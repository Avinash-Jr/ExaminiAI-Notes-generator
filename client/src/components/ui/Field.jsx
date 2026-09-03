import { cx } from "../../lib/cx.js";

const control = [
  "w-full rounded-chip border bg-sheet px-3.5 py-2.5",
  "text-[0.9375rem] text-ink placeholder:text-ink-3/70",
  "transition-colors duration-150",
].join(" ");

const state = (invalid) =>
  invalid
    ? "border-brand focus:border-brand"
    : "border-line-firm hover:border-ink-3 focus:border-ink";

/**
 * A labelled form row. The label stays visible — a placeholder-only field
 * loses its name the moment someone starts typing.
 *
 * `children` is a render function so the field owns the wiring between label,
 * hint, error and control: ids and aria attributes cannot drift apart.
 */
export function Field({ id, label, hint, error, optional, children }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
        {optional ? (
          <span className="ml-2 font-normal text-ink-3">optional</span>
        ) : null}
      </label>

      {hint ? (
        <p id={hintId} className="mt-1 text-fine text-ink-3">
          {hint}
        </p>
      ) : null}

      <div className="mt-2">
        {children({
          id,
          invalid: Boolean(error),
          describedBy: [hintId, errorId].filter(Boolean).join(" ") || undefined,
        })}
      </div>

      {error ? (
        <p id={errorId} className="mt-2 text-fine font-medium text-brand">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ invalid, describedBy, className, ...rest }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cx(control, state(invalid), className)}
      {...rest}
    />
  );
}

export function Textarea({ invalid, describedBy, className, ...rest }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cx(
        control,
        state(invalid),
        "min-h-40 resize-y leading-relaxed",
        className,
      )}
      {...rest}
    />
  );
}

export function Select({ invalid, describedBy, className, children, ...rest }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cx(control, state(invalid), className)}
      {...rest}
    >
      {children}
    </select>
  );
}
