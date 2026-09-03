import Panel from "./Panel.jsx";

/**
 * Shown when a list is empty or nothing matched a filter. An empty screen is
 * an invitation to act, so it always says what to do next.
 */
export default function EmptyState({ title, children, action }) {
  return (
    <Panel surface="dashed" className="text-center">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>

      {children ? (
        <p className="mx-auto mt-2 max-w-[46ch] text-sm text-ink-3">
          {children}
        </p>
      ) : null}

      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </Panel>
  );
}
