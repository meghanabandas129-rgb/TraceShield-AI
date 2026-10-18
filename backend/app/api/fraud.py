from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(
    prefix="/api/v1/fraud",
    tags=["AI Fraud Detection"]
)

MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "ml" / "artifacts" / "fraud_anomaly.joblib"
)

class TransactionInput(BaseModel):
    amount: float = Field(ge=0)
    transactions_last_hour: int = Field(ge=0)
    new_device: int = Field(ge=0, le=1)
    new_recipient: int = Field(ge=0, le=1)
    failed_logins: int = Field(ge=0)
    hour: int = Field(ge=0, le=23)

@lru_cache(maxsize=1)
def load_model():
    return joblib.load(MODEL_PATH)

@router.post("/predict")
def predict_fraud(transaction: TransactionInput):
    try:
        bundle = load_model()

        features = bundle["features"]
        row = pd.DataFrame(
            [transaction.model_dump()],
            columns=features
        )

        X = bundle["scaler"].transform(row)

        prediction = int(bundle["model"].predict(X)[0])
        score = float(
            bundle["model"].decision_function(X)[0]
        )

        reasons = []

        if transaction.new_device:
            reasons.append("New device detected")

        if transaction.new_recipient:
            reasons.append("First-time recipient")

        if transaction.failed_logins >= 3:
            reasons.append("Multiple failed login attempts")

        if transaction.transactions_last_hour >= 10:
            reasons.append("Unusually high transaction frequency")

        return {
            "anomaly_detected": prediction == -1,
            "anomaly_score": round(score, 5),
            "risk_category": (
                "Review Required"
                if prediction == -1
                else "No Anomaly Detected"
            ),
            "risk_indicators": reasons,
            "model": "IsolationForest-v1",
            "message": (
                "This is an anomaly prediction, "
                "not a confirmed fraud finding."
            )
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Fraud prediction unavailable"
        )
