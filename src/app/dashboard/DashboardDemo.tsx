export default function DashboardDemo() {
  return (
    <div
      style={{
        background: '#111',
        borderRadius: 24,
        padding: 24,
        minHeight: 400,
        color: 'white',
        border: '1px solid #222',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 24
        }}
      >
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800 }}>
            Dashboard Overview
          </h2>

          <p style={{ color: '#999', marginTop: 8 }}>
            Live construction analytics
          </p>
        </div>

        <div
          style={{
            background: '#E8520A',
            padding: '10px 16px',
            borderRadius: 12,
            fontWeight: 700,
            height: 'fit-content'
          }}
        >
          +12 Active Jobs
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 16
        }}
      >
        {[
          { label: 'Revenue', value: '$48,200' },
          { label: 'Invoices', value: '132' },
          { label: 'Crew Active', value: '24' }
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: '#1a1a1a',
              padding: 20,
              borderRadius: 18,
              border: '1px solid #2a2a2a'
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: '#888',
                marginBottom: 8
              }}
            >
              {item.label}
            </div>

            <div
              style={{
                fontSize: 28,
                fontWeight: 800
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 28,
          background: '#1a1a1a',
          borderRadius: 18,
          padding: 20,
          border: '1px solid #2a2a2a'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 16
          }}
        >
          <span style={{ color: '#999' }}>Project Progress</span>
          <span style={{ color: '#E8520A', fontWeight: 700 }}>
            82%
          </span>
        </div>

        <div
          style={{
            width: '100%',
            height: 12,
            background: '#2a2a2a',
            borderRadius: 999
          }}
        >
          <div
            style={{
              width: '82%',
              height: '100%',
              background: '#E8520A',
              borderRadius: 999,
              transition: 'width 1s ease'
            }}
          />
        </div>
      </div>
    </div>
  )
}