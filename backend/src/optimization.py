"""Optimization logic for FinOptix.

Recommends the immediately adjacent instance size:
- Overutilized  -> next larger instance
- Underutilized -> next smaller instance
- Idle          -> next smaller instance
- Healthy       -> no change
"""

import pandas as pd


# ============================================================
# GET RECOMMENDED INSTANCE
# ============================================================

def get_recommended_row(
    pricing_df: pd.DataFrame,
    provider: str,
    current_instance_type: str,
    health_status: str
):

    # --------------------------------------------------------
    # FILTER PROVIDER PRICING
    # --------------------------------------------------------

    provider_prices = pricing_df[
        pricing_df["provider"] == provider
    ].copy()

    if provider_prices.empty:
        return None


    # --------------------------------------------------------
    # SORT INSTANCES BY CAPACITY
    # vCPU first, memory second
    # --------------------------------------------------------

    provider_prices = (
        provider_prices
        .sort_values(
            by=["vcpu", "memory_gb"]
        )
        .reset_index(drop=True)
    )


    # --------------------------------------------------------
    # FIND CURRENT INSTANCE
    # --------------------------------------------------------

    current_matches = provider_prices[
        provider_prices["instance_type"] == current_instance_type
    ]

    if current_matches.empty:
        return None


    current_index = current_matches.index[0]


    # --------------------------------------------------------
    # HEALTHY -> NO CHANGE
    # --------------------------------------------------------

    if health_status == "Healthy":
        return None


    # --------------------------------------------------------
    # OVERUTILIZED -> NEXT LARGER INSTANCE
    # --------------------------------------------------------

    if health_status == "Overutilized":

        next_index = current_index + 1

        if next_index >= len(provider_prices):
            return None

        return provider_prices.iloc[next_index]


    # --------------------------------------------------------
    # UNDERUTILIZED / IDLE -> NEXT SMALLER INSTANCE
    # --------------------------------------------------------

    if health_status in (
        "Underutilized",
        "Idle"
    ):

        previous_index = current_index - 1

        if previous_index < 0:
            return None

        return provider_prices.iloc[previous_index]


    return None


# ============================================================
# CALCULATE FINANCIAL IMPACT
# ============================================================

def calculate_savings(
    pricing_df: pd.DataFrame,
    provider: str,
    current_instance_type: str,
    recommended_row,
    forecast_hours: int
):

    current_row = pricing_df[
        (
            pricing_df["provider"] == provider
        )
        &
        (
            pricing_df["instance_type"] ==
            current_instance_type
        )
    ]


    if (
        current_row.empty
        or recommended_row is None
    ):
        return None


    # --------------------------------------------------------
    # HOURLY RATES
    # --------------------------------------------------------

    current_rate = float(
        current_row.iloc[0][
            "hourly_rate_usd"
        ]
    )

    recommended_rate = float(
        recommended_row[
            "hourly_rate_usd"
        ]
    )


    # --------------------------------------------------------
    # COST FOR FORECAST WINDOW
    # --------------------------------------------------------

    current_cost = (
        current_rate *
        forecast_hours
    )

    optimized_cost = (
        recommended_rate *
        forecast_hours
    )


    # --------------------------------------------------------
    # SAVINGS / ADDITIONAL COST
    # --------------------------------------------------------

    difference = (
        current_cost -
        optimized_cost
    )


    if difference > 0:

        savings = difference
        additional_cost = 0.0

    else:

        savings = 0.0
        additional_cost = abs(
            difference
        )


    # --------------------------------------------------------
    # PERCENTAGES
    # --------------------------------------------------------

    savings_pct = (
        savings /
        current_cost *
        100
        if current_cost > 0
        else 0
    )


    additional_cost_pct = (
        additional_cost /
        current_cost *
        100
        if current_cost > 0
        else 0
    )


    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return {

        "current_cost":
            round(
                current_cost,
                5
            ),

        "optimized_cost":
            round(
                optimized_cost,
                5
            ),

        "recommended_cost":
            round(
                optimized_cost,
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
            )
    }