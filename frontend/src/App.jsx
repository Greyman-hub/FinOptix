import React, { useState } from 'react'

import Header from './components/Header.jsx'
import LandingUpload from './components/LandingUpload.jsx'
import Dashboard from './components/Dashboard.jsx'

import { analyzeFile } from './api.js'
import DEMO_DATA from './demoData.js'

export default function App() {

  // ============================================================
  // STATE
  // ============================================================

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

  // ============================================================
  // REAL USER CSV
  // ============================================================

  async function handleFileSelected(file) {

    setLoading(true)
    setError(null)

    // A real upload always exits demo mode.
    setIsDemoMode(false)

    try {

      const data = await analyzeFile(file)

      setResult(data)

    }

    catch (err) {

      setError(
        err.message ||
        'Failed to analyze CSV file.'
      )

    }

    finally {

      setLoading(false)

    }
  }

  // ============================================================
  // SAMPLE DASHBOARD DEMO
  //
  // IMPORTANT:
  // This does NOT call the backend.
  // This does NOT load synthetic_multi_provider_upload.csv.
  // This does NOT run XGBoost.
  //
  // It loads predefined illustrative dashboard results so all
  // FinOptix capabilities can be demonstrated.
  // ============================================================

  function handleLoadSample() {

    setError(null)
    setLoading(false)

    setIsDemoMode(true)

    setResult(DEMO_DATA)
  }

  // ============================================================
  // RESET
  // ============================================================

  function handleReset() {

    setResult(null)

    setError(null)

    setIsDemoMode(false)
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div className="app-container">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <Header
        onLoadSample={handleLoadSample}
        onReset={handleReset}
        hasData={!!result}
        loading={loading}
      />

      {/* ========================================================
          ERROR
      ======================================================== */}

      {error && (

        <div
          style={{
            background:
              'rgba(239, 68, 68, 0.15)',

            border:
              '1px solid rgba(239, 68, 68, 0.3)',

            color:
              '#f87171',

            padding:
              '1rem 1.25rem',

            borderRadius:
              '10px',

            marginBottom:
              '1.5rem',

            fontSize:
              '0.9rem',

            display:
              'flex',

            alignItems:
              'center',

            justifyContent:
              'space-between',
          }}
        >

          <span>
            ⚠️ {error}
          </span>

          <button
            onClick={
              () =>
                setError(null)
            }
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>

        </div>

      )}

      {/* ========================================================
          LANDING PAGE
      ======================================================== */}

      {!result ? (

        <LandingUpload
          onFileSelected={handleFileSelected}
          onLoadSample={handleLoadSample}
          loading={loading}
        />

      ) : (

        <>
          {/* ====================================================
              DEMO INDICATOR
          ==================================================== */}

          {isDemoMode && (

            <div
              style={{
                marginBottom: '1rem',

                padding:
                  '0.7rem 1rem',

                borderRadius:
                  '8px',

                background:
                  'rgba(99, 102, 241, 0.10)',

                border:
                  '1px solid rgba(99, 102, 241, 0.25)',

                color:
                  '#c7d2fe',

                fontSize:
                  '0.82rem',

                display:
                  'flex',

                alignItems:
                  'center',

                gap:
                  '0.5rem',
              }}
            >

              <span>
                ⓘ
              </span>

              <span>
                <strong>
                  Sample Demo Data
                </strong>

                {' — '}

                Illustrative results showing Healthy,
                Underutilized, Idle and Overutilized
                cloud resources across Azure, GCP
                and Alibaba.
              </span>

            </div>

          )}

          {/* ====================================================
              DASHBOARD
          ==================================================== */}

          <Dashboard
            data={result}
          />

        </>

      )}

    </div>
  )
}