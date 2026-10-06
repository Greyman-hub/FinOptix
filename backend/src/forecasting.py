# ============================================================
# FINOPTIX — MULTI-CLOUD FORECASTING
# ============================================================

import json
from pathlib import Path

import numpy as np
import pandas as pd
from xgboost import XGBRegressor


# ============================================================
# PROVIDER FILE CONFIGURATION
# ============================================================

PROVIDER_FILES = {

    "Azure": {
        "cpu_model": "azure_cpu_xgb.json",
        "mem_model": "azure_memory_xgb.json",
        "cpu_features": "azure_cpu_features.json",
        "mem_features": "azure_memory_features.json",
    },

    "GCP": {
        "cpu_model": "borg_cpu_xgb.json",
        "mem_model": "borg_memory_xgb.json",
        "cpu_features": "borg_cpu_features.json",
        "mem_features": "borg_memory_features.json",
    },

    "Alibaba": {
        "cpu_model": "alibaba_cpu_xgb.json",
        "mem_model": "alibaba_memory_xgb.json",
        "cpu_features": "alibaba_cpu_features.json",
        "mem_features": "alibaba_memory_features.json",
    }
}


# ============================================================
# LOAD JSON
# ============================================================

def load_json(path):

    with open(
        path,
        "r"
    ) as f:

        return json.load(f)


# ============================================================
# LOAD ALL MODELS
# ============================================================

def load_models(models_dir: Path):

    models = {}

    for provider, files in PROVIDER_FILES.items():

        # ----------------------------------------------------
        # CPU MODEL
        # ----------------------------------------------------

        cpu_model = XGBRegressor()

        cpu_model.load_model(
            str(
                models_dir /
                files["cpu_model"]
            )
        )


        # ----------------------------------------------------
        # MEMORY MODEL
        # ----------------------------------------------------

        mem_model = XGBRegressor()

        mem_model.load_model(
            str(
                models_dir /
                files["mem_model"]
            )
        )


        # ----------------------------------------------------
        # FEATURE LISTS
        # ----------------------------------------------------

        cpu_features = load_json(
            models_dir /
            files["cpu_features"]
        )

        mem_features = load_json(
            models_dir /
            files["mem_features"]
        )


        # ----------------------------------------------------
        # STORE PROVIDER MODELS
        # ----------------------------------------------------

        models[provider] = {

            "cpu":
                cpu_model,

            "mem":
                mem_model,

            "cpu_features":
                cpu_features,

            "mem_features":
                mem_features
        }


    return models


# ============================================================
# GCP / BORG FEATURE SCALE CONVERSION
# ============================================================

def convert_gcp_features_to_fraction(
    feature_df: pd.DataFrame
):

    """
    Borg / GCP forecasting models were trained using
    utilization values represented as fractions:

        0.00 -> 0%
        0.50 -> 50%
        1.00 -> 100%

    The FinOptix backend uses percentage values:

        0 -> 0%
        50 -> 50%
        100 -> 100%

    Therefore utilization-derived features must be converted
    from percentage scale to fraction scale before being sent
    to the Borg models.

    Time/calendar features are NOT scaled.
    """

    feature_df = feature_df.copy()


    # ========================================================
    # FEATURES THAT MUST NOT BE DIVIDED BY 100
    # ========================================================

    non_utilization_features = {

        "hour",
        "day_of_week",
        "is_weekend",
        "hour_sin",
        "hour_cos",
        "dow_sin",
        "dow_cos"
    }


    # ========================================================
    # SCALE UTILIZATION-DERIVED FEATURES
    # ========================================================

    for column in feature_df.columns:

        if column in non_utilization_features:
            continue


        # CPU / memory features are utilization-derived.
        #
        # Examples:
        # cpu_lag_1
        # cpu_rolling_24_mean
        # cpu_rolling_24_std
        # cpu_rolling_24_min
        # cpu_rolling_24_max
        # cpu_trend_12_24
        # mem_rolling_24_mean_cpumodel
        # cpu_rolling_24_mean_memmodel

        if (
            column.startswith("cpu_")
            or
            column.startswith("mem_")
        ):

            feature_df[column] = (
                feature_df[column]
                / 100.0
            )


    return feature_df


# ============================================================
# FORECAST ONE RESOURCE
# ============================================================

def forecast_provider(
    feature_df: pd.DataFrame,
    provider: str,
    models: dict
):


    # ========================================================
    # 1. CHECK PROVIDER
    # ========================================================

    if provider not in models:

        raise ValueError(
            f"No forecasting model found for {provider}"
        )


    provider_models = models[
        provider
    ]


    cpu_features = provider_models[
        "cpu_features"
    ]


    mem_features = provider_models[
        "mem_features"
    ]


    # ========================================================
    # 2. CHECK REQUIRED FEATURES
    # ========================================================

    missing_cpu = [

        col

        for col in cpu_features

        if col not in feature_df.columns

    ]


    missing_mem = [

        col

        for col in mem_features

        if col not in feature_df.columns

    ]


    if missing_cpu:

        raise ValueError(

            f"Missing CPU features for "
            f"{provider}: {missing_cpu}"

        )


    if missing_mem:

        raise ValueError(

            f"Missing memory features for "
            f"{provider}: {missing_mem}"

        )


    # ========================================================
    # 3. FIND LATEST COMPLETE FEATURE ROW
    # ========================================================

    required_features = list(

        dict.fromkeys(

            cpu_features +
            mem_features

        )

    )


    ready = feature_df.dropna(

        subset=required_features

    ).copy()


    # ========================================================
    # 4. INSUFFICIENT HISTORY
    # ========================================================

    if ready.empty:

        return None


    # Latest row where every required model feature exists
    latest = ready.iloc[
        [-1]
    ].copy()


    # ========================================================
    # 5. SELECT CPU FEATURES
    # ========================================================

    X_cpu = latest[
        cpu_features
    ].copy()


    # ========================================================
    # 6. SELECT MEMORY FEATURES
    # ========================================================

    X_mem = latest[
        mem_features
    ].copy()


    # ========================================================
    # 7. GCP / BORG INPUT SCALE CONVERSION
    # ========================================================
    #
    # Azure:
    #     model trained on percentage scale
    #
    # Alibaba:
    #     model trained on percentage scale
    #
    # Borg / GCP:
    #     model trained on fractional scale
    #
    # Therefore ONLY GCP needs conversion.
    # ========================================================

    if provider == "GCP":

        X_cpu_model = (
            convert_gcp_features_to_fraction(
                X_cpu
            )
        )

        X_mem_model = (
            convert_gcp_features_to_fraction(
                X_mem
            )
        )

    else:

        X_cpu_model = X_cpu.copy()

        X_mem_model = X_mem.copy()


    # ========================================================
    # 8. CPU FORECAST
    # ========================================================

    cpu_forecast = (

        provider_models[
            "cpu"
        ]
        .predict(
            X_cpu_model
        )[0]

    )


    # ========================================================
    # 9. MEMORY FORECAST
    # ========================================================

    mem_forecast = (

        provider_models[
            "mem"
        ]
        .predict(
            X_mem_model
        )[0]

    )


    # ========================================================
    # 10. GCP / BORG OUTPUT SCALE CONVERSION
    # ========================================================
    #
    # Borg model prediction:
    #
    #     0.75
    #
    # means:
    #
    #     75%
    #
    # FinOptix expects all providers to return percentages.
    # ========================================================

    if provider == "GCP":

        cpu_forecast = (
            cpu_forecast
            * 100.0
        )

        mem_forecast = (
            mem_forecast
            * 100.0
        )


    # ========================================================
    # 11. VALID UTILIZATION RANGE
    # ========================================================

    cpu_forecast = float(

        np.clip(
            cpu_forecast,
            0,
            100
        )

    )


    mem_forecast = float(

        np.clip(
            mem_forecast,
            0,
            100
        )

    )


    # ========================================================
    # 12. RETURN FORECAST
    # ========================================================

    return {

        "cpu_forecast":
            cpu_forecast,

        "mem_forecast":
            mem_forecast,

        # IMPORTANT:
        #
        # Return the feature rows on the same scale that was
        # actually supplied to each XGBoost model.
        #
        # This keeps SHAP/explanation generation consistent
        # with the prediction.

        "cpu_feature_row":
            X_cpu_model.iloc[0],

        "mem_feature_row":
            X_mem_model.iloc[0],

        "forecast_timestamp":
            latest.index[0]
    }