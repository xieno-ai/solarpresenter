'use client';
import { useState } from 'react';

const VIDEO_EMBED_URL =
  'https://drive.google.com/file/d/1eGb2WDqYwZ-1JNTLzo4Vmi_xYX-fyOnF/preview';

interface FAQPageProps {
  systemCost?: string;
}

export function FAQPage({ systemCost }: FAQPageProps) {
  const [videoOpen, setVideoOpen] = useState(false);

  const formattedCost = systemCost
    ? Number(systemCost).toLocaleString('en-CA', { maximumFractionDigits: 0 })
    : '43,108';

  return (
    <div className="proposal-page" style={{ background: 'var(--nrg-page-bg)' }}>
      <div className="proposal-inner" style={{ height: 'auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--nrg-green)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '0.4rem',
          }}>
            COMMON QUESTIONS
          </p>
          <h1 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '2.6rem',
            fontWeight: 800,
            color: 'var(--nrg-text-heading)',
            lineHeight: 1.1,
            marginBottom: '0.55rem',
          }}>
            Frequently Asked Questions
          </h1>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.95rem',
            color: 'var(--nrg-text-secondary)',
          }}>
            Everything you want to know before you commit. Real answers, no runaround.
          </p>
        </div>

        {/* FAQ Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Card 1: Home Sale */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #b8dece',
            borderRadius: '12px',
            padding: '1.5rem 1.75rem',
          }}>
            {/* Card header row */}
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '3.5rem', lineHeight: 1, flexShrink: 0 }}>🏠</div>
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--nrg-text-heading)',
                  marginBottom: '0.2rem',
                  lineHeight: 1.3,
                }}>
                  What if I sell my home before the system is paid off?
                </h3>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.875rem',
                  color: 'var(--nrg-text-secondary)',
                }}>
                  Moving, downsizing, or upgrading — your investment is protected either way
                </p>
              </div>
            </div>

            {/* Two-column body */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
              <div>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#c47f2a',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}>
                  IF YOU FINANCED
                </p>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.875rem',
                  color: '#3d4f5e',
                  lineHeight: 1.7,
                }}>
                  The financing agreement is fully transferable to the new buyer. They simply
                  assume the remaining payments and inherit all the savings. This is actually a
                  selling feature — a home that already costs less to run is more attractive, not
                  less. Buyers from provinces like Ontario or B.C. immediately recognize the
                  value of locking in lower electricity costs.
                </p>
              </div>
              <div>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#c47f2a',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}>
                  IF YOU PAID CASH
                </p>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.875rem',
                  color: '#3d4f5e',
                  lineHeight: 1.7,
                }}>
                  Your system becomes a permanent asset of the home. Studies show solar homes
                  sell for 3–4% more and spend less time on market. Your ${formattedCost}{' '}
                  investment doesn&apos;t disappear — it converts into home equity and gets baked
                  into the sale price. You recover the cost when you sell, then walk away with
                  the savings you earned along the way.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Weather */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #b8dece',
            borderRadius: '12px',
            padding: '1.5rem 1.75rem',
            position: 'relative',
          }}>
            {/* Play button — top right */}
            <button
              onClick={() => setVideoOpen(true)}
              aria-label="Play hail test video"
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                width: '48px',
                height: '48px',
                border: '2px solid #1a2b3c',
                borderRadius: '8px',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                <polygon points="1,0 13,8 1,16" fill="#1a2b3c" />
              </svg>
            </button>

            {/* Card header row */}
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '3.5rem', lineHeight: 1, flexShrink: 0 }}>⛈️</div>
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--nrg-text-heading)',
                  marginBottom: '0.2rem',
                  lineHeight: 1.3,
                }}>
                  What about snow in winter and hail in summer?
                </h3>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.875rem',
                  color: 'var(--nrg-text-secondary)',
                }}>
                  Alberta weather is tough — your panels are tougher
                </p>
              </div>
            </div>

            {/* Two-column body */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
              <div>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#1aad5e',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}>
                  SNOW
                </p>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.875rem',
                  color: '#3d4f5e',
                  lineHeight: 1.7,
                }}>
                  Snow only reduces annual production by 3–5% — translating to a difference of
                  just a few dollars on your bill. Panels are mounted at an angle, so snow slides
                  off faster than it does from your roof. On cold, clear Alberta days, panels
                  actually perform better than in summer heat because solar cells are more
                  efficient at lower temperatures.
                </p>
              </div>
              <div>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#c47f2a',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}>
                  HAIL
                </p>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.875rem',
                  color: '#3d4f5e',
                  lineHeight: 1.7,
                }}>
                  Our panels are tested to withstand golf-ball sized hail at 384 km/h — and pass.
                  At that speed, hailstones actually disintegrate on impact rather than damaging
                  the tempered glass surface. In over 13 years and 16,000+ installations across
                  Alberta, hail has never been a warranty claim issue. And if somehow damage
                  did occur, our lifetime workmanship warranty has you covered.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {videoOpen && (
        <div
          onClick={() => setVideoOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.82)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '80vw',
              maxWidth: '900px',
              aspectRatio: '16/9',
              background: '#000',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setVideoOpen(false)}
              aria-label="Close video"
              style={{
                position: 'absolute',
                top: '-40px',
                right: 0,
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: '1.4rem',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
            <iframe
              src={VIDEO_EMBED_URL}
              width="100%"
              height="100%"
              allow="autoplay"
              style={{ border: 'none', display: 'block' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
