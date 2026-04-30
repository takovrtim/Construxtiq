export default function Loading() {
  return (
    <div style={{ padding: '28px' }}>
      <div style={{ height: 28, width: 200, background: 'rgba(0,0,0,0.06)', borderRadius: 8, marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 90, background: 'rgba(0,0,0,0.04)', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />)}
      </div>
      <div style={{ height: 400, background: 'rgba(0,0,0,0.03)', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )
}