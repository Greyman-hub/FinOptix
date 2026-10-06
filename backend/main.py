"""
FinOptix backend — FastAPI app.

Exposes:
    POST /analyze
        Upload a CSV and receive multi-cloud resource diagnostics,
        next-24-hour CPU/memory forecasts, health classification,
        optimization recommendations, financial impact,
        SHAP explanations, and Terraform remediation.

Run with:
    uvicorn main:app --reload
"""

# ============================================================
# IMPORTS
# ============================================================

import io
from pathlib import Path

import numpy as np
import pandas as pd

from fastapi import (
    FastAPI,
    File,
    HTTPException,
    UploadFile
)

from fastapi.middleware.cors import (
    CORSMiddleware
)

# ============================================================
# FINOPTIX MODULES
# ============================================================

from src.explainability import (
    build_explainers,
    explain_forecast
)

from src.forecasting import (
    forecast_provider,
    load_models
)

from src.health import (
    classify_health
)

from src.optimization import (
    get_recommended_row
)

from src.preprocessing import (
    prepare_for_forecasting
)

from src.terraform_gen import (
    generate_terraform
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).parent

MODELS_DIR = (
    BASE_DIR /
    "models"
)

PRICING_PATH = (
    BASE_DIR /
    "data" /
    "pricing.csv"
)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="FinOptix API"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# ============================================================
# LOAD MODELS
# ============================================================

_models = load_models(
    MODELS_DIR
)


# ============================================================
# BUILD SHAP EXPLAINERS
# ============================================================

_explainers = build_explainers(
    _models
)


# ============================================================
# LOAD PRICING DATA
# ============================================================

if PRICING_PATH.exists():

    _pricing_df = pd.read_csv(
        PRICING_PATH
    )

else:

    _pricing_df = pd.DataFrame()


# ============================================================
# HEALTH ENDPOINT
# ============================================================

@app.get("/health")
def health_check():

    return {
        "status": "ok",
        "providers": list(
            _models.keys()
        )
    }

# ============================================================
# NORMALIZE COLUMN NAMES
# ============================================================

def normalize_columns(
    df: pd.DataFrame
) -> pd.DataFrame:

    """
    Normalize common input column names into the
    internal FinOptix schema.
    """

    df = df.copy()

    col_map = {}


    for col in df.columns:

        c_lower = (
            str(col)
            .strip()
            .lower()
        )


        # ----------------------------------------------------
        # CPU
        # ----------------------------------------------------

        if c_lower in (

            "cpu_util",
            "cpu_util_percent",
            "cpu",
            "cpu_%",
            "cpu_usage"

        ):

            col_map[col] = (
                "cpu_util_percent"
            )


        # ----------------------------------------------------
        # MEMORY
        # ----------------------------------------------------

        elif c_lower in (

            "memory_util",
            "mem_util_percent",
            "mem",
            "memory",
            "mem_%",
            "memory_usage"

        ):

            col_map[col] = (
                "mem_util_percent"
            )


        # ----------------------------------------------------
        # COST
        # ----------------------------------------------------

        elif c_lower in (

            "current_cost",
            "cost_usd",
            "cost",
            "cost_per_hr",
            "cost_hr"

        ):

            col_map[col] = (
                "cost_usd"
            )


        # ----------------------------------------------------
        # RESOURCE ID
        # ----------------------------------------------------

        elif c_lower in (

            "resource_id",
            "resource",
            "instance_id",
            "name",
            "resource_name"

        ):

            col_map[col] = (
                "resource_id"
            )


        # ----------------------------------------------------
        # INSTANCE TYPE
        # ----------------------------------------------------

        elif c_lower in (

            "instance_type",
            "type",
            "machine_type",
            "size"

        ):

            col_map[col] = (
                "instance_type"
            )


        # ----------------------------------------------------
        # PROVIDER
        # ----------------------------------------------------

        elif c_lower in (

            "provider",
            "cloud",
            "vendor"

        ):

            col_map[col] = (
                "provider"
            )


        # ----------------------------------------------------
        # TIMESTAMP
        # ----------------------------------------------------

        elif c_lower in (

            "timestamp",
            "time",
            "date",
            "datetime"

        ):

            col_map[col] = (
                "timestamp"
            )


    return df.rename(
        columns=col_map
    )


# ============================================================
# NORMALIZE PROVIDER NAME
# ============================================================

def normalize_provider_name(
    provider
):

    p = (
        str(provider)
        .strip()
        .lower()
    )


    if p in (
        "borg",
        "gcp",
        "google",
        "google cloud"
    ):

        return "GCP"


    if p in (
        "azure",
        "microsoft azure"
    ):

        return "Azure"


    if p in (
        "alibaba",
        "ali",
        "alibaba cloud"
    ):

        return "Alibaba"


    return str(
        provider
    ).strip()


# ============================================================
# LOOK UP COST
# ============================================================

def lookup_cost(
    provider,
    instance_type
):

    """
    Find hourly price from pricing.csv.

    If no matching price exists, use the fallback rate.
    """

    if _pricing_df.empty:

        return 0.1500


    required_cols = {

        "provider",
        "instance_type",
        "hourly_rate_usd"

    }


    if not required_cols.issubset(
        _pricing_df.columns
    ):

        return 0.1500


    match = _pricing_df[

        (
            _pricing_df[
                "provider"
            ] == provider
        )

        &

        (
            _pricing_df[
                "instance_type"
            ] == instance_type
        )

    ]


    if match.empty:

        return 0.1500


    return float(
        match.iloc[0][
            "hourly_rate_usd"
        ]
    )



# ============================================================
# HUMAN-READABLE FORECAST EXPLANATION
# ============================================================

def build_human_forecast_explanation(
    health,
    cpu_util,
    mem_util,
    cpu_forecast,
    mem_forecast,
    shap_available=False
):
    """
    Convert forecast + SHAP analysis into a concise,
    user-friendly FinOps explanation.

    SHAP is still calculated internally, but technical feature
    names are not exposed directly in the dashboard.
    """

    cpu_change = cpu_forecast - cpu_util
    mem_change = mem_forecast - mem_util

    if health == "Overutilized":
        explanation = (
            f"The forecast indicates sustained high resource demand "
            f"over the next 24 hours, with CPU expected to average "
            f"{cpu_forecast:.1f}% and memory {mem_forecast:.1f}%. "
            f"The current instance may not provide enough capacity "
            f"for the expected workload, increasing the risk of "
            f"resource saturation and performance degradation."
        )
    elif health == "Underutilized":
        explanation = (
            f"The forecast indicates that this resource is likely "
            f"to continue operating below its available capacity "
            f"over the next 24 hours. CPU is expected to average "
            f"{cpu_forecast:.1f}% and memory {mem_forecast:.1f}%. "
            f"The workload may therefore be suitable for a smaller "
            f"instance without significantly affecting performance."
        )
    elif health == "Idle Resource":
        explanation = (
            f"The forecast indicates very low resource demand over "
            f"the next 24 hours, with CPU expected to average "
            f"{cpu_forecast:.1f}% and memory {mem_forecast:.1f}%. "
            f"The instance appears to have substantially more "
            f"capacity than the workload requires."
        )
    else:
        explanation = (
            f"The forecast remains within the recommended operating "
            f"range over the next 24 hours. CPU is expected to "
            f"average {cpu_forecast:.1f}% and memory "
            f"{mem_forecast:.1f}%. The current instance appears "
            f"appropriately sized for the expected workload."
        )

    if cpu_change >= 5:
        cpu_trend = (
            "CPU demand is expected to increase compared with "
            "the recent observed workload"
        )
    elif cpu_change <= -5:
        cpu_trend = (
            "CPU demand is expected to decrease compared with "
            "the recent observed workload"
        )
    else:
        cpu_trend = "CPU demand is expected to remain relatively stable"

    if mem_change >= 5:
        mem_trend = "memory demand is also showing an upward trend"
    elif mem_change <= -5:
        mem_trend = "memory demand is expected to ease"
    else:
        mem_trend = "memory demand is expected to remain relatively stable"

    explanation += (
        " Based on the historical utilization patterns analyzed "
        "by the forecasting model, "
        + cpu_trend
        + ", while "
        + mem_trend
        + "."
    )

    return explanation


# ============================================================
# ANALYZE ENDPOINT
# ============================================================

@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...)
):

    # ========================================================
    # READ FILE
    # ========================================================

    contents = await file.read()


    try:

        raw_df = pd.read_csv(
            io.BytesIO(
                contents
            )
        )

    except Exception as e:

        raise HTTPException(

            status_code=400,

            detail=(
                "Could not parse the uploaded "
                f"file as CSV: {str(e)}"
            )
        )


    # ========================================================
    # BASIC VALIDATION
    # ========================================================

    if raw_df.empty:

        raise HTTPException(

            status_code=400,

            detail=(
                "Uploaded CSV file is empty."
            )
        )


    # ========================================================
    # NORMALIZE COLUMNS
    # ========================================================

    raw_df = normalize_columns(
        raw_df
    )


    # ========================================================
    # CHECK REQUIRED COLUMNS
    # ========================================================

    required_columns = [

        "provider",
        "instance_type",
        "cpu_util_percent",
        "mem_util_percent"

    ]


    missing_columns = [

        col
        for col in required_columns
        if col not in raw_df.columns

    ]


    if missing_columns:

        raise HTTPException(

            status_code=400,

            detail=(
                "Missing required columns: "
                +
                ", ".join(
                    missing_columns
                )
            )
        )


    # ========================================================
    # NORMALIZE PROVIDERS
    # ========================================================

    raw_df[
        "provider"
    ] = (

        raw_df[
            "provider"
        ]
        .apply(
            normalize_provider_name
        )

    )


    # ========================================================
    # TIMESTAMP
    # ========================================================

    if "timestamp" not in raw_df.columns:

        raw_df[
            "timestamp"
        ] = pd.date_range(

            start=(
                "2025-01-01 "
                "00:00:00"
            ),

            periods=len(
                raw_df
            ),

            freq="1h"
        )


    else:

        raw_df[
            "timestamp"
        ] = pd.to_datetime(

            raw_df[
                "timestamp"
            ],

            errors="coerce"
        )


    # ========================================================
    # RESOURCE ID
    # ========================================================

    if "resource_id" not in raw_df.columns:

        raw_df[
            "resource_id"
        ] = raw_df.apply(

            lambda r: (

                f"{str(r['provider']).lower()}-"
                f"res-"
                f"{abs(hash(str(r['instance_type']))) % 10000:04d}"

            ),

            axis=1
        )


    # ========================================================
    # COST
    # ========================================================

    if "cost_usd" not in raw_df.columns:

        raw_df[
            "cost_usd"
        ] = raw_df.apply(

            lambda row: lookup_cost(

                row[
                    "provider"
                ],

                row[
                    "instance_type"
                ]
            ),

            axis=1
        )


    # ========================================================
    # NUMERIC CONVERSION
    # ========================================================

    raw_df[
        "cpu_util_percent"
    ] = pd.to_numeric(

        raw_df[
            "cpu_util_percent"
        ],

        errors="coerce"
    )


    raw_df[
        "mem_util_percent"
    ] = pd.to_numeric(

        raw_df[
            "mem_util_percent"
        ],

        errors="coerce"
    )


    raw_df[
        "cost_usd"
    ] = pd.to_numeric(

        raw_df[
            "cost_usd"
        ],

        errors="coerce"
    )


    # ========================================================
    # DROP INVALID UTILIZATION ROWS
    # ========================================================

    raw_df = raw_df.dropna(

        subset=[

            "timestamp",
            "cpu_util_percent",
            "mem_util_percent"

        ]

    ).copy()


    if raw_df.empty:

        raise HTTPException(

            status_code=400,

            detail=(
                "No valid timestamp/CPU/memory "
                "rows were found."
            )
        )


    # ========================================================
    # FILL MISSING COSTS
    # ========================================================

    raw_df[
        "cost_usd"
    ] = raw_df[
        "cost_usd"
    ].fillna(
        0.1500
    )


    # ========================================================
    # GROUP RESOURCES
    # ========================================================

    grouped_resources = raw_df.groupby(

        [

            "provider",
            "resource_id",
            "instance_type"

        ]

    )


    diagnostics = []


    # ========================================================
    # ANALYZE EACH RESOURCE
    # ========================================================

    for (

        provider,
        resource_id,
        instance_type

    ), res_df in grouped_resources:


        # ====================================================
        # CHECK PROVIDER MODEL
        # ====================================================

        if provider not in _models:

            diagnostics.append({

                "provider":
                    provider,

                "resource_id":
                    resource_id,

                "instance_type":
                    instance_type,

                "error":
                    (
                        "Unsupported cloud provider: "
                        f"{provider}"
                    )

            })

            continue


        model_key = provider


        # ====================================================
        # SORT RESOURCE HISTORY
        # ====================================================

        res_df = (

            res_df
            .sort_values(
                "timestamp"
            )
            .copy()

        )


        latest_row = (
            res_df.iloc[-1]
        )


        # ====================================================
        # OBSERVED UTILIZATION
        # ====================================================

        cpu_util = float(

            res_df[
                "cpu_util_percent"
            ].mean()

        )


        mem_util = float(

            res_df[
                "mem_util_percent"
            ].mean()

        )


        current_cost = float(

            latest_row[
                "cost_usd"
            ]

        )


        # ====================================================
        # PREPARE FORECAST FEATURES
        # ====================================================

        try:

            hourly = (
                prepare_for_forecasting(
                    res_df
                )
            )


            forecast_result = (
                forecast_provider(

                    hourly,

                    model_key,

                    _models
                )
            )


        except Exception as e:

            print(

                "Forecasting failed for "
                f"{provider}/"
                f"{resource_id}: "
                f"{e}"

            )

            forecast_result = None


        # ====================================================
        # FORECAST RESULTS
        # ====================================================

        if forecast_result is not None:

            cpu_forecast = float(

                forecast_result[
                    "cpu_forecast"
                ]

            )


            mem_forecast = float(

                forecast_result[
                    "mem_forecast"
                ]

            )


            forecast_source = (
                "XGBoost"
            )


        else:

            cpu_forecast = (
                cpu_util
            )

            mem_forecast = (
                mem_util
            )

            forecast_source = (
                "Observed average fallback"
            )


        # ====================================================
        # CLIP UTILIZATION
        # ====================================================

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


        # ====================================================
        # HEALTH CLASSIFICATION
        # ====================================================

        health = classify_health(

            cpu_forecast,

            mem_forecast,

            provider
        )


        if health == "Idle":

            health = (
                "Idle Resource"
            )


        # ====================================================
        # PRIORITY
        # ====================================================

        if health == "Overutilized":

            priority = "High"


        elif health == "Idle Resource":

            priority = (

                "High"

                if current_cost > 0.20

                else "Medium"

            )


        elif health == "Underutilized":

            priority = "Medium"


        else:

            priority = "Low"


        # ====================================================
        # DEFAULT RECOMMENDATION VALUES
        # ====================================================

        recommended_instance = (
            instance_type
        )


        recommended_rate = (
            current_cost
        )


        # Savings are ONLY for downsizing.
        savings = 0.0
        savings_pct = 0.0

        # Additional cost is ONLY for upsizing.
        additional_cost = 0.0
        additional_cost_pct = 0.0

        financial_impact_type = (
            "no_change"
        )


        explanation = (

            "Resource is operating within "
            "healthy performance thresholds."

        )


        tf_code = ""


        # ====================================================
        # SHAP EXPLANATION
        # ====================================================

        shap_available = False
        raw_shap_explanation = None

        if forecast_result is not None:
            try:
                cpu_features = (
                    _models[
                        model_key
                    ][
                        "cpu_features"
                    ]
                )

                # SHAP remains the internal explainability layer.
                # The raw technical feature names are not exposed
                # directly in the dashboard.
                raw_shap_explanation = (
                    explain_forecast(
                        _explainers[
                            model_key
                        ][
                            "cpu"
                        ],
                        forecast_result[
                            "cpu_feature_row"
                        ],
                        cpu_features
                    )
                )

                shap_available = True

            except Exception as e:
                print(
                    "SHAP explanation failed "
                    f"for {provider}/"
                    f"{resource_id}: "
                    f"{e}"
                )

                shap_available = False

        # ====================================================
        # USER-FRIENDLY EXPLANATION
        # ====================================================

        if forecast_result is not None:
            explanation = (
                build_human_forecast_explanation(
                    health=health,
                    cpu_util=cpu_util,
                    mem_util=mem_util,
                    cpu_forecast=cpu_forecast,
                    mem_forecast=mem_forecast,
                    shap_available=shap_available
                )
            )
        else:
            explanation = (
                "There is not enough historical data to generate "
                "a model-based 24-hour forecast for this resource. "
                f"The observed average utilization is "
                f"{cpu_util:.1f}% CPU and "
                f"{mem_util:.1f}% memory."
            )


        # ====================================================
        # OPTIMIZATION
        # ====================================================

        if health != "Healthy":

            optimization_health = (

                "Idle"

                if health == "Idle Resource"

                else health

            )


            rec_row = get_recommended_row(
            pricing_df=_pricing_df,
            provider=provider,
            current_instance_type=instance_type,
            health_status=optimization_health
        )


            if rec_row is not None:

                recommended_instance = (

                    rec_row[
                        "instance_type"
                    ]

                )


                recommended_rate = float(

                    rec_row[
                        "hourly_rate_usd"
                    ]

                )


                # ============================================
                # DOWNSIZE → SAVINGS
                # ============================================

                if health in (
                    "Idle Resource",
                    "Underutilized"
                ):

                    savings = max(

                        0.0,

                        current_cost
                        -
                        recommended_rate

                    )


                    if current_cost > 0:

                        savings_pct = (

                            savings
                            /
                            current_cost
                            *
                            100

                        )


                    financial_impact_type = (
                        "savings"
                    )


                # ============================================
                # UPSIZE → CAPACITY INVESTMENT
                # ============================================

                elif health == "Overutilized":

                    additional_cost = max(

                        0.0,

                        recommended_rate
                        -
                        current_cost

                    )


                    if current_cost > 0:

                        additional_cost_pct = (

                            additional_cost
                            /
                            current_cost
                            *
                            100

                        )


                    financial_impact_type = (
                        "capacity_investment"
                    )


                # ============================================
                # TERRAFORM
                # ============================================

                if recommended_instance != instance_type:

                    tf_code = (
                        generate_terraform(

                            provider,

                            resource_name=(
                                resource_id
                            ),

                            instance_type=(
                                recommended_instance
                            )
                        )
                    )


        # ====================================================
        # MONTHLY FINANCIAL VALUES
        # ====================================================

        current_monthly_cost = (
            current_cost * 730
        )

        recommended_monthly_cost = (
            recommended_rate * 730
        )

        monthly_savings = (
            savings * 730
        )

        monthly_additional_cost = (
            additional_cost * 730
        )


        # ====================================================
        # FINANCIAL MESSAGE
        # ====================================================

        if financial_impact_type == "savings":

            financial_message = (

                "Rightsizing this resource to the "
                "recommended smaller instance could "
                f"save approximately "
                f"${monthly_savings:.2f} per month."

            )


        elif financial_impact_type == "capacity_investment":

            financial_message = (

                "This resource is forecast to be "
                "overutilized. Upsizing increases "
                f"estimated infrastructure cost by "
                f"${monthly_additional_cost:.2f} per month, "
                "but provides additional capacity to reduce "
                "performance degradation and resource "
                "saturation risk."

            )


        else:

            financial_message = (

                "No instance-size change is currently "
                "recommended, so there is no projected "
                "financial impact."

            )


        # ====================================================
        # DIAGNOSTIC RESULT
        # ====================================================

        diagnostics.append({

            # ------------------------------------------------
            # RESOURCE
            # ------------------------------------------------

            "provider":
                provider,

            "resource_id":
                resource_id,

            "instance_type":
                instance_type,


            # ------------------------------------------------
            # OBSERVED UTILIZATION
            # ------------------------------------------------

            "cpu_util":
                round(
                    cpu_util,
                    1
                ),

            "mem_util":
                round(
                    mem_util,
                    1
                ),


            # ------------------------------------------------
            # FORECAST
            # ------------------------------------------------

            "forecast": {

                "horizon_hours":
                    24,

                "type":
                    "next_24h_average",

                "source":
                    forecast_source,

                "cpu_next_24h_avg":
                    round(
                        cpu_forecast,
                        2
                    ),

                "mem_next_24h_avg":
                    round(
                        mem_forecast,
                        2
                    )

            },


            # ------------------------------------------------
            # COST
            # ------------------------------------------------

            "cost_usd":
                round(
                    current_cost,
                    5
                ),

            "cost_formatted":
                f"${current_cost:.5f}/Hr",

            "recommended_cost":
                round(
                    recommended_rate,
                    5
                ),

            "recommended_cost_formatted":
                f"${recommended_rate:.5f}/Hr",

            # Kept for frontend compatibility
            "forecasted_cost":
                round(
                    recommended_rate,
                    5
                ),

            "forecasted_cost_formatted":
                f"${recommended_rate:.5f}/Hr",


            # ------------------------------------------------
            # MONTHLY COST
            # ------------------------------------------------

            "current_monthly_cost":
                round(
                    current_monthly_cost,
                    2
                ),

            "recommended_monthly_cost":
                round(
                    recommended_monthly_cost,
                    2
                ),


            # ------------------------------------------------
            # CLASSIFICATION
            # ------------------------------------------------

            "health":
                health,

            "priority":
                priority,


            # ------------------------------------------------
            # SAVINGS
            # ------------------------------------------------

            # These will NEVER be negative.
            "savings":
                round(
                    savings,
                    5
                ),

            "savings_formatted":
                (
                    f"${savings:.5f}/Hr"
                    if savings > 0
                    else "$0.00000/Hr"
                ),

            "monthly_savings":
                round(
                    monthly_savings,
                    2
                ),


            # ------------------------------------------------
            # CAPACITY INVESTMENT
            # ------------------------------------------------

            "additional_cost":
                round(
                    additional_cost,
                    5
                ),

            "additional_cost_formatted":
                (
                    f"${additional_cost:.5f}/Hr"
                    if additional_cost > 0
                    else "$0.00000/Hr"
                ),

            "monthly_additional_cost":
                round(
                    monthly_additional_cost,
                    2
                ),


            # ------------------------------------------------
            # FINANCIAL IMPACT
            # ------------------------------------------------

            "financial_impact": {

                "type":
                    financial_impact_type,

                "savings":
                    round(
                        savings,
                        5
                    ),

                "savings_pct":
                    round(
                        savings_pct,
                        1
                    ),

                "monthly_savings":
                    round(
                        monthly_savings,
                        2
                    ),

                "additional_cost":
                    round(
                        additional_cost,
                        5
                    ),

                "additional_cost_pct":
                    round(
                        additional_cost_pct,
                        1
                    ),

                "monthly_additional_cost":
                    round(
                        monthly_additional_cost,
                        2
                    ),

                "message":
                    financial_message

            },


            # ------------------------------------------------
            # RECOMMENDATION
            # ------------------------------------------------

            "recommendation": {

                "recommended_instance_type":
                    recommended_instance,

                "current_cost":
                    round(
                        current_cost,
                        5
                    ),

                "recommended_cost":
                    round(
                        recommended_rate,
                        5
                    ),

                # Kept for compatibility
                "forecasted_cost":
                    round(
                        recommended_rate,
                        5
                    ),

                "savings":
                    round(
                        savings,
                        5
                    ),

                "savings_pct":
                    round(
                        savings_pct,
                        1
                    ),

                "additional_cost":
                    round(
                        additional_cost,
                        5
                    ),

                "additional_cost_pct":
                    round(
                        additional_cost_pct,
                        1
                    ),

                "monthly_savings":
                    round(
                        monthly_savings,
                        2
                    ),

                "monthly_additional_cost":
                    round(
                        monthly_additional_cost,
                        2
                    ),

                "financial_impact_type":
                    financial_impact_type,

                "financial_message":
                    financial_message,

                "explanation":
                    explanation,

                "terraform":
                    tf_code

            }

        })


    # ========================================================
    # PROVIDER SUMMARY
    # ========================================================

    provider_summary = {}


    for d in diagnostics:

        # Skip unsupported-provider error entries
        if "error" in d:

            continue


        provider = d[
            "provider"
        ]


        if provider not in provider_summary:

            provider_summary[
                provider
            ] = {

                "current_monthly":
                    0.0,

                "savings_monthly":
                    0.0,

                "capacity_investment_monthly":
                    0.0

            }


        # ----------------------------------------------------
        # CURRENT MONTHLY SPEND
        # ----------------------------------------------------

        provider_summary[
            provider
        ][
            "current_monthly"
        ] += (

            d[
                "cost_usd"
            ]
            *
            730

        )


        # ----------------------------------------------------
        # POTENTIAL SAVINGS
        # ----------------------------------------------------

        provider_summary[
            provider
        ][
            "savings_monthly"
        ] += (

            d.get(
                "savings",
                0
            )
            *
            730

        )


        # ----------------------------------------------------
        # CAPACITY INVESTMENT
        # ----------------------------------------------------

        provider_summary[
            provider
        ][
            "capacity_investment_monthly"
        ] += (

            d.get(
                "additional_cost",
                0
            )
            *
            730

        )


    # ========================================================
    # MONTHLY CHART DATA
    # ========================================================

    monthly_chart_data = [

        {

            "provider":
                provider,

            "current_monthly_cost":
                round(
                    data[
                        "current_monthly"
                    ],
                    2
                ),

            "potential_monthly_savings":
                round(
                    data[
                        "savings_monthly"
                    ],
                    2
                ),

            "capacity_investment_monthly":
                round(
                    data[
                        "capacity_investment_monthly"
                    ],
                    2
                )

        }

        for provider, data
        in provider_summary.items()

    ]


    # ========================================================
    # OVERALL FINANCIAL SUMMARY
    # ========================================================

    total_current_monthly_cost = sum(

        item[
            "current_monthly_cost"
        ]

        for item
        in monthly_chart_data

    )


    total_potential_monthly_savings = sum(

        item[
            "potential_monthly_savings"
        ]

        for item
        in monthly_chart_data

    )


    total_capacity_investment_monthly = sum(

        item[
            "capacity_investment_monthly"
        ]

        for item
        in monthly_chart_data

    )


    financial_summary = {

        "current_monthly_cost":
            round(
                total_current_monthly_cost,
                2
            ),

        "potential_monthly_savings":
            round(
                total_potential_monthly_savings,
                2
            ),

        "capacity_investment_monthly":
            round(
                total_capacity_investment_monthly,
                2
            ),

        "optimized_cost_after_savings":
            round(
                total_current_monthly_cost
                -
                total_potential_monthly_savings,
                2
            ),

        "projected_cost_with_capacity_investment":
            round(
                total_current_monthly_cost
                -
                total_potential_monthly_savings
                +
                total_capacity_investment_monthly,
                2
            )

    }


    # ========================================================
    # CATEGORY COUNTS
    # ========================================================

    cat_counts = {

        "Idle Resource": 0,

        "Underutilized": 0,

        "Overutilized": 0,

        "Healthy": 0

    }


    priority_counts = {

        "High": 0,

        "Medium": 0,

        "Low": 0

    }


    # ========================================================
    # COUNT CATEGORIES
    # ========================================================

    valid_diagnostics = [

        d
        for d in diagnostics
        if "error" not in d

    ]


    for d in valid_diagnostics:

        health = d[
            "health"
        ]

        priority = d[
            "priority"
        ]


        if health in cat_counts:

            cat_counts[
                health
            ] += 1


        if priority in priority_counts:

            priority_counts[
                priority
            ] += 1


    # ========================================================
    # CATEGORY BREAKDOWN
    # ========================================================

    total_valid_resources = len(
        valid_diagnostics
    )


    denominator = max(
        1,
        total_valid_resources
    )


    category_breakdown = [

        {

            "category":
                category,

            "count":
                count,

            "percentage":
                round(
                    count
                    /
                    denominator
                    *
                    100
                )

        }

        for category, count
        in cat_counts.items()

    ]


    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return {

        "diagnostics":
            diagnostics,

        "monthly_chart_data":
            monthly_chart_data,

        "financial_summary":
            financial_summary,

        "category_breakdown":
            category_breakdown,

        "priority_counts":
            priority_counts,

        "total_resources":
            total_valid_resources,

        "supported_providers": [
            "Azure",
            "GCP",
            "Alibaba"
        ],

        "forecast_horizon_hours":
            24,

        "forecast_type":
            "next_24h_average"

    }