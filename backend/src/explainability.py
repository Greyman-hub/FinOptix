# ============================================================
# FINOPTIX — SHAP EXPLAINABILITY
# ============================================================

import numpy as np
import pandas as pd
import shap


READABLE_FEATURE_NAMES = {

    "hour":
        "time of day",

    "day_of_week":
        "day of the week",

    "is_weekend":
        "weekend pattern",

    "hour_sin":
        "daily time pattern",

    "hour_cos":
        "daily time pattern",

    "dow_sin":
        "weekly time pattern",

    "dow_cos":
        "weekly time pattern",

    "cpu_lag_1":
        "CPU utilization 1 hour ago",

    "cpu_lag_3":
        "CPU utilization 3 hours ago",

    "cpu_lag_6":
        "CPU utilization 6 hours ago",

    "cpu_lag_12":
        "CPU utilization 12 hours ago",

    "cpu_lag_24":
        "CPU utilization 24 hours ago",

    "mem_lag_1":
        "memory utilization 1 hour ago",

    "mem_lag_3":
        "memory utilization 3 hours ago",

    "mem_lag_6":
        "memory utilization 6 hours ago",

    "mem_lag_12":
        "memory utilization 12 hours ago",

    "mem_lag_24":
        "memory utilization 24 hours ago",

    "cpu_roll_mean_6":
        "6-hour average CPU utilization",

    "cpu_roll_mean_12":
        "12-hour average CPU utilization",

    "cpu_roll_mean_24":
        "24-hour average CPU utilization",

    "cpu_roll_std_6":
        "recent CPU variability",

    "cpu_roll_std_12":
        "12-hour CPU variability",

    "cpu_roll_std_24":
        "24-hour CPU variability",

    "mem_roll_mean_6":
        "6-hour average memory utilization",

    "mem_roll_mean_12":
        "12-hour average memory utilization",

    "mem_roll_mean_24":
        "24-hour average memory utilization",

    "mem_roll_std_6":
        "recent memory variability",

    "mem_roll_std_12":
        "12-hour memory variability",

    "mem_roll_std_24":
        "24-hour memory variability",

    "cpu_trend_6h":
        "recent CPU trend",

    "mem_trend_6h":
        "recent memory trend",

    "cpu_trend":
        "recent CPU trend",

    "mem_trend":
        "recent memory trend",
}


# ============================================================
# BUILD EXPLAINERS
# ============================================================

def build_explainers(models):

    explainers = {}

    for provider, data in models.items():

        explainers[
            provider
        ] = {

            "cpu":
                shap.TreeExplainer(
                    data["cpu"]
                ),

            "mem":
                shap.TreeExplainer(
                    data["mem"]
                )
        }

    return explainers


# ============================================================
# EXPLAIN ONE FORECAST
# ============================================================

def explain_forecast(
    explainer,
    feature_row,
    feature_names,
    top_n=3
):

    X = pd.DataFrame(
        [
            feature_row[
                feature_names
            ].values
        ],
        columns=feature_names
    )


    shap_values = (
        explainer.shap_values(
            X
        )
    )


    values = np.asarray(
        shap_values
    ).reshape(-1)


    contributions = pd.Series(
        values,
        index=feature_names
    )


    contributions = (
        contributions
        .reindex(
            contributions
            .abs()
            .sort_values(
                ascending=False
            )
            .index
        )
    )


    parts = []


    for feature, value in (
        contributions
        .head(top_n)
        .items()
    ):

        label = (
            READABLE_FEATURE_NAMES
            .get(
                feature,
                feature
            )
        )


        if value > 0:

            direction = (
                "increased the forecast"
            )

        else:

            direction = (
                "decreased the forecast"
            )


        parts.append(
            f"{label} {direction}"
        )


    return (
        "The forecast was mainly influenced by "
        +
        ", ".join(parts)
        +
        "."
    )