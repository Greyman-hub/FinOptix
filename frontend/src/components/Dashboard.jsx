import React, { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

import RemediationModal from './RemediationModal.jsx'

export default function Dashboard({ data }) {
  const {
    diagnostics = [],
    category_breakdown = [],
    priority_counts = {},
  } = data

  // ============================================================
  // FILTER STATES
  // ============================================================

  const [search, setSearch] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('All')
  const [selectedCondition, setSelectedCondition] = useState('All')
  const [selectedPriority, setSelectedPriority] = useState('All')

  // ============================================================
  // SORTING
  // ============================================================

  const [sortColumn, setSortColumn] = useState('priority')
  const [sortDirection, setSortDirection] = useState('desc')

  // ============================================================
  // SELECTED RESOURCE
  // ============================================================

  const [selectedResource, setSelectedResource] = useState(null)

  // ============================================================
  // PROVIDERS
  // ============================================================

  const providersList = useMemo(() => {
    const providerSet = new Set(
      diagnostics.map((d) => d.provider)
    )

    return ['All', ...Array.from(providerSet)]
  }, [diagnostics])

  // ============================================================
  // MONTHLY FINANCIAL CHART DATA
  //
  // Shows:
  // 1. Current Monthly Cost
  // 2. Estimated Monthly Savings
  // 3. Capacity Investment
  //
  // Calculated directly from diagnostics so the chart does not
  // depend on backend monthly_chart_data field naming.
  // ============================================================

  const financialChartData = useMemo(() => {
    const providerMap = {}

    diagnostics.forEach((row) => {
      const provider = row.provider || 'Unknown'

      if (!providerMap[provider]) {
        providerMap[provider] = {
          provider,
          current_monthly_cost: 0,
          estimated_monthly_savings: 0,
          capacity_investment: 0,
        }
      }

      // --------------------------------------------------------
      // CURRENT MONTHLY COST
      // --------------------------------------------------------

      const currentMonthlyCost = Number(
        row.current_monthly_cost ??
        (Number(row.cost_usd || 0) * 730)
      )

      providerMap[provider].current_monthly_cost +=
        currentMonthlyCost

      // --------------------------------------------------------
      // ESTIMATED MONTHLY SAVINGS
      //
      // Only Idle / Underutilized resources generate savings.
      // --------------------------------------------------------

      if (
        row.health === 'Idle' ||
        row.health === 'Idle Resource' ||
        row.health === 'Underutilized'
      ) {
        const monthlySavings = Number(
          row.monthly_savings ??
          row.financial_impact?.monthly_savings ??
          row.recommendation?.monthly_savings ??
          0
        )

        providerMap[provider].estimated_monthly_savings +=
          Math.max(0, monthlySavings)
      }

      // --------------------------------------------------------
      // CAPACITY INVESTMENT
      //
      // Only Overutilized resources generate additional spend.
      // --------------------------------------------------------

      if (row.health === 'Overutilized') {
        const monthlyInvestment = Number(
          row.monthly_additional_cost ??
          row.financial_impact?.monthly_additional_cost ??
          row.recommendation?.monthly_additional_cost ??
          0
        )

        providerMap[provider].capacity_investment +=
          Math.max(0, monthlyInvestment)
      }
    })

    return Object.values(providerMap).map((item) => ({
      provider: item.provider,

      current_monthly_cost:
        Number(
          item.current_monthly_cost.toFixed(2)
        ),

      estimated_monthly_savings:
        Number(
          item.estimated_monthly_savings.toFixed(2)
        ),

      capacity_investment:
        Number(
          item.capacity_investment.toFixed(2)
        ),
    }))
  }, [diagnostics])

  // ============================================================
  // FILTER + SORT
  // ============================================================

  const sortedAndFilteredDiagnostics = useMemo(() => {
    let filtered = diagnostics.filter((item) => {
      const resourceId =
        item.resource_id?.toLowerCase() || ''

      const instanceType =
        item.instance_type?.toLowerCase() || ''

      const searchText =
        search.toLowerCase()

      const matchSearch =
        resourceId.includes(searchText) ||
        instanceType.includes(searchText)

      const matchProvider =
        selectedProvider === 'All' ||
        item.provider === selectedProvider

      const matchCondition =
        selectedCondition === 'All' ||
        item.health === selectedCondition

      const matchPriority =
        selectedPriority === 'All' ||
        item.priority === selectedPriority

      return (
        matchSearch &&
        matchProvider &&
        matchCondition &&
        matchPriority
      )
    })

    if (!sortColumn) {
      return filtered
    }

    const priorityWeight = {
      High: 3,
      Medium: 2,
      Low: 1,
    }

    const healthWeight = {
      Idle: 4,
      'Idle Resource': 4,
      Overutilized: 3,
      Underutilized: 2,
      Healthy: 1,
    }

    return [...filtered].sort((a, b) => {
      let valA = a[sortColumn]
      let valB = b[sortColumn]

      if (sortColumn === 'priority') {
        valA =
          priorityWeight[a.priority] || 0

        valB =
          priorityWeight[b.priority] || 0
      }

      else if (sortColumn === 'health') {
        valA =
          healthWeight[a.health] || 0

        valB =
          healthWeight[b.health] || 0
      }

      else if (sortColumn === 'financial_impact') {
        valA =
          a.health === 'Overutilized'
            ? Number(
              a.monthly_additional_cost ??
              a.additional_cost ??
              0
            )
            : Number(
              a.monthly_savings ??
              a.savings ??
              0
            )

        valB =
          b.health === 'Overutilized'
            ? Number(
              b.monthly_additional_cost ??
              b.additional_cost ??
              0
            )
            : Number(
              b.monthly_savings ??
              b.savings ??
              0
            )
      }

      if (typeof valA === 'string') {
        const comparison =
          valA.localeCompare(valB || '')

        return sortDirection === 'asc'
          ? comparison
          : -comparison
      }

      const comparison =
        (valA ?? 0) - (valB ?? 0)

      return sortDirection === 'asc'
        ? comparison
        : -comparison
    })
  }, [
    diagnostics,
    search,
    selectedProvider,
    selectedCondition,
    selectedPriority,
    sortColumn,
    sortDirection,
  ])

  // ============================================================
  // SORTING HELPERS
  // ============================================================

  function handleSort(column) {
    if (sortColumn === column) {
      setSortDirection(
        (previous) =>
          previous === 'asc'
            ? 'desc'
            : 'asc'
      )
    }

    else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  function renderSortIcon(column) {
    if (sortColumn !== column) {
      return (
        <span className="sort-icon">
          ↕
        </span>
      )
    }

    return (
      <span className="sort-icon">
        {
          sortDirection === 'asc'
            ? '▲'
            : '▼'
        }
      </span>
    )
  }

  // ============================================================
  // BADGES
  // ============================================================

  function getHealthBadgeClass(health) {
    if (health === 'Healthy') {
      return 'badge-healthy'
    }

    if (health === 'Underutilized') {
      return 'badge-underutilized'
    }

    if (health === 'Overutilized') {
      return 'badge-overutilized'
    }

    return 'badge-idle'
  }

  function getPriorityBadgeClass(priority) {
    if (priority === 'High') {
      return 'badge-priority-high'
    }

    if (priority === 'Medium') {
      return 'badge-priority-medium'
    }

    return 'badge-priority-low'
  }

  // ============================================================
  // FINANCIAL IMPACT
  // ============================================================

  function renderFinancialImpact(row) {

    // ----------------------------------------------------------
    // OVERUTILIZED
    // ----------------------------------------------------------

    if (row.health === 'Overutilized') {
      const additionalCost =
        Number(
          row.additional_cost ??
          row.financial_impact?.additional_cost ??
          row.recommendation?.additional_cost ??
          0
        )

      const monthlyAdditionalCost =
        Number(
          row.monthly_additional_cost ??
          row.financial_impact?.monthly_additional_cost ??
          row.recommendation?.monthly_additional_cost ??
          0
        )

      const additionalCostFormatted =
        row.additional_cost_formatted ||
        `$${additionalCost.toFixed(5)}/Hr`

      return (
        <div>

          <span
            style={{
              color: '#f59e0b',
              fontWeight: 600,
            }}
          >
            +{additionalCostFormatted}
          </span>

          <div
            style={{
              fontSize: '0.68rem',
              color: '#94a3b8',
              marginTop: '3px',
            }}
          >
            Capacity Investment
          </div>

          {monthlyAdditionalCost > 0 && (
            <div
              style={{
                fontSize: '0.66rem',
                color: '#64748b',
                marginTop: '2px',
              }}
            >
              +${monthlyAdditionalCost.toFixed(2)}/month
            </div>
          )}

        </div>
      )
    }

    // ----------------------------------------------------------
    // UNDERUTILIZED / IDLE
    // ----------------------------------------------------------

    if (
      row.health === 'Underutilized' ||
      row.health === 'Idle' ||
      row.health === 'Idle Resource'
    ) {
      const monthlySavings =
        Number(
          row.monthly_savings ??
          row.financial_impact?.monthly_savings ??
          row.recommendation?.monthly_savings ??
          0
        )

      return (
        <div>

          <span
            className={
              Number(row.savings) > 0
                ? 'savings-positive'
                : 'savings-zero'
            }
          >
            {
              row.savings_formatted ||
              '$0.00000/Hr'
            }
          </span>

          <div
            style={{
              fontSize: '0.68rem',
              color: '#94a3b8',
              marginTop: '3px',
            }}
          >
            Estimated Savings
          </div>

          {monthlySavings > 0 && (
            <div
              style={{
                fontSize: '0.66rem',
                color: '#64748b',
                marginTop: '2px',
              }}
            >
              ${monthlySavings.toFixed(2)}/month
            </div>
          )}

        </div>
      )
    }

    // ----------------------------------------------------------
    // HEALTHY
    // ----------------------------------------------------------

    return (
      <div>

        <span className="savings-zero">
          $0.00000/Hr
        </span>

        <div
          style={{
            fontSize: '0.68rem',
            color: '#94a3b8',
            marginTop: '3px',
          }}
        >
          No Cost Change
        </div>

      </div>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div>

      {/* ========================================================
          TOP SUMMARY
      ======================================================== */}

      <div className="dashboard-grid">

        {/* ======================================================
            MONTHLY FINANCIAL CHART
        ====================================================== */}

        <div className="summary-card">

          <div className="card-header-title">
            <span>
              Monthly Cost Optimization & Capacity Investment ($)
            </span>
          </div>

          <ResponsiveContainer
            width="100%"
            height={220}
          >
            <BarChart
              data={financialChartData}
              margin={{
                top: 10,
                right: 10,
                left: -20,
                bottom: 0,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />

              <XAxis
                dataKey="provider"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
              />

              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
              />

              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  borderColor:
                    'rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#fff',
                }}
                formatter={(value, name) => [
                  `$${Number(value || 0).toLocaleString(
                    'en-US',
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}`,
                  name,
                ]}
              />

              <Legend
                wrapperStyle={{
                  fontSize: '0.8rem',
                  color: '#94a3b8',
                }}
              />

              <Bar
                dataKey="current_monthly_cost"
                name="Current Monthly Cost"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />

              <Bar
                dataKey="estimated_monthly_savings"
                name="Estimated Monthly Savings"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />

              <Bar
                dataKey="capacity_investment"
                name="Capacity Investment"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />

            </BarChart>
          </ResponsiveContainer>

        </div>

        {/* ======================================================
            OPTIMIZATION BREAKDOWN
        ====================================================== */}

        <div className="summary-card">

          <div className="card-header-title">
            <span>
              Optimization Breakdown & Action Priorities
            </span>
          </div>

          <div className="breakdown-list">

            <div
              style={{
                fontSize: '0.75rem',
                color: '#64748b',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              REMEDIATION CATEGORY COUNT
            </div>

            {category_breakdown.map((item) => (
              <div key={item.category}>

                <div className="breakdown-row">

                  <span
                    style={{
                      color: '#cbd5e1',
                    }}
                  >
                    {item.category}
                  </span>

                  <span
                    style={{
                      fontWeight: 600,
                      color: '#f8fafc',
                    }}
                  >
                    {item.count} ({item.percentage}%)
                  </span>

                </div>

                <div className="breakdown-bar-bg">

                  <div
                    className="breakdown-bar-fill"
                    style={{
                      width:
                        `${item.percentage}%`,
                    }}
                  />

                </div>

              </div>
            ))}

          </div>

          <div className="priority-summary">

            <span
              style={{
                fontSize: '0.75rem',
                color: '#64748b',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              PRIORITY LEVELS
            </span>

            <div className="priority-pill-count">

              <div className="priority-count-item">

                <span
                  className="badge badge-priority-high"
                  style={{
                    padding: '2px 8px',
                  }}
                >
                  High
                </span>

                <span>
                  {priority_counts.High || 0}
                </span>

              </div>

              <div className="priority-count-item">

                <span
                  className="badge badge-priority-medium"
                  style={{
                    padding: '2px 8px',
                  }}
                >
                  Medium
                </span>

                <span>
                  {priority_counts.Medium || 0}
                </span>

              </div>

              <div className="priority-count-item">

                <span
                  className="badge badge-priority-low"
                  style={{
                    padding: '2px 8px',
                  }}
                >
                  Low
                </span>

                <span>
                  {priority_counts.Low || 0}
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ========================================================
          DIAGNOSTICS
      ======================================================== */}

      <div className="diagnostics-card">

        <div className="diagnostics-header-bar">

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              fontSize: '1.05rem',
              color: '#f8fafc',
            }}
          >
            <span>
              Detailed Resource Optimization Diagnostics
            </span>
          </div>

          <div className="controls-group">

            {/* SEARCH */}

            <input
              type="text"
              className="search-input"
              placeholder="🔍 Search Resource ID..."
              value={search}
              onChange={
                (e) =>
                  setSearch(e.target.value)
              }
            />

            {/* PROVIDER FILTER */}

            <select
              className="filter-select"
              value={selectedProvider}
              onChange={
                (e) =>
                  setSelectedProvider(
                    e.target.value
                  )
              }
            >

              {providersList.map((provider) => (
                <option
                  key={provider}
                  value={provider}
                >
                  {
                    provider === 'All'
                      ? 'All Providers'
                      : provider
                  }
                </option>
              ))}

            </select>

            {/* HEALTH FILTER */}

            <select
              className="filter-select"
              value={selectedCondition}
              onChange={
                (e) =>
                  setSelectedCondition(
                    e.target.value
                  )
              }
            >

              <option value="All">
                All Conditions
              </option>

              <option value="Idle">
                Idle
              </option>

              <option value="Underutilized">
                Underutilized
              </option>

              <option value="Overutilized">
                Overutilized
              </option>

              <option value="Healthy">
                Healthy
              </option>

            </select>

            {/* PRIORITY FILTER */}

            <select
              className="filter-select"
              value={selectedPriority}
              onChange={
                (e) =>
                  setSelectedPriority(
                    e.target.value
                  )
              }
            >

              <option value="All">
                All Priorities
              </option>

              <option value="High">
                High Priority
              </option>

              <option value="Medium">
                Medium Priority
              </option>

              <option value="Low">
                Low Priority
              </option>

            </select>

          </div>

        </div>

        {/* ======================================================
            RESOURCE TABLE
        ====================================================== */}

        <div className="table-wrapper">

          <table className="data-table">

            <thead>

              <tr>

                <th
                  onClick={
                    () =>
                      handleSort('provider')
                  }
                >
                  Provider {renderSortIcon('provider')}
                </th>

                <th
                  onClick={
                    () =>
                      handleSort('resource_id')
                  }
                >
                  Resource ID {renderSortIcon('resource_id')}
                </th>

                <th
                  onClick={
                    () =>
                      handleSort('instance_type')
                  }
                >
                  Instance Type {renderSortIcon('instance_type')}
                </th>

                <th
                  onClick={
                    () =>
                      handleSort('cpu_util')
                  }
                >
                  CPU % {renderSortIcon('cpu_util')}
                </th>

                <th
                  onClick={
                    () =>
                      handleSort('mem_util')
                  }
                >
                  Memory % {renderSortIcon('mem_util')}
                </th>

                <th
                  onClick={
                    () =>
                      handleSort('cost_usd')
                  }
                >
                  Cost (/Hr) {renderSortIcon('cost_usd')}
                </th>

                <th
                  onClick={
                    () =>
                      handleSort('recommended_cost')
                  }
                >
                  Recommended Cost {renderSortIcon('recommended_cost')}
                </th>

                <th
                  onClick={
                    () =>
                      handleSort('health')
                  }
                >
                  Health Condition {renderSortIcon('health')}
                </th>

                <th
                  onClick={
                    () =>
                      handleSort('financial_impact')
                  }
                >
                  Financial Impact {renderSortIcon('financial_impact')}
                </th>

                <th
                  onClick={
                    () =>
                      handleSort('priority')
                  }
                >
                  Priority {renderSortIcon('priority')}
                </th>

                <th>
                  Remediation Plan
                </th>

              </tr>

            </thead>

            <tbody>

              {
                sortedAndFilteredDiagnostics.length === 0
                  ? (
                    <tr>

                      <td
                        colSpan="11"
                        style={{
                          textAlign: 'center',
                          padding: '2rem',
                          color: '#64748b',
                        }}
                      >
                        No matching cloud resources found for the selected filters.
                      </td>

                    </tr>
                  )
                  : (
                    sortedAndFilteredDiagnostics.map((row) => (

                      <tr
                        key={
                          `${row.provider}-${row.resource_id}`
                        }
                      >

                        {/* PROVIDER */}

                        <td
                          style={{
                            fontWeight: 600,
                            color: '#f1f5f9',
                          }}
                        >
                          {row.provider}
                        </td>

                        {/* RESOURCE ID */}

                        <td
                          style={{
                            color: '#818cf8',
                            fontFamily: 'monospace',
                          }}
                        >
                          {row.resource_id}
                        </td>

                        {/* INSTANCE TYPE */}

                        <td
                          style={{
                            color: '#cbd5e1',
                          }}
                        >
                          {row.instance_type}
                        </td>

                        {/* CPU */}

                        <td>
                          {row.cpu_util}%
                        </td>

                        {/* MEMORY */}

                        <td>
                          {row.mem_util}%
                        </td>

                        {/* CURRENT COST */}

                        <td
                          style={{
                            color: '#cbd5e1',
                          }}
                        >
                          {row.cost_formatted}
                        </td>

                        {/* RECOMMENDED COST */}

                        <td
                          style={{
                            color:
                              row.health === 'Overutilized'
                                ? '#f59e0b'
                                : (
                                  row.health === 'Underutilized' ||
                                  row.health === 'Idle' ||
                                  row.health === 'Idle Resource'
                                )
                                  ? '#34d399'
                                  : '#cbd5e1',
                          }}
                        >
                          {
                            row.recommended_cost_formatted ||
                            row.forecasted_cost_formatted ||
                            row.cost_formatted
                          }
                        </td>

                        {/* HEALTH */}

                        <td>

                          <span
                            className={
                              `badge ${getHealthBadgeClass(
                                row.health
                              )}`
                            }
                          >
                            {row.health}
                          </span>

                        </td>

                        {/* FINANCIAL IMPACT */}

                        <td>
                          {renderFinancialImpact(row)}
                        </td>

                        {/* PRIORITY */}

                        <td>

                          <span
                            className={
                              `badge ${getPriorityBadgeClass(
                                row.priority
                              )}`
                            }
                          >
                            {row.priority}
                          </span>

                        </td>

                        {/* VIEW DETAILS */}

                        <td>

                          <button
                            className="view-details-btn"
                            onClick={
                              () =>
                                setSelectedResource(row)
                            }
                          >
                            View Details ›
                          </button>

                        </td>

                      </tr>

                    ))
                  )
              }

            </tbody>

          </table>

        </div>

      </div>

      {/* ========================================================
          REMEDIATION MODAL
      ======================================================== */}

      <RemediationModal
        resource={selectedResource}
        onClose={
          () =>
            setSelectedResource(null)
        }
      />

    </div>
  )
}