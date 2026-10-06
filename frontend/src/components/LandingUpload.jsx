import React, { useRef, useState } from 'react'

export default function LandingUpload({ onFileSelected, onLoadSample, loading }) {
  const fileInputRef = useRef(null)
  const [isDragActive, setIsDragActive] = useState(false)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelected(file)
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
    setIsDragActive(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setIsDragActive(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      onFileSelected(file)
    }
  }

  function handleDownloadTemplate() {
    const sampleData = `timestamp,provider,resource_id,instance_type,cpu_util,memory_util,current_cost
2025-01-01 00:00:00,Azure,azure-vm-prod-web-01,Standard_D4s_v5,45.3,58.2,0.13151
2025-01-01 01:00:00,Azure,azure-vm-prod-web-01,Standard_D4s_v5,46.1,59.0,0.13151
2025-01-01 00:00:00,GCP,gcp-compute-analytics-db,e2-standard-4,51.5,67.4,0.18493
2025-01-01 00:00:00,Azure,azure-vm-test-db-03,Standard_D8s_v5,14.5,19.8,0.32877
2025-01-01 00:00:00,Alibaba,ali-ecs-cache-cluster,ecs.g6.xlarge,8.2,11.0,0.21000`

    const blob = new Blob([sampleData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_finoptix_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="upload-card">
      <div className="upload-card-title">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>Data Ingestion: Multi-Cloud Resource CSV Upload</span>
      </div>

      <div
        className={`dropzone ${isDragActive ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <div className="upload-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>

        <div className="dropzone-heading">
          {loading ? 'Processing & Analyzing Dataset…' : 'Drag and drop resource utilization CSV here or click to browse'}
        </div>

        <div className="dropzone-subtext">
          Supports columns: provider, resource_id, instance_type, cpu_util, memory_util, current_cost
        </div>

        <button
          type="button"
          className="browse-btn"
          disabled={loading}
          onClick={(e) => {
            e.stopPropagation()
            fileInputRef.current?.click()
          }}
        >
          {loading ? 'Analyzing CSV…' : 'Browse Files'}
        </button>
      </div>

      <div className="upload-footer-note">
        <span>ⓘ Don't have a dataset? Click</span>
        <button type="button" onClick={onLoadSample}>Load Sample CSV Demo</button>
        <span>in the header or download the</span>
        <button type="button" onClick={handleDownloadTemplate}>sample template</button>
        <span>.</span>
      </div>
    </div>
  )
}
