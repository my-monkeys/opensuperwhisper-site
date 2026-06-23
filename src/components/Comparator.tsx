import { useMemo, useState } from "react";
import { MODELS, LANGUAGES, supportsLang, metrics, type Model } from "../data/models";

type Sort = "speed" | "accuracy";

function DeviceBadge({ d }: { d: Model["device"] }) {
  const cloud = d === "cloud";
  return (
    <span className="badge" data-cloud={cloud}>
      {cloud ? "☁ Cloud" : "● On-device"}
    </span>
  );
}

function Bar({ value, max, kind }: { value: number; max: number; kind: "speed" | "acc" }) {
  const pct = Math.max(4, Math.min(100, (value / max) * 100));
  return (
    <div className="bar">
      <div className="bar-fill" data-kind={kind} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Comparator() {
  const [lang, setLang] = useState<string>("any");
  const [sort, setSort] = useState<Sort>("speed");

  const rows = useMemo(() => {
    const list = MODELS.filter((m) => lang === "any" || supportsLang(m, lang)).map((m) => ({
      m,
      v: metrics(m, lang),
    }));
    list.sort((a, b) =>
      sort === "speed"
        ? (b.v.xrt ?? 0) - (a.v.xrt ?? 0)
        : (a.v.err ?? 99) - (b.v.err ?? 99)
    );
    return list;
  }, [lang, sort]);

  const maxXrt = Math.max(...rows.map((r) => r.v.xrt ?? 0), 1);
  const maxErr = Math.max(...rows.map((r) => r.v.err ?? 0), 1);
  const allMeasured = rows.length > 0 && rows.every((r) => r.v.measured);
  const someMeasured = rows.some((r) => r.v.measured);

  const track = (name: string, data?: Record<string, unknown>) =>
    (window as unknown as { umami?: { track: (n: string, d?: unknown) => void } }).umami?.track(name, data);

  return (
    <div className="comparator">
      <div className="cmp-controls">
        <label className="cmp-filter">
          <span>I want to transcribe in</span>
          <select
            value={lang}
            onChange={(e) => {
              setLang(e.target.value);
              track("compare-language", { lang: e.target.value });
            }}
          >
            <option value="any">any language</option>
            {Object.entries(LANGUAGES).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </label>
        <div className="cmp-sort">
          <span>Sort by</span>
          <button data-on={sort === "speed"} onClick={() => { setSort("speed"); track("compare-sort", { by: "speed" }); }}>Speed</button>
          <button data-on={sort === "accuracy"} onClick={() => { setSort("accuracy"); track("compare-sort", { by: "accuracy" }); }}>Accuracy</button>
        </div>
      </div>

      <div className="cmp-table" role="table">
        <div className="cmp-head" role="row">
          <span>Model</span><span>Where</span><span>Languages</span>
          <span>Speed <em>×real-time</em></span><span>Error <em>lower is better</em></span><span>Translate</span>
        </div>
        {rows.map(({ m, v }) => (
          <div className="cmp-row" role="row" key={m.id}>
            <div className="cmp-model">
              <strong>{m.label}</strong>
              <span className="cmp-engine">{m.engine} · {m.size}</span>
              {m.note && <span className="cmp-note">{m.note}</span>}
            </div>
            <div><DeviceBadge d={m.device} /></div>
            <div className="cmp-langs">{m.langs === "all" ? "99 languages" : `${m.langs.length} languages`}</div>
            <div className="cmp-metric">
              <span className="num">{v.xrt ? `${v.xrt}×` : "—"}</span>
              {v.xrt ? <Bar value={v.xrt} max={maxXrt} kind="speed" /> : null}
            </div>
            <div className="cmp-metric">
              <span className="num">
                {v.err != null ? `${v.err}%` : "—"}
                {v.err != null && !v.measured && <span className="est">est.</span>}
              </span>
              {v.err != null ? <Bar value={maxErr - v.err + 2} max={maxErr} kind="acc" /> : null}
            </div>
            <div>{m.translate ? <span className="yes">Yes</span> : <span className="no">—</span>}</div>
          </div>
        ))}
      </div>

      <p className="cmp-foot">
        {allMeasured
          ? "Measured by us on Apple Silicon over FLEURS clips — word error rate (character error rate for CJK), speed in ×real-time."
          : someMeasured
          ? "Measured on Apple Silicon over FLEURS where shown; “est.” figures are published estimates, pending our benchmark."
          : "Published estimates — our own benchmark (FLEURS, on Apple Silicon) is on the way."}
      </p>
    </div>
  );
}
