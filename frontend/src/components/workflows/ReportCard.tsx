"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, CircleSlash, FlaskConical } from "lucide-react";
import { fetchReportCard, type ReportCard as Report, type ReportCardMarket, type ReportCardModel } from "@/lib/api";

const DEEP_MODELS = new Set(["CNN_BiLSTM_Attention", "TimeSeriesTransformer", "AdvancedBiLSTM"]);

const MODEL_LABELS: Record<string, string> = {
  RandomWalk: "Random walk",
  HistoricalMean: "Historical mean",
  Momentum20: "20-day momentum",
  Ridge: "Ridge regression",
  GradientBoosting: "Gradient boosting",
  CNN_BiLSTM_Attention: "CNN-BiLSTM-Attention",
  TimeSeriesTransformer: "Transformer",
  AdvancedBiLSTM: "BiLSTM",
};

// Emphasis encoding: served deep models in the accent, baselines in a neutral gray.
// Validated against the chart surface (#0e0e14): lightness, CVD separation and contrast pass.
const ACCENT = "#f0601f";
const BASELINE = "#6b6b75";

const label = (m: string) => MODEL_LABELS[m] ?? m;
const fmt = (x: number | null | undefined, digits = 2, suffix = "") =>
  x === null || x === undefined || !Number.isFinite(x) ? "–" : `${x.toFixed(digits)}${suffix}`;
const fmtP = (p: number | null | undefined) =>
  p === null || p === undefined ? "–" : p < 0.001 ? "<0.001" : p.toFixed(3);

interface ReportCardProps {
  selectedMarket: string;
}

export default function ReportCard({ selectedMarket }: ReportCardProps) {
  // undefined = loading, null = not generated yet
  const [report, setReport] = useState<Report | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [market, setMarket] = useState<string>("");

  useEffect(() => {
    let active = true;
    fetchReportCard()
      .then((r) => active && setReport(r))
      .catch((e) => active && setError(String(e.message ?? e)));
    return () => {
      active = false;
    };
  }, []);

  const marketNames = useMemo(() => (report ? Object.keys(report.markets) : []), [report]);

  useEffect(() => {
    if (!marketNames.length) return;
    setMarket((current) =>
      marketNames.includes(current) ? current : marketNames.includes(selectedMarket) ? selectedMarket : marketNames[0],
    );
  }, [marketNames, selectedMarket]);

  if (error) return <Notice title="Report card unavailable" body={error} />;
  if (report === undefined) return <Notice title="Loading report card…" body="Fetching out-of-sample results from the API." />;
  if (report === null) {
    return (
      <Notice
        title="Report card not generated yet"
        body="Run the walk-forward evaluation on the backend, commit reports/report_card.json, and redeploy the API."
        code="python build_report_card.py --baselines-only   # minutes\npython build_report_card.py                    # every model; hours on CPU"
      />
    );
  }

  const data = report.markets[market];
  const order = report.config.models.filter((m) => data?.models[m]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full flex flex-col gap-6"
    >
      <Header report={report} />

      {marketNames.length > 1 && (
        <div role="tablist" aria-label="Market" className="flex flex-wrap gap-2">
          {marketNames.map((name) => (
            <button
              key={name}
              role="tab"
              aria-selected={name === market}
              onClick={() => setMarket(name)}
              className={`px-3 py-2 min-h-[36px] rounded border font-label-sm text-[12px] transition-colors ${
                name === market
                  ? "bg-surface-container-highest border-outline text-on-surface"
                  : "bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {data && (
        <>
          <Verdict data={data} order={order} />
          <SharpeChart data={data} order={order} />
          <ModelTable data={data} order={order} />
        </>
      )}

      <SummaryTable report={report} />
      <HowToRead />
    </motion.div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`p-5 rounded-[10px] border border-outline-variant/30 bg-surface-container/90 ${className}`}>
      {children}
    </section>
  );
}

function Notice({ title, body, code }: { title: string; body: string; code?: string }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <FlaskConical className="w-5 h-5 text-outline shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0">
          <h3 className="font-headline-md text-on-surface mb-1">{title}</h3>
          <p className="font-body-md text-[13px] text-on-surface-variant">{body}</p>
          {code && (
            <pre className="mt-3 p-3 rounded bg-[#08080a] border border-outline-variant/30 text-[12px] text-on-surface overflow-x-auto">
              {code}
            </pre>
          )}
        </div>
      </div>
    </Card>
  );
}

function Header({ report }: { report: Report }) {
  const c = report.config;
  const chips = [
    `${c.n_folds} walk-forward folds`,
    `${c.cost_bps} bps costs`,
    `${(c.deadband * 100).toFixed(1)}% deadband`,
    "Long / flat",
    `Generated ${report.generated_at.slice(0, 10)}`,
  ];
  return (
    <Card>
      <span className="font-label-sm text-[11px] text-outline uppercase tracking-widest">Model Report Card</span>
      <h2 className="font-display-md text-[24px] md:text-[28px] text-on-surface mt-1 mb-2">
        Does any model beat a coin flip, or buying and holding?
      </h2>
      <p className="font-body-md text-[13px] text-on-surface-variant max-w-3xl">
        Every model is retrained on an expanding window and scored on the same out-of-sample days it never saw.
        Forecasts are tested against a zero-return random walk; the strategy built from them is tested against
        buy-and-hold, with a correction for having tried every model on the same data.
      </p>
      <div className="flex flex-wrap gap-2 mt-4">
        {chips.map((chip) => (
          <span key={chip} className="px-2 py-1 rounded border border-outline-variant/30 bg-[#08080a] font-label-sm text-[11px] text-on-surface-variant">
            {chip}
          </span>
        ))}
      </div>
    </Card>
  );
}

function Verdict({ data, order }: { data: ReportCardMarket; order: string[] }) {
  const models = order.map((m) => [m, data.models[m]] as const);
  const skilled = models.filter(([, r]) => r.forecast_skill);
  const edged = models.filter(([, r]) => r.strategy_edge);
  const best = models.reduce<[string, ReportCardModel] | null>(
    (acc, cur) => ((cur[1].sharpe ?? -Infinity) > (acc?.[1].sharpe ?? -Infinity) ? [cur[0], cur[1]] : acc),
    null,
  );
  const bh = data.buy_and_hold.sharpe;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Tile
        label="Forecast skill"
        value={`${skilled.length} of ${models.length}`}
        detail={skilled.length ? `Beat the random walk: ${skilled.map(([m]) => label(m)).join(", ")}` : "No model beat a zero-return forecast (p < 0.05)"}
        ok={skilled.length > 0}
      />
      <Tile
        label="Best strategy Sharpe"
        value={best ? fmt(best[1].sharpe) : "–"}
        detail={best ? `${label(best[0])} · buy & hold ${fmt(bh)}` : ""}
        ok={null}
      />
      <Tile
        label="Survives selection bias"
        value={`${edged.length} of ${models.length}`}
        detail={edged.length ? `Deflated Sharpe > 0.95: ${edged.map(([m]) => label(m)).join(", ")}` : "No Sharpe ratio is distinguishable from luck after trying every model"}
        ok={edged.length > 0}
      />
    </div>
  );
}

// `ok` null = informational only (no pass/fail icon): a higher point estimate is not a win
// when the confidence intervals overlap.
function Tile({ label: title, value, detail, ok }: { label: string; value: string; detail: string; ok: boolean | null }) {
  const Icon = ok === null ? null : ok ? CheckCircle2 : CircleSlash;
  return (
    <div className="p-4 rounded-[10px] border border-outline-variant/30 bg-[#08080a] flex flex-col gap-1">
      <span className="font-label-sm text-[10px] uppercase tracking-widest text-outline">{title}</span>
      <span className="font-mono text-[28px] leading-tight text-on-surface">{value}</span>
      <span className="flex items-start gap-1.5 font-body-md text-[12px] text-on-surface-variant">
        {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${ok ? "text-[var(--profit)]" : "text-outline"}`} aria-hidden />}
        {detail}
      </span>
    </div>
  );
}

function SharpeChart({ data, order }: { data: ReportCardMarket; order: string[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const bh = data.buy_and_hold.sharpe;

  const values = order.flatMap((m) => {
    const r = data.models[m];
    return [r.sharpe, ...r.sharpe_ci_95];
  });
  const finite = [...values, bh, 0].filter((v): v is number => v !== null && Number.isFinite(v));
  const pad = 0.1;
  const lo = Math.floor((Math.min(...finite) - pad) * 2) / 2;
  const hi = Math.ceil((Math.max(...finite) + pad) * 2) / 2;
  const x = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const ticks: number[] = [];
  for (let t = lo; t <= hi + 1e-9; t += 0.5) ticks.push(Math.round(t * 10) / 10);

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h3 className="font-headline-md text-on-surface">Strategy Sharpe ratio, with 95% confidence interval</h3>
        <div className="flex items-center gap-4 font-label-sm text-[11px] text-on-surface-variant">
          <LegendDot color={ACCENT} text="Served deep model" />
          <LegendDot color={BASELINE} text="Baseline" />
        </div>
      </div>
      <p className="font-body-md text-[12px] text-on-surface-variant mb-4">
        {data.ticker} · {data.start} to {data.end} · {data.n_test_bars.toLocaleString()} out-of-sample days, net of costs.
        An interval that crosses zero is indistinguishable from no edge.
      </p>

      <div className="relative pt-6">
      {/* Reference lines over the plotting column: zero, and the buy-and-hold Sharpe */}
      <div className="absolute top-0 bottom-6 left-[112px] md:left-[168px] right-0 pointer-events-none" aria-hidden>
        <div className="absolute top-6 bottom-0 w-px bg-outline-variant/60" style={{ left: `${x(0)}%` }} />
        {bh !== null && (
          <>
            <div className="absolute top-6 bottom-0 border-l border-dashed border-on-surface-variant/70" style={{ left: `${x(bh)}%` }} />
            <span
              className="absolute top-0 whitespace-nowrap font-label-sm text-[10px] text-on-surface-variant"
              style={{ left: `${x(bh)}%`, transform: `translateX(${x(bh) > 80 ? "-100%" : x(bh) < 20 ? "0" : "-50%"})` }}
            >
              Buy & hold {fmt(bh)}
            </span>
          </>
        )}
      </div>
      <div className="grid grid-cols-[112px_1fr] md:grid-cols-[168px_1fr]">
        {order.map((m) => {
          const r = data.models[m];
          const [ciLo, ciHi] = r.sharpe_ci_95;
          const color = DEEP_MODELS.has(m) ? ACCENT : BASELINE;
          const active = hover === m;
          return (
            <div
              key={m}
              className="contents"
              onMouseEnter={() => setHover(m)}
              onMouseLeave={() => setHover(null)}
            >
              <div className={`h-9 flex items-center pr-3 font-label-sm text-[12px] truncate ${active ? "text-on-surface" : "text-on-surface-variant"}`}>
                {label(m)}
              </div>
              <div className={`relative h-9 ${active ? "bg-white/[0.03]" : ""}`}>
                {ciLo !== null && ciHi !== null && (
                  <div
                    className="absolute top-1/2 h-[2px] -translate-y-1/2 rounded-full"
                    style={{ left: `${x(ciLo)}%`, width: `${x(ciHi) - x(ciLo)}%`, background: color, opacity: 0.55 }}
                  />
                )}
                {r.sharpe !== null && (
                  <div
                    className="absolute top-1/2 w-[10px] h-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[#0e0e14]"
                    style={{ left: `${x(r.sharpe)}%`, background: color }}
                  />
                )}
                {active && r.sharpe !== null && (
                  <div
                    role="tooltip"
                    className="absolute z-30 bottom-full mb-1 px-3 py-2 rounded border border-outline-variant/50 bg-[#0e0e14] shadow-xl font-mono text-[11px] text-on-surface whitespace-nowrap pointer-events-none"
                    style={{ left: `${Math.min(Math.max(x(r.sharpe), 20), 80)}%`, transform: "translateX(-50%)" }}
                  >
                    <div className="font-label-sm text-[11px] text-on-surface mb-1">{label(m)}</div>
                    <div className="text-on-surface-variant">Sharpe {fmt(r.sharpe)} [{fmt(ciLo)}, {fmt(ciHi)}]</div>
                    <div className="text-on-surface-variant">Return {fmt(r.total_return, 1, "%")} · max DD {fmt(r.max_drawdown, 1, "%")}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Axis row */}
        <div />
        <div className="relative h-6 border-t border-outline-variant/30">
          {ticks.map((t) => (
            <span key={t} className="absolute top-1 -translate-x-1/2 font-mono text-[10px] text-outline" style={{ left: `${x(t)}%` }}>
              {t.toFixed(1)}
            </span>
          ))}
        </div>
      </div>
      </div>
    </Card>
  );
}

function LegendDot({ color, text }: { color: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      {text}
    </span>
  );
}

function Significance({ p, children }: { p: number | null; children: React.ReactNode }) {
  const sig = p !== null && p < 0.05;
  return (
    <span className="inline-flex items-center gap-1">
      {children}
      {sig && (
        <span className="px-1.5 py-0.5 rounded bg-[var(--profit)]/10 text-[var(--profit)] text-[10px] font-label-sm">significant</span>
      )}
    </span>
  );
}

function ModelTable({ data, order }: { data: ReportCardMarket; order: string[] }) {
  const bh = data.buy_and_hold;
  const th = "px-2.5 py-2 font-label-sm text-[10px] uppercase tracking-wider text-outline font-normal text-left whitespace-nowrap";
  const td = "px-2.5 py-2 font-mono text-[12px] text-on-surface whitespace-nowrap";
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="font-headline-md text-on-surface">Detailed results</h3>
        <p className="font-body-md text-[12px] text-on-surface-variant">
          p-values below 0.05 are marked significant. Directional accuracy is tested against a coin flip; the
          Diebold-Mariano test compares forecast errors with the random walk&apos;s.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-[#08080a]">
            <tr>
              <th className={th}>Model</th>
              <th className={th} title="Directional accuracy (p-value vs a coin flip)">Dir. acc. (p)</th>
              <th className={th}>DM p vs RW</th>
              <th className={th}>Sharpe [95% CI]</th>
              <th className={th}>Return</th>
              <th className={th}>Max DD</th>
              <th className={th}>Exposure</th>
              <th className={th} title="Deflated Sharpe ratio">DSR</th>
            </tr>
          </thead>
          <tbody>
            {order.map((m) => {
              const r = data.models[m];
              return (
                <tr key={m} className="border-t border-outline-variant/20">
                  <td className={`${td} font-label-sm`}>
                    <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: DEEP_MODELS.has(m) ? ACCENT : BASELINE }} />
                    {label(m)}
                  </td>
                  <td className={td}>
                    {r.directional_accuracy === null ? "–" : (
                      <Significance p={r.directional_p_value}>
                        {fmt(r.directional_accuracy, 1, "%")} <span className="text-outline">({fmtP(r.directional_p_value)})</span>
                      </Significance>
                    )}
                  </td>
                  <td className={td}>
                    {m === "RandomWalk" ? <span className="text-outline">benchmark</span> : (
                      <Significance p={r.dm_p_value_vs_random_walk}>{fmtP(r.dm_p_value_vs_random_walk)}</Significance>
                    )}
                  </td>
                  <td className={td}>
                    {fmt(r.sharpe)} <span className="text-outline">[{fmt(r.sharpe_ci_95[0])}, {fmt(r.sharpe_ci_95[1])}]</span>
                  </td>
                  <td className={`${td} ${(r.total_return ?? 0) >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"}`}>{fmt(r.total_return, 1, "%")}</td>
                  <td className={td}>{fmt(r.max_drawdown, 1, "%")}</td>
                  <td className={td}>{fmt(r.exposure, 0, "%")}</td>
                  <td className={td}>{fmt(r.dsr)}</td>
                </tr>
              );
            })}
            <tr className="border-t border-outline-variant/40 bg-[#08080a]/60">
              <td className={`${td} font-label-sm italic text-on-surface-variant`}>Buy & hold</td>
              <td className={td} />
              <td className={td} />
              <td className={td}>
                {fmt(bh.sharpe)} <span className="text-outline">[{fmt(bh.sharpe_ci_95[0])}, {fmt(bh.sharpe_ci_95[1])}]</span>
              </td>
              <td className={`${td} ${(bh.total_return ?? 0) >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"}`}>{fmt(bh.total_return, 1, "%")}</td>
              <td className={td}>{fmt(bh.max_drawdown, 1, "%")}</td>
              <td className={td}>100%</td>
              <td className={td} />
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SummaryTable({ report }: { report: Report }) {
  const th = "px-2.5 py-2 font-label-sm text-[10px] uppercase tracking-wider text-outline font-normal text-left whitespace-nowrap";
  const td = "px-2.5 py-2 font-mono text-[12px] text-on-surface whitespace-nowrap";
  const rows = Object.entries(report.summary);
  if (Object.keys(report.markets).length < 2) return null;
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="font-headline-md text-on-surface">Across all markets</h3>
        <p className="font-body-md text-[12px] text-on-surface-variant">How often each model clears each bar, out of the markets evaluated.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-[#08080a]">
            <tr>
              <th className={th}>Model</th>
              <th className={th}>Forecast skill</th>
              <th className={th}>Survives selection bias</th>
              <th className={th}>Beats buy & hold</th>
              <th className={th}>Median Sharpe</th>
              <th className={th}>Median directional acc.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([m, s]) => (
              <tr key={m} className="border-t border-outline-variant/20">
                <td className={`${td} font-label-sm`}>{label(m)}</td>
                <td className={td}>{s.markets_with_forecast_skill}/{s.markets}</td>
                <td className={td}>{s.markets_with_strategy_edge}/{s.markets}</td>
                <td className={td}>{s.markets_beating_buy_and_hold}/{s.markets}</td>
                <td className={td}>{fmt(s.median_sharpe)}</td>
                <td className={td}>{fmt(s.median_directional_accuracy, 1, "%")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function HowToRead() {
  const items = [
    ["Random walk", "Forecasts a zero return every day, so its strategy is the MA20/MA50 trend filter on its own. A model only adds value if it beats this row."],
    ["Directional accuracy", "Share of days where the forecast's sign was right, excluding zero forecasts. 50% is a coin flip."],
    ["Diebold-Mariano p", "Chance of seeing forecast errors this much lower than the random walk's if the model had no skill."],
    ["Exposure", "Share of days with a position. Forecasts inside the deadband leave the model leg flat."],
    ["Deflated Sharpe", "Probability the Sharpe ratio is real after accounting for trying every model on the same data. Above 0.95 counts as an edge."],
  ];
  return (
    <details className="group rounded-[10px] border border-outline-variant/30 bg-surface-container/90 p-5">
      <summary className="cursor-pointer font-headline-md text-on-surface list-none flex justify-between items-center">
        How to read this
        <span className="text-outline text-[12px] font-label-sm group-open:hidden">Show</span>
        <span className="text-outline text-[12px] font-label-sm hidden group-open:inline">Hide</span>
      </summary>
      <dl className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
        {items.map(([term, desc]) => (
          <div key={term}>
            <dt className="font-label-sm text-[12px] text-on-surface">{term}</dt>
            <dd className="font-body-md text-[12px] text-on-surface-variant">{desc}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
