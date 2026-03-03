// Historical Alberta electricity rate data (approximate, ¢/kWh)
// Source: Alberta Utilities Commission historical rate data
const rateData = [
  { year: 2010, rate: 10.2 },
  { year: 2011, rate: 10.8 },
  { year: 2012, rate: 11.1 },
  { year: 2013, rate: 11.4 },
  { year: 2014, rate: 11.8 },
  { year: 2015, rate: 12.0 },
  { year: 2016, rate: 11.6 },
  { year: 2017, rate: 12.3 },
  { year: 2018, rate: 13.1 },
  { year: 2019, rate: 13.6 },
  { year: 2020, rate: 13.2 },
  { year: 2021, rate: 13.8 },
  { year: 2022, rate: 15.0 },
  { year: 2023, rate: 16.1 },
  { year: 2024, rate: 16.8 },
];

// SVG chart dimensions
const SVG_W = 760;
const SVG_H = 260;
const PAD_L = 52;
const PAD_R = 24;
const PAD_T = 20;
const PAD_B = 44;

const chartW = SVG_W - PAD_L - PAD_R;
const chartH = SVG_H - PAD_T - PAD_B;

const minRate = 9.5;
const maxRate = 18;
const minYear = rateData[0].year;
const maxYear = rateData[rateData.length - 1].year;
const yearRange = maxYear - minYear;
const rateRange = maxRate - minRate;

function toX(year: number) {
  return PAD_L + ((year - minYear) / yearRange) * chartW;
}

function toY(rate: number) {
  return PAD_T + chartH - ((rate - minRate) / rateRange) * chartH;
}

const points = rateData.map((d) => ({ x: toX(d.year), y: toY(d.rate), ...d }));

// Build SVG path
const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
const areaPath =
  linePath +
  ` L ${points[points.length - 1].x.toFixed(1)} ${(PAD_T + chartH).toFixed(1)}` +
  ` L ${points[0].x.toFixed(1)} ${(PAD_T + chartH).toFixed(1)} Z`;

// Y-axis gridlines at 10, 12, 14, 16, 18 ¢/kWh
const gridRates = [10, 12, 14, 16, 18];

// X-axis labels every 2 years
const xLabels = rateData.filter((d) => d.year % 2 === 0);

export function PriceHistoryPage() {
  return (
    <div
      className="proposal-page"
      style={{
        background: 'var(--nrg-page-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          background: 'var(--nrg-green)',
          padding: '0 2.5rem',
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            color: '#ffffff',
            letterSpacing: '0.08em',
          }}
        >
          NORTHERN NRG
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: '0.12em',
          }}
        >
          ENERGY SAVINGS REPORT
        </span>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          padding: '1.75rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          overflow: 'hidden',
        }}
      >
        {/* Page heading */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
          <div
            style={{
              width: '4px',
              height: '60px',
              background: 'var(--nrg-red-badge)',
              borderRadius: '2px',
              flexShrink: 0,
            }}
          />
          <div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.9rem',
                color: 'var(--nrg-red-badge)',
                letterSpacing: '0.2em',
                marginBottom: '0.2rem',
              }}
            >
              ELECTRICITY PRICE HISTORY
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--nrg-text-heading)',
                lineHeight: 1.15,
              }}
            >
              Alberta Electricity Rates Over Time
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.88rem',
                color: 'var(--nrg-text-secondary)',
                marginTop: '0.3rem',
              }}
            >
              Regulated rate option (RRO) all-in average — ¢ per kWh
            </p>
          </div>
        </div>

        {/* Stat callouts row */}
        <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
          {[
            { label: 'Rate in 2010', value: '10.2¢', sublabel: 'per kWh' },
            { label: 'Rate in 2024', value: '16.8¢', sublabel: 'per kWh' },
            { label: 'Increase since 2010', value: '+65%', sublabel: 'over 14 years' },
            { label: 'Avg Annual Increase', value: '~4%', sublabel: 'compounding' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                background: 'var(--nrg-card-bg)',
                borderRadius: '10px',
                padding: '1rem 1.25rem',
                borderTop: '3px solid var(--nrg-red-badge)',
                boxShadow: '0 1px 8px rgba(0,121,63,0.06)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--nrg-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '0.25rem',
                }}
              >
                {stat.label}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--nrg-red-badge)',
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.72rem',
                  color: 'var(--nrg-text-secondary)',
                  marginTop: '0.15rem',
                }}
              >
                {stat.sublabel}
              </p>
            </div>
          ))}
        </div>

        {/* SVG chart */}
        <div
          style={{
            background: 'var(--nrg-pale-green-bg)',
            borderRadius: '12px',
            padding: '0.75rem',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{ width: '100%', height: '100%' }}
            aria-label="Alberta electricity rate history chart"
          >
            <defs>
              <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ed6b52" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#fb8365" stopOpacity="0.18" />
              </linearGradient>
            </defs>

            {/* Horizontal gridlines */}
            {gridRates.map((rate) => {
              const y = toY(rate);
              return (
                <g key={rate}>
                  <line
                    x1={PAD_L}
                    y1={y}
                    x2={SVG_W - PAD_R}
                    y2={y}
                    stroke="#cce6d9"
                    strokeWidth="1"
                    strokeDasharray="4 3"
                  />
                  <text
                    x={PAD_L - 6}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#6b8299"
                    fontFamily="var(--font-sans)"
                  >
                    {rate}¢
                  </text>
                </g>
              );
            })}

            {/* X-axis baseline */}
            <line
              x1={PAD_L}
              y1={PAD_T + chartH}
              x2={SVG_W - PAD_R}
              y2={PAD_T + chartH}
              stroke="#a8c8b8"
              strokeWidth="1.5"
            />

            {/* Area fill */}
            <path d={areaPath} fill="url(#rateGradient)" />

            {/* Line stroke */}
            <path d={linePath} fill="none" stroke="#ed6b52" strokeWidth="2.5" strokeLinejoin="round" />

            {/* Data point dots */}
            {points.map((p) => (
              <circle key={p.year} cx={p.x} cy={p.y} r="4" fill="#ed6b52" stroke="#fff" strokeWidth="1.5" />
            ))}

            {/* X-axis year labels */}
            {xLabels.map((d) => (
              <text
                key={d.year}
                x={toX(d.year)}
                y={PAD_T + chartH + 18}
                textAnchor="middle"
                fontSize="10"
                fill="#6b8299"
                fontFamily="var(--font-sans)"
              >
                {d.year}
              </text>
            ))}
          </svg>
        </div>

        {/* Source note */}
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.72rem',
            color: 'var(--nrg-text-secondary)',
            flexShrink: 0,
            opacity: 0.8,
          }}
        >
          Source: Alberta Utilities Commission historical rate data. Rates shown are approximate regulated rate option
          (RRO) all-in averages including distribution and transmission charges.
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          height: '36px',
          background: 'var(--nrg-green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.15em',
          }}
        >
          NORTHERN NRG — ENERGY SAVINGS REPORT
        </span>
      </div>
    </div>
  );
}
