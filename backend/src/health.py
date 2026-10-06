"""Resource health classification for FinOptix.

Health classification is provider-aware because the forecasting
models for Azure, GCP and Alibaba were trained on datasets with
different utilization distributions.

Possible states:
    Idle
    Underutilized
    Healthy
    Overutilized
"""


# ============================================================
# PROVIDER-SPECIFIC HEALTH THRESHOLDS
# ============================================================

HEALTH_THRESHOLDS = {

    "Azure": {
        "idle_cpu": 15,
        "idle_mem": 15,

        "under_cpu": 45,
        "under_mem": 50,

        "over_cpu": 88,
        "over_mem": 90,
    },

    "GCP": {
        "idle_cpu": 15,
        "idle_mem": 15,

        "under_cpu": 45,
        "under_mem": 45,

        "over_cpu": 85,
        "over_mem": 85,
    },

    "Alibaba": {
        "idle_cpu": 15,
        "idle_mem": 68,

        "under_cpu": 30,
        "under_mem": 78,

        "over_cpu": 55,
        "over_mem": 87.65,
    }
}


# ============================================================
# DEFAULT THRESHOLDS
# ============================================================

DEFAULT_THRESHOLDS = {
    "idle_cpu": 10,
    "idle_mem": 10,

    "under_cpu": 30,
    "under_mem": 30,

    "over_cpu": 80,
    "over_mem": 80,
}


# ============================================================
# CLASSIFY RESOURCE HEALTH
# ============================================================

def classify_health(
    cpu_util: float,
    mem_util: float,
    provider: str = None
) -> str:

    """
    Classify forecasted CPU and memory utilization.

    Provider-specific thresholds are used when the provider
    is known.

    Classification rules:

    Idle:
        Both CPU and memory are extremely low.

    Underutilized:
        Both CPU and memory are below the provider's normal
        utilization range.

    Overutilized:
        CPU OR memory exceeds the provider-specific upper
        utilization limit.

    Healthy:
        Everything between underutilized and overutilized.
    """

    thresholds = HEALTH_THRESHOLDS.get(
        provider,
        DEFAULT_THRESHOLDS
    )

    if (
        cpu_util < thresholds["idle_cpu"]
        and
        mem_util < thresholds["idle_mem"]
    ):
        return "Idle"

    if (
        cpu_util > thresholds["over_cpu"]
        or
        mem_util > thresholds["over_mem"]
    ):
        return "Overutilized"

    if (
        cpu_util < thresholds["under_cpu"]
        and
        mem_util < thresholds["under_mem"]
    ):
        return "Underutilized"

    return "Healthy"