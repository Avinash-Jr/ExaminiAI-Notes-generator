import { cx } from "../../lib/cx.js";

/**
 * Page opening. The title is the hero: set large, tight and left aligned
 * against the same edge as the copy beneath it, matching Home's display type.
 *
 * `meta` renders as a description list rather than a run-on string, because an
 * effective date and a version are two separate labelled facts.
 */
export default function PageHeader({ title, standfirst, meta, actions }) {
  return (
    <header className="border-b border-line pb-8 sm:pb-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="max-w-2xl text-balance text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          {title}
        </h1>

        {actions ? <div className="flex shrink-0 gap-3">{actions}</div> : null}
      </div>

      {standfirst ? (
        <p className="mt-5 max-w-[58ch] font-read text-read text-ink-2">
          {standfirst}
        </p>
      ) : null}

      {meta?.length ? (
        <dl className={cx("mt-7 flex flex-wrap gap-x-10 gap-y-3 text-fine")}>
          {meta.map((item) => (
            <div key={item.label}>
              <dt className="text-ink-3">{item.label}</dt>
              <dd className="mt-0.5 font-medium text-ink" data-numeric>
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </header>
  );
}
