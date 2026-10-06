import React from 'react'

export default function Header({ onLoadSample, onReset, hasData, loading }) {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo">FX</div>
        <div className="brand-title-group">
          <h1>FINOPTIXS</h1>
          <p>Cloud-Agnostic Cost Remediation & Optimization Engine</p>
        </div>
      </div>

      <div className="header-actions">
        {hasData && (
          <button className="btn-secondary" onClick={onReset} disabled={loading}>
            ↑ Upload New CSV
          </button>
        )}
        <button className="btn-secondary" onClick={onLoadSample} disabled={loading}>
          ⚡ Load Sample CSV Demo
        </button>
      </div>
    </header>
  )
}
