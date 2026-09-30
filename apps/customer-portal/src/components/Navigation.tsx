'use client'

export default function Navigation() {
  return (
    <nav style={{
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '16px 24px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🇰🇪</span>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>CitizenLink</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="/" style={{ color: '#4b5563', textDecoration: 'none' }}>Home</a>
          <a href="/my-requests" style={{ color: '#4b5563', textDecoration: 'none' }}>My Requests</a>
          <a href="/profile" style={{ color: '#4b5563', textDecoration: 'none' }}>Profile</a>
        </div>
      </div>
    </nav>
  )
}
