import React, { useState } from 'react'

export default function RemediationModal({
  resource,
  onClose,
}) {
  const [copied, setCopied] = useState(false)

  if (!resource) {
    return null
  }

  const {
    provider,
    resource_id,
    instance_type,
    cpu_util,
    mem_util,
    cost_formatted,
    recommended_cost_formatted,
    forecasted_cost_formatted,
    current_monthly_cost,
    recommended_monthly_cost,
    health,
    priority,
    savings,
    savings_formatted,
    monthly_savings,
    additional_cost,
    additional_cost_formatted,
    monthly_additional_cost,
    financial_impact,
    recommendation,
    forecast,
  } = resource

  // ============================================================
  // HELPERS
  // ============================================================

  function getHealthBadgeClass(h) {
    if (h === 'Healthy') {
      return 'badge-healthy'
    }

    if (h === 'Underutilized') {
      return 'badge-underutilized'
    }

    if (h === 'Overutilized') {
      return 'badge-overutilized'
    }

    return 'badge-idle'
  }

  function getPriorityBadgeClass(p) {
    if (p === 'High') {
      return 'badge-priority-high'
    }

    if (p === 'Medium') {
      return 'badge-priority-medium'
    }

    return 'badge-priority-low'
  }

  function handleCopyCode() {
    if (!recommendation?.terraform) {
      return
    }

    navigator.clipboard.writeText(
      recommendation.terraform
    )

    setCopied(true)

    setTimeout(
      () => setCopied(false),
      2000
    )
  }

  // ============================================================
  // RESOURCE STATUS
  // ============================================================

  const isOverutilized =
    health === 'Overutilized'

  const isUnderutilized =
    health === 'Underutilized'

  const isIdle =
    health === 'Idle' ||
    health === 'Idle Resource'

  const isHealthy =
    health === 'Healthy'

  // ============================================================
  // FINANCIAL VALUES
  // ============================================================

  const additionalCostValue =
    Number(
      additional_cost ??
      financial_impact?.additional_cost ??
      recommendation?.additional_cost ??
      0
    )

  const monthlyAdditionalCostValue =
    Number(
      monthly_additional_cost ??
      financial_impact?.monthly_additional_cost ??
      recommendation?.monthly_additional_cost ??
      0
    )

  const monthlySavingsValue =
    Number(
      monthly_savings ??
      financial_impact?.monthly_savings ??
      recommendation?.monthly_savings ??
      0
    )

  const additionalCostFormattedValue =
    additional_cost_formatted ||
    `$${additionalCostValue.toFixed(5)}/Hr`

  const savingsDisplay =
    savings_formatted ||
    (
      Number(savings) > 0
        ? `$${Number(savings).toFixed(5)}/Hr`
        : '$0.00000/Hr'
    )

  const recommendedInstance =
    recommendation?.recommended_instance_type ||
    instance_type

  const recommendedCostDisplay =
    recommended_cost_formatted ||
    forecasted_cost_formatted ||
    cost_formatted

  const currentMonthlyCostValue =
    Number(current_monthly_cost || 0)

  const recommendedMonthlyCostValue =
    Number(recommended_monthly_cost || 0)

  const hasTerraform =
    Boolean(
      recommendation?.terraform &&
      recommendation.terraform.trim()
    )

  // ============================================================
  // FORECAST VALUES
  // ============================================================

  const forecastCpu =
    Number(
      forecast?.cpu_next_24h_avg ??
      cpu_util ??
      0
    )

  const forecastMemory =
    Number(
      forecast?.mem_next_24h_avg ??
      mem_util ??
      0
    )

  // ============================================================
  // SINGLE HUMAN-READABLE EXPLANATION
  // ============================================================

  function getRecommendationExplanation() {
    if (isHealthy) {
      return (
        `This resource is appropriately sized for its current and forecasted workload. ` +
        `The next 24-hour average utilization is expected to remain around ` +
        `${forecastCpu.toFixed(1)}% CPU and ${forecastMemory.toFixed(1)}% memory, ` +
        `so no resizing action is currently required.`
      )
    }

    if (isOverutilized) {
      const investmentText =
        monthlyAdditionalCostValue > 0
          ? ` The change requires approximately $${monthlyAdditionalCostValue.toFixed(2)} ` +
          `in additional infrastructure spending per month.`
          : ''

      return (
        `This resource is expected to operate at high utilization, with a next 24-hour ` +
        `average forecast of approximately ${forecastCpu.toFixed(1)}% CPU and ` +
        `${forecastMemory.toFixed(1)}% memory. Upsizing from ${instance_type} to ` +
        `${recommendedInstance} provides additional compute capacity and helps reduce ` +
        `the risk of resource saturation, degraded performance, and workload instability.` +
        investmentText
      )
    }

    if (isUnderutilized) {
      const savingsText =
        monthlySavingsValue > 0
          ? ` This change could reduce estimated infrastructure spending by approximately ` +
          `$${monthlySavingsValue.toFixed(2)} per month.`
          : ''

      return (
        `This resource is using less capacity than its current instance provides. ` +
        `Downsizing from ${instance_type} to ${recommendedInstance} can reduce unnecessary ` +
        `infrastructure spending while maintaining sufficient capacity for the forecasted ` +
        `workload.` +
        savingsText
      )
    }

    if (isIdle) {
      const savingsText =
        monthlySavingsValue > 0
          ? ` This change could reduce estimated infrastructure spending by approximately ` +
          `$${monthlySavingsValue.toFixed(2)} per month.`
          : ''

      return (
        `This resource is showing very low utilization compared with the capacity of its ` +
        `current instance. Moving from ${instance_type} to ${recommendedInstance} can reduce ` +
        `unused infrastructure capacity while retaining resources for the expected workload.` +
        savingsText
      )
    }

    return (
      `The recommended instance type is ${recommendedInstance}. ` +
      `This recommendation is based on the resource's utilization and next 24-hour forecast.`
    )
  }

  const recommendationExplanation =
    getRecommendationExplanation()

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="modal-header">

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.25rem',
                flexWrap: 'wrap',
              }}
            >
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {resource_id}
              </h2>

              <span
                className={`badge ${getHealthBadgeClass(health)}`}
              >
                {health}
              </span>

              <span
                className={`badge ${getPriorityBadgeClass(priority)}`}
              >
                {priority} Priority
              </span>
            </div>

            <p
              style={{
                fontSize: '0.85rem',
                color: '#94a3b8',
              }}
            >
              Provider:{' '}
              <strong style={{ color: '#cbd5e1' }}>
                {provider}
              </strong>

              {' | '}

              Current Instance:{' '}
              <strong style={{ color: '#cbd5e1' }}>
                {instance_type}
              </strong>
            </p>
          </div>

          <button
            className="close-modal-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* ======================================================
            UTILIZATION / FORECAST / FINANCIAL IMPACT
        ====================================================== */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >

          {/* CURRENT UTILIZATION */}

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border:
                '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 10,
              padding: '1rem',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                color: '#94a3b8',
                marginBottom: '0.25rem',
              }}
            >
              Current Resource Utilization
            </div>

            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#f1f5f9',
              }}
            >
              CPU: {cpu_util}% | Memory: {mem_util}%
            </div>
          </div>

          {/* FORECAST */}

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border:
                '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 10,
              padding: '1rem',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                color: '#94a3b8',
                marginBottom: '0.25rem',
              }}
            >
              Next 24-Hour Forecast
            </div>

            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#f1f5f9',
              }}
            >
              CPU: {forecastCpu.toFixed(2)}%
              {' | '}
              Memory: {forecastMemory.toFixed(2)}%
            </div>

            <div
              style={{
                fontSize: '0.72rem',
                color: '#64748b',
                marginTop: '4px',
              }}
            >
              {forecast?.source || 'XGBoost'}
              {' • '}
              Next-24-hour average
            </div>
          </div>

          {/* FINANCIAL IMPACT */}

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border:
                '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 10,
              padding: '1rem',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                color: '#94a3b8',
                marginBottom: '0.25rem',
              }}
            >
              {
                isOverutilized
                  ? 'Required Capacity Investment'
                  : isUnderutilized || isIdle
                    ? 'Projected Savings'
                    : 'Financial Impact'
              }
            </div>

            {isOverutilized ? (
              <>
                <div
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: '#f59e0b',
                  }}
                >
                  +{additionalCostFormattedValue}
                </div>

                {monthlyAdditionalCostValue > 0 && (
                  <div
                    style={{
                      fontSize: '0.82rem',
                      color: '#fbbf24',
                      marginTop: '4px',
                      fontWeight: 500,
                    }}
                  >
                    +${monthlyAdditionalCostValue.toFixed(2)}/month
                  </div>
                )}

                <div
                  style={{
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    marginTop: '4px',
                  }}
                >
                  Additional spend for required capacity
                </div>
              </>
            ) : isUnderutilized || isIdle ? (
              <>
                <div
                  className={
                    Number(savings) > 0
                      ? 'savings-positive'
                      : 'savings-zero'
                  }
                  style={{
                    fontSize: '1.1rem',
                  }}
                >
                  {savingsDisplay}
                </div>

                {monthlySavingsValue > 0 && (
                  <div
                    className="savings-positive"
                    style={{
                      fontSize: '0.82rem',
                      marginTop: '4px',
                      fontWeight: 500,
                    }}
                  >
                    ${monthlySavingsValue.toFixed(2)}/month
                  </div>
                )}

                <div
                  style={{
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    marginTop: '4px',
                  }}
                >
                  Potential infrastructure cost reduction
                </div>
              </>
            ) : (
              <>
                <div
                  className="savings-zero"
                  style={{
                    fontSize: '1.1rem',
                  }}
                >
                  $0.00000/Hr
                </div>

                <div
                  style={{
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    marginTop: '4px',
                  }}
                >
                  Current instance is appropriately sized
                </div>
              </>
            )}
          </div>
        </div>

        {/* ======================================================
            SINGLE OPTIMIZATION EXPLANATION
        ====================================================== */}

        <div
          style={{
            marginBottom: '1.5rem',
          }}
        >
          <h4
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#f8fafc',
              marginBottom: '0.5rem',
            }}
          >
            Optimization Recommendation:
          </h4>

          <div
            style={{
              background:
                'rgba(99, 102, 241, 0.08)',
              border:
                '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 10,
              padding: '1rem',
            }}
          >
            <p
              style={{
                fontSize: '0.9rem',
                color: isHealthy
                  ? '#34d399'
                  : '#e2e8f0',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {recommendationExplanation}
            </p>
          </div>
        </div>

        {/* ======================================================
            FINANCIAL IMPACT TABLE
        ====================================================== */}

        <div
          style={{
            marginBottom: '1.5rem',
          }}
        >
          <h4
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#f8fafc',
              marginBottom: '0.5rem',
            }}
          >
            Financial Impact Comparison:
          </h4>

          <table
            className="data-table"
            style={{
              width: '100%',
            }}
          >
            <thead>
              <tr>
                <th>Metric</th>
                <th>Current State</th>
                <th>Recommended State</th>
              </tr>
            </thead>

            <tbody>

              <tr>
                <td>Instance Tier</td>

                <td>
                  {instance_type}
                </td>

                <td
                  style={{
                    color:
                      isHealthy
                        ? '#cbd5e1'
                        : '#34d399',
                    fontWeight: 600,
                  }}
                >
                  {recommendedInstance}
                </td>
              </tr>

              <tr>
                <td>Hourly Rate</td>

                <td>
                  {cost_formatted}
                </td>

                <td
                  style={{
                    color:
                      isOverutilized
                        ? '#f59e0b'
                        : isUnderutilized || isIdle
                          ? '#34d399'
                          : '#cbd5e1',
                  }}
                >
                  {recommendedCostDisplay}
                </td>
              </tr>

              {(currentMonthlyCostValue > 0 ||
                recommendedMonthlyCostValue > 0) && (
                  <tr>
                    <td>
                      Estimated Monthly Cost
                    </td>

                    <td>
                      ${currentMonthlyCostValue.toFixed(2)}
                    </td>

                    <td
                      style={{
                        color:
                          isOverutilized
                            ? '#f59e0b'
                            : isUnderutilized || isIdle
                              ? '#34d399'
                              : '#cbd5e1',
                        fontWeight: 600,
                      }}
                    >
                      ${recommendedMonthlyCostValue.toFixed(2)}
                    </td>
                  </tr>
                )}

              {isOverutilized ? (
                <>
                  <tr>
                    <td>
                      Additional Hourly Cost
                    </td>

                    <td>
                      $0.00000/Hr
                    </td>

                    <td
                      style={{
                        color: '#f59e0b',
                        fontWeight: 600,
                      }}
                    >
                      +{additionalCostFormattedValue}
                    </td>
                  </tr>

                  <tr>
                    <td>
                      Monthly Capacity Investment
                    </td>

                    <td>
                      $0.00
                    </td>

                    <td
                      style={{
                        color: '#f59e0b',
                        fontWeight: 600,
                      }}
                    >
                      +${monthlyAdditionalCostValue.toFixed(2)}
                    </td>
                  </tr>
                </>
              ) : isUnderutilized || isIdle ? (
                <>
                  <tr>
                    <td>
                      Estimated Hourly Savings
                    </td>

                    <td>
                      $0.00000/Hr
                    </td>

                    <td
                      className={
                        Number(savings) > 0
                          ? 'savings-positive'
                          : 'savings-zero'
                      }
                    >
                      {savingsDisplay}
                    </td>
                  </tr>

                  <tr>
                    <td>
                      Estimated Monthly Savings
                    </td>

                    <td>
                      $0.00
                    </td>

                    <td
                      className={
                        monthlySavingsValue > 0
                          ? 'savings-positive'
                          : 'savings-zero'
                      }
                    >
                      ${monthlySavingsValue.toFixed(2)}
                    </td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td>
                    Financial Impact
                  </td>

                  <td>
                    $0.00000/Hr
                  </td>

                  <td className="savings-zero">
                    $0.00000/Hr
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

        {/* ======================================================
            TERRAFORM
        ====================================================== */}

        {!isHealthy && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}
            >
              <h4
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#f8fafc',
                }}
              >
                Terraform Remediation Code (HCL):
              </h4>

              {hasTerraform && (
                <button
                  className="btn-secondary"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.75rem',
                  }}
                  onClick={handleCopyCode}
                >
                  {
                    copied
                      ? '✓ Copied to Clipboard'
                      : '📋 Copy Terraform'
                  }
                </button>
              )}
            </div>

            <pre className="code-block">
              <code>
                {
                  hasTerraform
                    ? recommendation.terraform
                    : '# No Terraform remediation code available.'
                }
              </code>
            </pre>
          </div>
        )}

      </div>
    </div>
  )
}