# ============================================================
# FINOPTIX — MULTI-CLOUD FORECAST PREPROCESSING
#
# Supports final forecasting models for:
#   - Azure
#   - GCP / Borg
#   - Alibaba
#
# This file generates the complete feature pool.
# Each provider model selects ONLY the features contained
# in its saved *_features.json file.
# ============================================================

import numpy as np
import pandas as pd


# ============================================================
# PREPARE RESOURCE HISTORY FOR FORECASTING
# ============================================================

def prepare_for_forecasting(
    df: pd.DataFrame,
    timestamp_col="timestamp",
    cpu_col="cpu_util_percent",
    mem_col="mem_util_percent",
):

    df = df.copy()


    # ========================================================
    # 1. CLEAN TIMESTAMP
    # ========================================================

    df[timestamp_col] = pd.to_datetime(
        df[timestamp_col],
        errors="coerce"
    )


    # ========================================================
    # 2. CLEAN CPU / MEMORY
    # ========================================================

    df[cpu_col] = pd.to_numeric(
        df[cpu_col],
        errors="coerce"
    )

    df[mem_col] = pd.to_numeric(
        df[mem_col],
        errors="coerce"
    )


    # ========================================================
    # 3. REMOVE INVALID ROWS
    # ========================================================

    df = df.dropna(
        subset=[
            timestamp_col,
            cpu_col,
            mem_col
        ]
    ).copy()


    # ========================================================
    # 4. SORT CHRONOLOGICALLY
    # ========================================================

    df = df.sort_values(
        timestamp_col
    )


    # ========================================================
    # 5. CREATE HOURLY TIME SERIES
    # ========================================================

    hourly = (
        df
        .set_index(timestamp_col)
        .resample("1h")
        .agg({
            cpu_col: "mean",
            mem_col: "mean"
        })
    )


    # Standardize column names
    hourly = hourly.rename(
        columns={
            cpu_col: "cpu_util_percent",
            mem_col: "mem_util_percent"
        }
    )


    # ========================================================
    # 6. INTERPOLATE ONLY SMALL GAPS
    # ========================================================

    hourly["cpu_util_percent"] = (
        hourly["cpu_util_percent"]
        .interpolate(
            method="time",
            limit=3
        )
    )


    hourly["mem_util_percent"] = (
        hourly["mem_util_percent"]
        .interpolate(
            method="time",
            limit=3
        )
    )


    # ========================================================
    # 7. TIME FEATURES
    # ========================================================

    hourly["hour"] = (
        hourly.index.hour
    )

    hourly["day_of_week"] = (
        hourly.index.dayofweek
    )

    hourly["is_weekend"] = (
        hourly["day_of_week"]
        .isin([5, 6])
        .astype(int)
    )


    # --------------------------------------------------------
    # Hour cyclical encoding
    # --------------------------------------------------------

    hourly["hour_sin"] = np.sin(
        2
        * np.pi
        * hourly["hour"]
        / 24
    )

    hourly["hour_cos"] = np.cos(
        2
        * np.pi
        * hourly["hour"]
        / 24
    )


    # --------------------------------------------------------
    # Day-of-week cyclical encoding
    # --------------------------------------------------------

    hourly["dow_sin"] = np.sin(
        2
        * np.pi
        * hourly["day_of_week"]
        / 7
    )

    hourly["dow_cos"] = np.cos(
        2
        * np.pi
        * hourly["day_of_week"]
        / 7
    )


    # ========================================================
    # 8. CPU LAG FEATURES
    # ========================================================

    for lag in [
        1,
        3,
        6,
        12,
        24,
        48
    ]:

        hourly[
            f"cpu_lag_{lag}"
        ] = (
            hourly[
                "cpu_util_percent"
            ]
            .shift(lag)
        )


    # ========================================================
    # 9. MEMORY LAG FEATURES
    # ========================================================

    for lag in [
        1,
        3,
        6,
        12,
        24,
        48
    ]:

        hourly[
            f"mem_lag_{lag}"
        ] = (
            hourly[
                "mem_util_percent"
            ]
            .shift(lag)
        )


    # ========================================================
    # 10. CPU ROLLING FEATURES
    # ========================================================

    for window in [
        6,
        12,
        24,
        48
    ]:

        # Mean
        hourly[
            f"cpu_roll_mean_{window}"
        ] = (
            hourly[
                "cpu_util_percent"
            ]
            .rolling(window)
            .mean()
        )


        # Standard deviation
        hourly[
            f"cpu_roll_std_{window}"
        ] = (
            hourly[
                "cpu_util_percent"
            ]
            .rolling(window)
            .std()
        )


    # ========================================================
    # 11. MEMORY ROLLING FEATURES
    # ========================================================

    for window in [
        6,
        12,
        24,
        48
    ]:

        # Mean
        hourly[
            f"mem_roll_mean_{window}"
        ] = (
            hourly[
                "mem_util_percent"
            ]
            .rolling(window)
            .mean()
        )


        # Standard deviation
        hourly[
            f"mem_roll_std_{window}"
        ] = (
            hourly[
                "mem_util_percent"
            ]
            .rolling(window)
            .std()
        )


    # ========================================================
    # 12. ALTERNATE ROLLING FEATURE NAMES
    #
    # Different provider notebooks used slightly different
    # naming conventions during training.
    #
    # We generate both forms here.
    # ========================================================

    for window in [
        6,
        12,
        24,
        48
    ]:

        # CPU mean
        hourly[
            f"cpu_rolling_{window}_mean"
        ] = (
            hourly[
                f"cpu_roll_mean_{window}"
            ]
        )


        # CPU std
        hourly[
            f"cpu_rolling_{window}_std"
        ] = (
            hourly[
                f"cpu_roll_std_{window}"
            ]
        )


        # Memory mean
        hourly[
            f"mem_rolling_{window}_mean"
        ] = (
            hourly[
                f"mem_roll_mean_{window}"
            ]
        )


        # Memory std
        hourly[
            f"mem_rolling_{window}_std"
        ] = (
            hourly[
                f"mem_roll_std_{window}"
            ]
        )


    # ========================================================
    # 13. CPU 24-HOUR MIN / MAX
    #
    # Required by final Borg / GCP CPU model
    # ========================================================

    hourly[
        "cpu_rolling_24_min"
    ] = (
        hourly[
            "cpu_util_percent"
        ]
        .rolling(24)
        .min()
    )


    hourly[
        "cpu_rolling_24_max"
    ] = (
        hourly[
            "cpu_util_percent"
        ]
        .rolling(24)
        .max()
    )


    # ========================================================
    # 14. MEMORY 24-HOUR MIN / MAX
    #
    # Generated for provider/model compatibility.
    # ========================================================

    hourly[
        "mem_rolling_24_min"
    ] = (
        hourly[
            "mem_util_percent"
        ]
        .rolling(24)
        .min()
    )


    hourly[
        "mem_rolling_24_max"
    ] = (
        hourly[
            "mem_util_percent"
        ]
        .rolling(24)
        .max()
    )


    # ========================================================
    # 15. STANDARD 6-HOUR TREND FEATURES
    # ========================================================

    hourly[
        "cpu_trend_6h"
    ] = (
        hourly[
            "cpu_util_percent"
        ]
        -
        hourly[
            "cpu_lag_6"
        ]
    )


    hourly[
        "mem_trend_6h"
    ] = (
        hourly[
            "mem_util_percent"
        ]
        -
        hourly[
            "mem_lag_6"
        ]
    )


    # ========================================================
    # 16. SHORT VS LONG ROLLING TREND
    #
    # Used for Alibaba compatibility
    # ========================================================

    hourly[
        "cpu_trend"
    ] = (
        hourly[
            "cpu_roll_mean_6"
        ]
        -
        hourly[
            "cpu_roll_mean_24"
        ]
    )


    hourly[
        "mem_trend"
    ] = (
        hourly[
            "mem_roll_mean_6"
        ]
        -
        hourly[
            "mem_roll_mean_24"
        ]
    )


    # ========================================================
    # 17. BORG / GCP CPU TREND FEATURES
    # ========================================================

    hourly[
        "cpu_trend_12_24"
    ] = (
        hourly[
            "cpu_rolling_12_mean"
        ]
        -
        hourly[
            "cpu_rolling_24_mean"
        ]
    )


    hourly[
        "cpu_trend_24_48"
    ] = (
        hourly[
            "cpu_rolling_24_mean"
        ]
        -
        hourly[
            "cpu_rolling_48_mean"
        ]
    )


    # ========================================================
    # 18. BORG / GCP MEMORY TREND FEATURES
    # ========================================================

    hourly[
        "mem_trend_12_24"
    ] = (
        hourly[
            "mem_rolling_12_mean"
        ]
        -
        hourly[
            "mem_rolling_24_mean"
        ]
    )


    hourly[
        "mem_trend_24_48"
    ] = (
        hourly[
            "mem_rolling_24_mean"
        ]
        -
        hourly[
            "mem_rolling_48_mean"
        ]
    )


    # ========================================================
    # 19. BORG CPU MODEL — MEMORY AUXILIARY FEATURES
    #
    # Final Borg CPU model uses recent memory behaviour as
    # additional predictors.
    # ========================================================

    hourly[
        "mem_rolling_12_mean_cpumodel"
    ] = (
        hourly[
            "mem_util_percent"
        ]
        .rolling(12)
        .mean()
    )


    hourly[
        "mem_rolling_24_mean_cpumodel"
    ] = (
        hourly[
            "mem_util_percent"
        ]
        .rolling(24)
        .mean()
    )


    # ========================================================
    # 20. BORG MEMORY MODEL — CPU AUXILIARY FEATURES
    #
    # Final Borg memory model uses recent CPU behaviour as
    # additional predictors.
    # ========================================================

    hourly[
        "cpu_rolling_12_mean_memmodel"
    ] = (
        hourly[
            "cpu_util_percent"
        ]
        .rolling(12)
        .mean()
    )


    hourly[
        "cpu_rolling_24_mean_memmodel"
    ] = (
        hourly[
            "cpu_util_percent"
        ]
        .rolling(24)
        .mean()
    )


    # ========================================================
    # 21. RETURN COMPLETE FEATURE DATAFRAME
    # ========================================================

    return hourly