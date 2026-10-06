const DEMO_DATA = {
    diagnostics: [
        // ============================================================
        // AZURE
        // ============================================================

        {
            provider: 'Azure',
            resource_id: 'azure-prod-web-01',
            instance_type: 'Standard_D4s_v5',
            cpu_util: 72.4,
            mem_util: 76.8,
            forecast: {
                horizon_hours: 24,
                type: 'next_24h_average',
                source: 'Demo',
                cpu_next_24h_avg: 76.2,
                mem_next_24h_avg: 79.1,
            },
            cost_usd: 0.13151,
            cost_formatted: '$0.13151/Hr',
            recommended_cost: 0.13151,
            recommended_cost_formatted: '$0.13151/Hr',
            forecasted_cost: 0.13151,
            forecasted_cost_formatted: '$0.13151/Hr',
            current_monthly_cost: 95.99,
            recommended_monthly_cost: 95.99,
            health: 'Healthy',
            priority: 'Low',
            savings: 0,
            savings_formatted: '$0.00000/Hr',
            monthly_savings: 0,
            additional_cost: 0,
            additional_cost_formatted: '$0.00000/Hr',
            monthly_additional_cost: 0,
            financial_impact: {
                type: 'no_change',
                savings: 0,
                savings_pct: 0,
                monthly_savings: 0,
                additional_cost: 0,
                monthly_additional_cost: 0,
                message:
                    'This resource is appropriately sized for its expected workload. No infrastructure change is currently required.',
            },
            recommendation: {
                recommended_instance_type: 'Standard_D4s_v5',
                current_cost: 0.13151,
                recommended_cost: 0.13151,
                savings: 0,
                savings_pct: 0,
                monthly_savings: 0,
                additional_cost: 0,
                monthly_additional_cost: 0,
                financial_impact_type: 'no_change',
                financial_message:
                    'This resource is appropriately sized for its expected workload. No infrastructure change is currently required.',
                explanation:
                    'Resource utilization is balanced and remains within the expected operating range, so the current instance size is appropriate.',
                terraform: '',
            },
        },

        {
            provider: 'Azure',
            resource_id: 'azure-dev-server-02',
            instance_type: 'Standard_D4s_v5',
            cpu_util: 24.6,
            mem_util: 29.8,
            forecast: {
                horizon_hours: 24,
                type: 'next_24h_average',
                source: 'Demo',
                cpu_next_24h_avg: 26.1,
                mem_next_24h_avg: 31.4,
            },
            cost_usd: 0.13151,
            cost_formatted: '$0.13151/Hr',
            recommended_cost: 0.096,
            recommended_cost_formatted: '$0.09600/Hr',
            forecasted_cost: 0.096,
            forecasted_cost_formatted: '$0.09600/Hr',
            current_monthly_cost: 95.99,
            recommended_monthly_cost: 70.08,
            health: 'Underutilized',
            priority: 'Medium',
            savings: 0.03551,
            savings_formatted: '$0.03551/Hr',
            monthly_savings: 25.92,
            additional_cost: 0,
            additional_cost_formatted: '$0.00000/Hr',
            monthly_additional_cost: 0,
            financial_impact: {
                type: 'cost_saving',
                savings: 0.03551,
                savings_pct: 27.0,
                monthly_savings: 25.92,
                additional_cost: 0,
                monthly_additional_cost: 0,
                message:
                    'This resource is consistently underutilized. Downsizing can reduce cloud spend while retaining sufficient capacity for the expected workload.',
            },
            recommendation: {
                recommended_instance_type: 'Standard_D2s_v5',
                current_cost: 0.13151,
                recommended_cost: 0.096,
                savings: 0.03551,
                savings_pct: 27.0,
                monthly_savings: 25.92,
                additional_cost: 0,
                monthly_additional_cost: 0,
                financial_impact_type: 'cost_saving',
                financial_message:
                    'Downsizing this underutilized resource can save approximately $25.92 per month.',
                explanation:
                    'CPU and memory demand remain well below the available capacity. A smaller instance can support the expected workload at a lower cost.',
                terraform: `resource "azurerm_linux_virtual_machine" "azure-dev-server-02" {
  name                = "azure-dev-server-02"
  resource_group_name = var.resource_group_name
  location            = var.location
  size                = "Standard_D2s_v5"
  admin_username      = var.admin_username
}`,
            },
        },

        {
            provider: 'Azure',
            resource_id: 'azure-legacy-worker-03',
            instance_type: 'Standard_D4s_v5',
            cpu_util: 7.8,
            mem_util: 9.4,
            forecast: {
                horizon_hours: 24,
                type: 'next_24h_average',
                source: 'Demo',
                cpu_next_24h_avg: 8.2,
                mem_next_24h_avg: 10.1,
            },
            cost_usd: 0.13151,
            cost_formatted: '$0.13151/Hr',
            recommended_cost: 0.048,
            recommended_cost_formatted: '$0.04800/Hr',
            forecasted_cost: 0.048,
            forecasted_cost_formatted: '$0.04800/Hr',
            current_monthly_cost: 95.99,
            recommended_monthly_cost: 35.04,
            health: 'Idle',
            priority: 'High',
            savings: 0.08351,
            savings_formatted: '$0.08351/Hr',
            monthly_savings: 60.96,
            additional_cost: 0,
            additional_cost_formatted: '$0.00000/Hr',
            monthly_additional_cost: 0,
            financial_impact: {
                type: 'cost_saving',
                savings: 0.08351,
                savings_pct: 63.5,
                monthly_savings: 60.96,
                additional_cost: 0,
                monthly_additional_cost: 0,
                message:
                    'This resource shows very little utilization. Rightsizing or decommissioning it can eliminate unnecessary infrastructure spend.',
            },
            recommendation: {
                recommended_instance_type: 'Standard_D2s_v5',
                current_cost: 0.13151,
                recommended_cost: 0.048,
                savings: 0.08351,
                savings_pct: 63.5,
                monthly_savings: 60.96,
                additional_cost: 0,
                monthly_additional_cost: 0,
                financial_impact_type: 'cost_saving',
                financial_message:
                    'The idle workload represents approximately $60.96 per month in potential savings.',
                explanation:
                    'The resource has minimal CPU and memory demand and is consuming substantially more capacity than the workload requires.',
                terraform: `resource "azurerm_linux_virtual_machine" "azure-legacy-worker-03" {
  name                = "azure-legacy-worker-03"
  resource_group_name = var.resource_group_name
  location            = var.location
  size                = "Standard_D2s_v5"
  admin_username      = var.admin_username
}`,
            },
        },

        {
            provider: 'Azure',
            resource_id: 'azure-peak-api-04',
            instance_type: 'Standard_D8s_v5',
            cpu_util: 91.2,
            mem_util: 93.1,
            forecast: {
                horizon_hours: 24,
                type: 'next_24h_average',
                source: 'Demo',
                cpu_next_24h_avg: 88.4,
                mem_next_24h_avg: 92.6,
            },
            cost_usd: 0.32877,
            cost_formatted: '$0.32877/Hr',
            recommended_cost: 0.438,
            recommended_cost_formatted: '$0.43800/Hr',
            forecasted_cost: 0.438,
            forecasted_cost_formatted: '$0.43800/Hr',
            current_monthly_cost: 239.99,
            recommended_monthly_cost: 319.74,
            health: 'Overutilized',
            priority: 'High',
            savings: 0,
            savings_formatted: '$0.00000/Hr',
            monthly_savings: 0,
            additional_cost: 0.10923,
            additional_cost_formatted: '$0.10923/Hr',
            monthly_additional_cost: 79.74,
            financial_impact: {
                type: 'capacity_investment',
                savings: 0,
                savings_pct: 0,
                monthly_savings: 0,
                additional_cost: 0.10923,
                additional_cost_pct: 33.2,
                monthly_additional_cost: 79.74,
                message:
                    'This resource is operating close to capacity. Upsizing requires additional investment but provides headroom for peak demand and reduces performance saturation risk.',
            },
            recommendation: {
                recommended_instance_type: 'Standard_D16s_v5',
                current_cost: 0.32877,
                recommended_cost: 0.438,
                savings: 0,
                savings_pct: 0,
                monthly_savings: 0,
                additional_cost: 0.10923,
                additional_cost_pct: 33.2,
                monthly_additional_cost: 79.74,
                financial_impact_type: 'capacity_investment',
                financial_message:
                    'The recommended capacity upgrade requires approximately $79.74 in additional monthly infrastructure investment.',
                explanation:
                    'CPU and memory demand are consistently close to the available capacity. Increasing the instance size provides additional headroom for peak workloads and improves workload stability.',
                terraform: `resource "azurerm_linux_virtual_machine" "azure-peak-api-04" {
  name                = "azure-peak-api-04"
  resource_group_name = var.resource_group_name
  location            = var.location
  size                = "Standard_D16s_v5"
  admin_username      = var.admin_username
}`,
            },
        },

        // ============================================================
        // GCP
        // ============================================================

        {
            provider: 'GCP',
            resource_id: 'gcp-prod-api-01',
            instance_type: 'e2-standard-4',
            cpu_util: 66.2,
            mem_util: 64.8,
            forecast: {
                horizon_hours: 24,
                type: 'next_24h_average',
                source: 'Demo',
                cpu_next_24h_avg: 74.8,
                mem_next_24h_avg: 70.3,
            },
            cost_usd: 0.18493,
            cost_formatted: '$0.18493/Hr',
            recommended_cost: 0.18493,
            recommended_cost_formatted: '$0.18493/Hr',
            forecasted_cost: 0.18493,
            forecasted_cost_formatted: '$0.18493/Hr',
            current_monthly_cost: 135.0,
            recommended_monthly_cost: 135.0,
            health: 'Healthy',
            priority: 'Low',
            savings: 0,
            savings_formatted: '$0.00000/Hr',
            monthly_savings: 0,
            additional_cost: 0,
            additional_cost_formatted: '$0.00000/Hr',
            monthly_additional_cost: 0,
            financial_impact: {
                type: 'no_change',
                savings: 0,
                monthly_savings: 0,
                additional_cost: 0,
                monthly_additional_cost: 0,
                message:
                    'The resource is appropriately sized for its expected workload and does not require remediation.',
            },
            recommendation: {
                recommended_instance_type: 'e2-standard-4',
                current_cost: 0.18493,
                recommended_cost: 0.18493,
                savings: 0,
                savings_pct: 0,
                monthly_savings: 0,
                additional_cost: 0,
                monthly_additional_cost: 0,
                financial_impact_type: 'no_change',
                financial_message:
                    'No financial change is recommended for this resource.',
                explanation:
                    'Forecasted CPU and memory demand remain within a healthy operating range, so the current machine type provides an appropriate balance of capacity and cost.',
                terraform: '',
            },
        },

        {
            provider: 'GCP',
            resource_id: 'gcp-dev-worker-02',
            instance_type: 'e2-standard-4',
            cpu_util: 21.7,
            mem_util: 27.4,
            forecast: {
                horizon_hours: 24,
                type: 'next_24h_average',
                source: 'Demo',
                cpu_next_24h_avg: 25.3,
                mem_next_24h_avg: 30.8,
            },
            cost_usd: 0.18493,
            cost_formatted: '$0.18493/Hr',
            recommended_cost: 0.09246,
            recommended_cost_formatted: '$0.09246/Hr',
            forecasted_cost: 0.09246,
            forecasted_cost_formatted: '$0.09246/Hr',
            current_monthly_cost: 135.0,
            recommended_monthly_cost: 67.5,
            health: 'Underutilized',
            priority: 'Medium',
            savings: 0.09247,
            savings_formatted: '$0.09247/Hr',
            monthly_savings: 67.5,
            additional_cost: 0,
            additional_cost_formatted: '$0.00000/Hr',
            monthly_additional_cost: 0,
            financial_impact: {
                type: 'cost_saving',
                savings: 0.09247,
                savings_pct: 50.0,
                monthly_savings: 67.5,
                additional_cost: 0,
                monthly_additional_cost: 0,
                message:
                    'The workload uses only a small portion of the allocated compute capacity. Downsizing can reduce monthly cloud spend.',
            },
            recommendation: {
                recommended_instance_type: 'e2-standard-2',
                current_cost: 0.18493,
                recommended_cost: 0.09246,
                savings: 0.09247,
                savings_pct: 50.0,
                monthly_savings: 67.5,
                additional_cost: 0,
                monthly_additional_cost: 0,
                financial_impact_type: 'cost_saving',
                financial_message:
                    'Rightsizing this resource can save approximately $67.50 per month.',
                explanation:
                    'The expected workload requires substantially less CPU and memory than the current machine provides. A smaller machine type can handle the workload more efficiently.',
                terraform: `resource "google_compute_instance" "gcp-dev-worker-02" {
  name         = "gcp-dev-worker-02"
  machine_type = "e2-standard-2"
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = var.boot_image
    }
  }

  network_interface {
    network = var.network
  }
}`,
            },
        },

        {
            provider: 'GCP',
            resource_id: 'gcp-unused-test-03',
            instance_type: 'e2-standard-4',
            cpu_util: 6.3,
            mem_util: 8.7,
            forecast: {
                horizon_hours: 24,
                type: 'next_24h_average',
                source: 'Demo',
                cpu_next_24h_avg: 7.1,
                mem_next_24h_avg: 9.6,
            },
            cost_usd: 0.18493,
            cost_formatted: '$0.18493/Hr',
            recommended_cost: 0.09246,
            recommended_cost_formatted: '$0.09246/Hr',
            forecasted_cost: 0.09246,
            forecasted_cost_formatted: '$0.09246/Hr',
            current_monthly_cost: 135.0,
            recommended_monthly_cost: 67.5,
            health: 'Idle',
            priority: 'High',
            savings: 0.09247,
            savings_formatted: '$0.09247/Hr',
            monthly_savings: 67.5,
            additional_cost: 0,
            additional_cost_formatted: '$0.00000/Hr',
            monthly_additional_cost: 0,
            financial_impact: {
                type: 'cost_saving',
                savings: 0.09247,
                savings_pct: 50.0,
                monthly_savings: 67.5,
                additional_cost: 0,
                monthly_additional_cost: 0,
                message:
                    'This test resource is effectively idle. Downsizing or decommissioning it can remove unnecessary recurring cloud spend.',
            },
            recommendation: {
                recommended_instance_type: 'e2-standard-2',
                current_cost: 0.18493,
                recommended_cost: 0.09246,
                savings: 0.09247,
                savings_pct: 50.0,
                monthly_savings: 67.5,
                additional_cost: 0,
                monthly_additional_cost: 0,
                financial_impact_type: 'cost_saving',
                financial_message:
                    'The idle resource represents approximately $67.50 per month in potential savings.',
                explanation:
                    'CPU and memory activity remain extremely low, indicating that the allocated machine capacity is largely unused.',
                terraform: `resource "google_compute_instance" "gcp-unused-test-03" {
  name         = "gcp-unused-test-03"
  machine_type = "e2-standard-2"
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = var.boot_image
    }
  }

  network_interface {
    network = var.network
  }
}`,
            },
        },

        {
            provider: 'GCP',
            resource_id: 'gcp-analytics-04',
            instance_type: 'e2-standard-4',
            cpu_util: 86.4,
            mem_util: 83.7,
            forecast: {
                horizon_hours: 24,
                type: 'next_24h_average',
                source: 'Demo',
                cpu_next_24h_avg: 89.2,
                mem_next_24h_avg: 86.5,
            },
            cost_usd: 0.18493,
            cost_formatted: '$0.18493/Hr',
            recommended_cost: 0.3884,
            recommended_cost_formatted: '$0.38840/Hr',
            forecasted_cost: 0.3884,
            forecasted_cost_formatted: '$0.38840/Hr',
            current_monthly_cost: 135.0,
            recommended_monthly_cost: 283.53,
            health: 'Overutilized',
            priority: 'High',
            savings: 0,
            savings_formatted: '$0.00000/Hr',
            monthly_savings: 0,
            additional_cost: 0.20347,
            additional_cost_formatted: '$0.20347/Hr',
            monthly_additional_cost: 148.53,
            financial_impact: {
                type: 'capacity_investment',
                savings: 0,
                savings_pct: 0,
                monthly_savings: 0,
                additional_cost: 0.20347,
                additional_cost_pct: 110.0,
                monthly_additional_cost: 148.53,
                message:
                    'The analytics workload is expected to exceed comfortable utilization levels. Additional capacity can reduce contention during sustained processing.',
            },
            recommendation: {
                recommended_instance_type: 'n2-standard-8',
                current_cost: 0.18493,
                recommended_cost: 0.3884,
                savings: 0,
                savings_pct: 0,
                monthly_savings: 0,
                additional_cost: 0.20347,
                additional_cost_pct: 110.0,
                monthly_additional_cost: 148.53,
                financial_impact_type: 'capacity_investment',
                financial_message:
                    'The recommended capacity increase requires approximately $148.53 of additional monthly infrastructure investment.',
                explanation:
                    'The workload is expected to maintain high CPU and memory demand. Moving to a larger machine provides the additional capacity needed to reduce saturation risk.',
                terraform: `resource "google_compute_instance" "gcp-analytics-04" {
  name         = "gcp-analytics-04"
  machine_type = "n2-standard-8"
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = var.boot_image
    }
  }

  network_interface {
    network = var.network
  }
}`,
            },
        },

        {
            provider: 'GCP',
            resource_id: 'gcp-services-05',
            instance_type: 'e2-standard-4',
            cpu_util: 61.8,
            mem_util: 65.4,
            forecast: {
                horizon_hours: 24,
                type: 'next_24h_average',
                source: 'Demo',
                cpu_next_24h_avg: 69.7,
                mem_next_24h_avg: 71.2,
            },
            cost_usd: 0.18493,
            cost_formatted: '$0.18493/Hr',
            recommended_cost: 0.18493,
            recommended_cost_formatted: '$0.18493/Hr',
            forecasted_cost: 0.18493,
            forecasted_cost_formatted: '$0.18493/Hr',
            current_monthly_cost: 135.0,
            recommended_monthly_cost: 135.0,
            health: 'Healthy',
            priority: 'Low',
            savings: 0,
            savings_formatted: '$0.00000/Hr',
            monthly_savings: 0,
            additional_cost: 0,
            additional_cost_formatted: '$0.00000/Hr',
            monthly_additional_cost: 0,
            financial_impact: {
                type: 'no_change',
                savings: 0,
                monthly_savings: 0,
                additional_cost: 0,
                monthly_additional_cost: 0,
                message:
                    'The resource is operating efficiently and no rightsizing action is currently necessary.',
            },
            recommendation: {
                recommended_instance_type: 'e2-standard-4',
                current_cost: 0.18493,
                recommended_cost: 0.18493,
                savings: 0,
                savings_pct: 0,
                monthly_savings: 0,
                additional_cost: 0,
                monthly_additional_cost: 0,
                financial_impact_type: 'no_change',
                financial_message: 'No cost change is recommended.',
                explanation:
                    'Expected utilization remains balanced and leaves adequate capacity for normal workload variation.',
                terraform: '',
            },
        },

        // ============================================================
        // ALIBABA
        // ============================================================

        {
            provider: 'Alibaba',
            resource_id: 'ali-prod-web-01',
            instance_type: 'ecs.g6.xlarge',
            cpu_util: 41.3,
            mem_util: 72.6,
            forecast: {
                horizon_hours: 24,
                type: 'next_24h_average',
                source: 'Demo',
                cpu_next_24h_avg: 43.8,
                mem_next_24h_avg: 78.4,
            },
            cost_usd: 0.162,
            cost_formatted: '$0.16200/Hr',
            recommended_cost: 0.162,
            recommended_cost_formatted: '$0.16200/Hr',
            forecasted_cost: 0.162,
            forecasted_cost_formatted: '$0.16200/Hr',
            current_monthly_cost: 118.26,
            recommended_monthly_cost: 118.26,
            health: 'Healthy',
            priority: 'Low',
            savings: 0,
            savings_formatted: '$0.00000/Hr',
            monthly_savings: 0,
            additional_cost: 0,
            additional_cost_formatted: '$0.00000/Hr',
            monthly_additional_cost: 0,
            financial_impact: {
                type: 'no_change',
                savings: 0,
                monthly_savings: 0,
                additional_cost: 0,
                monthly_additional_cost: 0,
                message:
                    'The resource is appropriately sized for its expected workload.',
            },
            recommendation: {
                recommended_instance_type: 'ecs.g6.xlarge',
                current_cost: 0.162,
                recommended_cost: 0.162,
                savings: 0,
                savings_pct: 0,
                monthly_savings: 0,
                additional_cost: 0,
                monthly_additional_cost: 0,
                financial_impact_type: 'no_change',
                financial_message:
                    'No financial change is recommended.',
                explanation:
                    'CPU and memory demand remain within a stable operating range, so the current instance provides sufficient capacity.',
                terraform: '',
            },
        },

        {
            provider: 'Alibaba',
            resource_id: 'ali-dev-services-02',
            instance_type: 'ecs.g6.xlarge',
            cpu_util: 23.4,
            mem_util: 27.9,
            forecast: {
                horizon_hours: 24,
                type: 'next_24h_average',
                source: 'Demo',
                cpu_next_24h_avg: 25.8,
                mem_next_24h_avg: 30.6,
            },
            cost_usd: 0.162,
            cost_formatted: '$0.16200/Hr',
            recommended_cost: 0.096,
            recommended_cost_formatted: '$0.09600/Hr',
            forecasted_cost: 0.096,
            forecasted_cost_formatted: '$0.09600/Hr',
            current_monthly_cost: 118.26,
            recommended_monthly_cost: 70.08,
            health: 'Underutilized',
            priority: 'Medium',
            savings: 0.066,
            savings_formatted: '$0.06600/Hr',
            monthly_savings: 48.18,
            additional_cost: 0,
            additional_cost_formatted: '$0.00000/Hr',
            monthly_additional_cost: 0,
            financial_impact: {
                type: 'cost_saving',
                savings: 0.066,
                savings_pct: 40.7,
                monthly_savings: 48.18,
                additional_cost: 0,
                monthly_additional_cost: 0,
                message:
                    'The resource is using significantly less capacity than allocated. Rightsizing can lower recurring infrastructure cost.',
            },
            recommendation: {
                recommended_instance_type: 'ecs.g6.large',
                current_cost: 0.162,
                recommended_cost: 0.096,
                savings: 0.066,
                savings_pct: 40.7,
                monthly_savings: 48.18,
                additional_cost: 0,
                monthly_additional_cost: 0,
                financial_impact_type: 'cost_saving',
                financial_message:
                    'Rightsizing this resource can save approximately $48.18 per month.',
                explanation:
                    'The workload consistently uses only a small portion of the available CPU and memory capacity. A smaller instance is sufficient for the expected demand.',
                terraform: `resource "alicloud_instance" "ali-dev-services-02" {
  instance_name     = "ali-dev-services-02"
  instance_type     = "ecs.g6.large"
  availability_zone = var.availability_zone
  image_id          = var.image_id
  security_groups   = var.security_group_ids
  vswitch_id        = var.vswitch_id
}`,
            },
        },

        {
            provider: 'Alibaba',
            resource_id: 'ali-unused-worker-03',
            instance_type: 'ecs.g6.xlarge',
            cpu_util: 5.9,
            mem_util: 8.2,
            forecast: {
                horizon_hours: 24,
                type: 'next_24h_average',
                source: 'Demo',
                cpu_next_24h_avg: 6.8,
                mem_next_24h_avg: 9.1,
            },
            cost_usd: 0.162,
            cost_formatted: '$0.16200/Hr',
            recommended_cost: 0.096,
            recommended_cost_formatted: '$0.09600/Hr',
            forecasted_cost: 0.096,
            forecasted_cost_formatted: '$0.09600/Hr',
            current_monthly_cost: 118.26,
            recommended_monthly_cost: 70.08,
            health: 'Idle',
            priority: 'High',
            savings: 0.066,
            savings_formatted: '$0.06600/Hr',
            monthly_savings: 48.18,
            additional_cost: 0,
            additional_cost_formatted: '$0.00000/Hr',
            monthly_additional_cost: 0,
            financial_impact: {
                type: 'cost_saving',
                savings: 0.066,
                savings_pct: 40.7,
                monthly_savings: 48.18,
                additional_cost: 0,
                monthly_additional_cost: 0,
                message:
                    'This resource has negligible utilization and represents avoidable infrastructure spend.',
            },
            recommendation: {
                recommended_instance_type: 'ecs.g6.large',
                current_cost: 0.162,
                recommended_cost: 0.096,
                savings: 0.066,
                savings_pct: 40.7,
                monthly_savings: 48.18,
                additional_cost: 0,
                monthly_additional_cost: 0,
                financial_impact_type: 'cost_saving',
                financial_message:
                    'The idle resource represents approximately $48.18 per month in potential savings.',
                explanation:
                    'Very little CPU or memory capacity is being consumed. The resource can be downsized or reviewed for decommissioning to eliminate unnecessary spend.',
                terraform: `resource "alicloud_instance" "ali-unused-worker-03" {
  instance_name     = "ali-unused-worker-03"
  instance_type     = "ecs.g6.large"
  availability_zone = var.availability_zone
  image_id          = var.image_id
  security_groups   = var.security_group_ids
  vswitch_id        = var.vswitch_id
}`,
            },
        },

        {
            provider: 'Alibaba',
            resource_id: 'ali-peak-batch-04',
            instance_type: 'ecs.g6.xlarge',
            cpu_util: 83.8,
            mem_util: 94.1,
            forecast: {
                horizon_hours: 24,
                type: 'next_24h_average',
                source: 'Demo',
                cpu_next_24h_avg: 86.3,
                mem_next_24h_avg: 95.2,
            },
            cost_usd: 0.162,
            cost_formatted: '$0.16200/Hr',
            recommended_cost: 0.336,
            recommended_cost_formatted: '$0.33600/Hr',
            forecasted_cost: 0.336,
            forecasted_cost_formatted: '$0.33600/Hr',
            current_monthly_cost: 118.26,
            recommended_monthly_cost: 245.28,
            health: 'Overutilized',
            priority: 'High',
            savings: 0,
            savings_formatted: '$0.00000/Hr',
            monthly_savings: 0,
            additional_cost: 0.174,
            additional_cost_formatted: '$0.17400/Hr',
            monthly_additional_cost: 127.02,
            financial_impact: {
                type: 'capacity_investment',
                savings: 0,
                savings_pct: 0,
                monthly_savings: 0,
                additional_cost: 0.174,
                additional_cost_pct: 107.4,
                monthly_additional_cost: 127.02,
                message:
                    'The workload is approaching resource saturation. Additional capacity increases infrastructure spend but improves workload headroom and stability.',
            },
            recommendation: {
                recommended_instance_type: 'ecs.g6.2xlarge',
                current_cost: 0.162,
                recommended_cost: 0.336,
                savings: 0,
                savings_pct: 0,
                monthly_savings: 0,
                additional_cost: 0.174,
                additional_cost_pct: 107.4,
                monthly_additional_cost: 127.02,
                financial_impact_type: 'capacity_investment',
                financial_message:
                    'The capacity upgrade requires approximately $127.02 of additional monthly infrastructure investment.',
                explanation:
                    'Sustained CPU and memory demand leaves limited spare capacity. Upsizing provides additional resources for peak workload periods and reduces saturation risk.',
                terraform: `resource "alicloud_instance" "ali-peak-batch-04" {
  instance_name     = "ali-peak-batch-04"
  instance_type     = "ecs.g6.2xlarge"
  availability_zone = var.availability_zone
  image_id          = var.image_id
  security_groups   = var.security_group_ids
  vswitch_id        = var.vswitch_id
}`,
            },
        },

        {
            provider: 'Alibaba',
            resource_id: 'ali-analytics-05',
            instance_type: 'ecs.g6.xlarge',
            cpu_util: 46.7,
            mem_util: 75.2,
            forecast: {
                horizon_hours: 24,
                type: 'next_24h_average',
                source: 'Demo',
                cpu_next_24h_avg: 48.9,
                mem_next_24h_avg: 81.4,
            },
            cost_usd: 0.162,
            cost_formatted: '$0.16200/Hr',
            recommended_cost: 0.162,
            recommended_cost_formatted: '$0.16200/Hr',
            forecasted_cost: 0.162,
            forecasted_cost_formatted: '$0.16200/Hr',
            current_monthly_cost: 118.26,
            recommended_monthly_cost: 118.26,
            health: 'Healthy',
            priority: 'Low',
            savings: 0,
            savings_formatted: '$0.00000/Hr',
            monthly_savings: 0,
            additional_cost: 0,
            additional_cost_formatted: '$0.00000/Hr',
            monthly_additional_cost: 0,
            financial_impact: {
                type: 'no_change',
                savings: 0,
                monthly_savings: 0,
                additional_cost: 0,
                monthly_additional_cost: 0,
                message:
                    'The resource remains appropriately provisioned for the expected analytics workload.',
            },
            recommendation: {
                recommended_instance_type: 'ecs.g6.xlarge',
                current_cost: 0.162,
                recommended_cost: 0.162,
                savings: 0,
                savings_pct: 0,
                monthly_savings: 0,
                additional_cost: 0,
                monthly_additional_cost: 0,
                financial_impact_type: 'no_change',
                financial_message:
                    'No financial change is recommended.',
                explanation:
                    'The expected workload remains within the available capacity and does not currently justify resizing.',
                terraform: '',
            },
        },
    ],

    // ============================================================
    // PROVIDER FINANCIAL SUMMARY
    // ============================================================

    monthly_chart_data: [
        {
            provider: 'Azure',
            current_monthly_cost: 527.96,
            potential_monthly_savings: 86.88,
            monthly_capacity_investment: 79.74,
            capacity_investment_monthly: 79.74,
        },
        {
            provider: 'GCP',
            current_monthly_cost: 675.0,
            potential_monthly_savings: 135.0,
            monthly_capacity_investment: 148.53,
            capacity_investment_monthly: 148.53,
        },
        {
            provider: 'Alibaba',
            current_monthly_cost: 591.30,
            potential_monthly_savings: 96.36,
            monthly_capacity_investment: 127.02,
            capacity_investment_monthly: 127.02,
        },
    ],

    financial_summary: {
        current_monthly_cost: 1794.26,
        potential_monthly_savings: 318.24,
        capacity_investment_monthly: 355.29,
        optimized_cost_after_savings: 1476.02,
        projected_cost_with_capacity_investment: 1831.31,
    },

    // ============================================================
    // HEALTH BREAKDOWN
    // ============================================================

    category_breakdown: [
        {
            category: 'Idle Resource',
            count: 3,
            percentage: 21.4,
        },
        {
            category: 'Underutilized',
            count: 3,
            percentage: 21.4,
        },
        {
            category: 'Overutilized',
            count: 3,
            percentage: 21.4,
        },
        {
            category: 'Healthy',
            count: 5,
            percentage: 35.7,
        },
    ],

    priority_counts: {
        High: 6,
        Medium: 3,
        Low: 5,
    },

    total_resources: 14,

    supported_providers: [
        'Azure',
        'GCP',
        'Alibaba',
    ],

    forecast_horizon_hours: 24,
    forecast_type: 'next_24h_average',

    demo_mode: true,
}

export default DEMO_DATA