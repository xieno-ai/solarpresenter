// Historical Alberta electricity price data (¢/kWh, blended all-in)

const SVG_W = 820;
const SVG_H = 272;
const PAD_L = 50;
const PAD_R = 28;
const PAD_T = 52; // room above chart for "LAST 5 YEARS" label
const PAD_B = 30;
const CW = SVG_W - PAD_L - PAD_R;
const CH = SVG_H - PAD_T - PAD_B;
const MIN_YEAR = 2004;
const MAX_YEAR = 2025;
const MAX_RATE = 32;

const xp = (year: number) => PAD_L + ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * CW;
const yp = (rate: number) => PAD_T + CH - (rate / MAX_RATE) * CH;

function smoothPath(data: { year: number; rate: number }[]): string {
  const pts = data.map((d) => ({ x: xp(d.year), y: yp(d.rate) }));
  if (pts.length < 2) return '';
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

// Green segment: 2004–2013
const GREEN_DATA = [
  { year: 2004, rate: 4 },
  { year: 2006, rate: 7 },
  { year: 2008, rate: 10 },
  { year: 2010, rate: 10.3 },
  { year: 2012, rate: 9.9 },
  { year: 2013, rate: 9.4 },
];

// Gold segment: 2013–2019
const GOLD_DATA = [
  { year: 2013, rate: 9.4 },
  { year: 2015, rate: 6.5 },
  { year: 2016.5, rate: 4 },
  { year: 2017, rate: 3 },
  { year: 2018, rate: 6 },
  { year: 2019, rate: 9 },
];

// Red segment: 2019–2025 (starts at gold endpoint to create a connected line)
const RED_DATA = [
  { year: 2019, rate: 9 },
  { year: 2020, rate: 12 },
  { year: 2021, rate: 20 },
  { year: 2022, rate: 27 },
  { year: 2023, rate: 18.5 },
  { year: 2024, rate: 20.5 },
  { year: 2025, rate: 23 },
];

const greenPath = smoothPath(GREEN_DATA);
const goldPath = smoothPath(GOLD_DATA);
const redPath = smoothPath(RED_DATA);

const GRID_RATES = [5, 10, 15, 20, 25, 30];

interface DotLabel {
  year: number;
  rate: number;
  color: string;
  label: string;
  anchor: 'start' | 'middle' | 'end';
  dx: number;
  dy: number;
}

const DOT_LABELS: DotLabel[] = [
  { year: 2004, rate: 4,  color: '#1a7a45', label: '~4¢',  anchor: 'start', dx: 7,  dy: 2  },
  { year: 2008, rate: 10, color: '#1a7a45', label: '~10¢', anchor: 'middle', dx: 0,  dy: -10 },
  { year: 2017, rate: 3,  color: '#b89a10', label: '~3¢',  anchor: 'middle', dx: -6, dy: 16 },
  { year: 2019, rate: 9,  color: '#b89a10', label: '~9¢',  anchor: 'end',   dx: -7, dy: -9 },
  { year: 2020, rate: 12, color: '#df584d', label: '~12¢', anchor: 'middle', dx: 0,  dy: -10 },
  { year: 2022, rate: 27, color: '#df584d', label: '27¢',  anchor: 'middle', dx: 0,  dy: -10 },
  { year: 2025, rate: 23, color: '#df584d', label: '~23¢', anchor: 'end',   dx: -7, dy: -9 },
];

const x2020 = xp(2020);
const x2025 = xp(2025);
const shadedTop = PAD_T - 16;
const shadedBottom = PAD_T + CH;

const STATS = [
  { pct: '+170%', label: 'SINCE 2004' },
  { pct: '+92%',  label: 'LAST 5 YEARS' },
  { pct: '+30%',  label: 'NEXT 5 YEARS' },
];

export function PriceHistoryPage() {
  return (
    <div className="proposal-page" style={{ background: 'var(--nrg-page-bg)' }}>
      <div className="proposal-inner" style={{ height: 'auto' }}>

        {/* Eyebrow */}
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--nrg-green)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            marginBottom: '0.45rem',
          }}
        >
          20 Years of Evidence
        </p>

        {/* Headline */}
        <h1
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '2.75rem',
            fontWeight: 800,
            color: 'var(--nrg-text-heading)',
            lineHeight: 1.15,
            marginBottom: '1rem',
          }}
        >
          Alberta Electricity Prices:
          <br />
          The Trend Is Unmistakable
        </h1>

        {/* Body text */}
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.88rem',
            color: 'var(--nrg-text-secondary)',
            lineHeight: 1.65,
            maxWidth: '74ch',
            marginBottom: '1.5rem',
          }}
        >
          Alberta&#39;s deregulated electricity market has been one of the most volatile — and most
          expensive — in Canada. The data tells a clear story: over 20 years, prices have risen
          dramatically, with the last 5 years delivering some of the most painful spikes ever
          recorded.
        </p>

        {/* Chart + Stats row */}
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'stretch' }}>

          {/* Chart container */}
          <div
            style={{
              flex: 1,
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#ffffff',
              boxShadow: '0 1px 14px rgba(0,40,20,0.07)',
            }}
          >
            {/* Green header */}
            <div style={{ background: 'var(--nrg-green)', padding: '0.65rem 1.2rem' }}>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.93rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                Alberta Total Electricity Rate History (Energy + T&D)
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.85)',
                  margin: '0.15rem 0 0',
                }}
              >
                Blended all-in residential rate including transmission &amp; distribution
              </p>
            </div>

            {/* SVG chart body */}
            <div style={{ background: '#fafffe', padding: '0.25rem 0.25rem 0.5rem' }}>
              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                style={{ width: '100%', display: 'block' }}
                aria-label="Alberta electricity rate history 2004–2025"
              >
                {/* Shaded LAST 5 YEARS region — fill then dashed stroke */}
                <rect
                  x={x2020}
                  y={shadedTop}
                  width={x2025 - x2020}
                  height={shadedBottom - shadedTop}
                  fill="rgba(223,88,77,0.06)"
                />
                <rect
                  x={x2020}
                  y={shadedTop}
                  width={x2025 - x2020}
                  height={shadedBottom - shadedTop}
                  fill="none"
                  stroke="#df584d"
                  strokeWidth="0.9"
                  strokeDasharray="4 3"
                />

                {/* "LAST 5 YEARS (2020-2025)" label */}
                <text
                  x={x2020 + (x2025 - x2020) * 0.38}
                  y={shadedTop + 12}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill="#df584d"
                  fontFamily="var(--font-sans)"
                  fontWeight="500"
                >
                  LAST 5 YEARS (2020-2025)
                </text>

                {/* Horizontal gridlines */}
                {GRID_RATES.map((rate) => {
                  const y = yp(rate);
                  return (
                    <g key={rate}>
                      <line
                        x1={PAD_L}
                        y1={y}
                        x2={SVG_W - PAD_R}
                        y2={y}
                        stroke="#dde8e2"
                        strokeWidth="0.75"
                      />
                      <text
                        x={PAD_L - 5}
                        y={y + 3.5}
                        textAnchor="end"
                        fontSize="9"
                        fill="#8fa8b0"
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
                  y1={PAD_T + CH}
                  x2={SVG_W - PAD_R}
                  y2={PAD_T + CH}
                  stroke="#b8d0c8"
                  strokeWidth="1"
                />

                {/* Green line 2004–2013 */}
                <path
                  d={greenPath}
                  fill="none"
                  stroke="#1a7a45"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Gold line 2013–2019 */}
                <path
                  d={goldPath}
                  fill="none"
                  stroke="#b89a10"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Red line 2020–2025 */}
                <path
                  d={redPath}
                  fill="none"
                  stroke="#df584d"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Dots + labels */}
                {DOT_LABELS.map((dot) => {
                  const x = xp(dot.year);
                  const y = yp(dot.rate);
                  return (
                    <g key={dot.year}>
                      <circle
                        cx={x}
                        cy={y}
                        r="4.5"
                        fill={dot.color}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      <text
                        x={x + dot.dx}
                        y={y + dot.dy}
                        textAnchor={dot.anchor}
                        fontSize="9"
                        fill="#4a6370"
                        fontFamily="var(--font-sans)"
                        fontWeight="500"
                      >
                        {dot.label}
                      </text>
                    </g>
                  );
                })}

                {/* X-axis year labels */}
                {([2004, 2008, 2017, 2019, 2020, 2022, 2025] as number[]).map((yr) => (
                  <text
                    key={yr}
                    x={xp(yr)}
                    y={PAD_T + CH + 18}
                    textAnchor="middle"
                    fontSize="9"
                    fill={yr >= 2020 ? '#df584d' : '#8fa8b0'}
                    fontFamily="var(--font-sans)"
                    fontWeight={yr >= 2020 ? '600' : '400'}
                  >
                    {yr}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* Stats card */}
          <div
            style={{
              width: '168px',
              flexShrink: 0,
              background: '#ffffff',
              borderRadius: '18px',
              border: '1.5px solid rgba(223,88,77,0.28)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-evenly',
              padding: '1.5rem 1rem',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '2.2rem', fontWeight: 700, color: '#df584d', lineHeight: 1, margin: 0 }}>+170%</p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: 700, color: '#4a6370', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0.3rem 0 0' }}>SINCE 2004</p>
            </div>
            <div style={{ width: '40px', height: '1.5px', background: '#f5a623' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '2.2rem', fontWeight: 700, color: '#df584d', lineHeight: 1, margin: 0 }}>+92%</p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: 700, color: '#4a6370', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0.3rem 0 0' }}>LAST 5 YEARS</p>
            </div>
            <div style={{ width: '40px', height: '1.5px', background: '#f5a623' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '2.2rem', fontWeight: 700, color: '#df584d', lineHeight: 1, margin: 0 }}>+30%</p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: 700, color: '#4a6370', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0.3rem 0 0' }}>NEXT 5 YEARS</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
