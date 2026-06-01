export default function Loading() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=JetBrains+Mono:wght@500&display=swap');

        @keyframes pulse-ring {
          0%   { transform: scale(0.92); opacity: 0.5; }
          50%  { transform: scale(1.06); opacity: 0.15; }
          100% { transform: scale(0.92); opacity: 0.5; }
        }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes bar-fill {
          0%   { width: 0%; }
          30%  { width: 45%; }
          60%  { width: 72%; }
          85%  { width: 88%; }
          100% { width: 96%; }
        }

        @keyframes dot-pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1);   }
        }

        .sq-load-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          width: 100vw;
          background: #07090E;
          font-family: 'Space Grotesk', -apple-system, sans-serif;
          overflow: hidden;
          position: fixed;
          inset: 0;
          z-index: 9999;
        }

        .sq-load-ring {
          position: absolute;
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: rgba(255, 107, 31, 0.08);
          animation: pulse-ring 2.4s ease-in-out infinite;
        }

        .sq-load-logo {
          position: relative;
          z-index: 2;
          animation: fade-up 0.5s ease both;
        }

        .sq-load-wordmark {
          margin-top: 18px;
          font-size: 22px;
          font-weight: 700;
          color: #F1EEE5;
          letter-spacing: -0.5px;
          animation: fade-up 0.5s 0.1s ease both;
          opacity: 0;
        }

        .sq-load-tagline {
          margin-top: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          color: #3D4558;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          animation: fade-up 0.5s 0.2s ease both;
          opacity: 0;
        }

        .sq-load-bar-wrap {
          margin-top: 40px;
          width: 160px;
          height: 2px;
          background: #1C2333;
          border-radius: 2px;
          overflow: hidden;
          animation: fade-up 0.4s 0.3s ease both;
          opacity: 0;
        }

        .sq-load-bar {
          height: 100%;
          background: linear-gradient(90deg, #FF6B1F, #FF9A5C);
          border-radius: 2px;
          animation: bar-fill 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          box-shadow: 0 0 8px rgba(255, 107, 31, 0.5);
        }

        .sq-load-dots {
          display: flex;
          gap: 5px;
          margin-top: 16px;
          animation: fade-up 0.4s 0.4s ease both;
          opacity: 0;
        }

        .sq-load-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #FF6B1F;
          animation: dot-pulse 1.4s ease-in-out infinite;
        }
        .sq-load-dot:nth-child(2) { animation-delay: 0.2s; }
        .sq-load-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      <div className="sq-load-root">

        {/* Pulse ring behind logo */}
        <div className="sq-load-ring" />

        {/* Logo mark */}
        <div className="sq-load-logo">
          <svg viewBox="0 0 56 56" width={56} height={56}>
            {/* Rounded square bg */}
            <rect width="56" height="56" rx="13" fill="#FF6B1F"/>

            {/* Inner shield shadow */}
            <path
              d="M28 8L11 15V26.5C11 35.8 17.8 42.5 28 45.5C38.2 42.5 45 35.8 45 26.5V15L28 8Z"
              fill="rgba(0,0,0,0.2)"
            />

            {/* Shield white */}
            <path
              d="M28 10L13 16.5V27C13 35.8 19.5 42.2 28 45C36.5 42.2 43 35.8 43 27V16.5L28 10Z"
              fill="white"
              fillOpacity="0.95"
            />

            {/* Check */}
            <path
              d="M20.5 28.5L25.5 33.5L36 22"
              fill="none"
              stroke="#FF6B1F"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Wordmark */}
        <div className="sq-load-wordmark">
          Sub<span style={{ color: '#FF6B1F' }}>IQ</span>
        </div>

        {/* Tagline */}
        <div className="sq-load-tagline">Built for the job site</div>

        {/* Progress bar */}
        <div className="sq-load-bar-wrap">
          <div className="sq-load-bar" />
        </div>

        {/* Dots */}
        <div className="sq-load-dots">
          <div className="sq-load-dot" />
          <div className="sq-load-dot" />
          <div className="sq-load-dot" />
        </div>

      </div>
    </>
  )
}