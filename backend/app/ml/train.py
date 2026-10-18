from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

FEATURES = [
    "amount",
    "transactions_last_hour",
    "new_device",
    "new_recipient",
    "failed_logins",
    "hour"
]

rng = np.random.default_rng(42)
n = 5000

data = pd.DataFrame({
    "amount": rng.lognormal(6.2, 0.7, n).clip(10, 15000),
    "transactions_last_hour": rng.poisson(2, n),
    "new_device": rng.binomial(1, 0.05, n),
    "new_recipient": rng.binomial(1, 0.15, n),
    "failed_logins": rng.poisson(0.1, n),
    "hour": rng.integers(6, 23, n)
})

scaler = StandardScaler()
X = scaler.fit_transform(data[FEATURES])

model = IsolationForest(
    n_estimators=200,
    contamination=0.03,
    random_state=42
)

model.fit(X)

output = Path("app/ml/artifacts")
output.mkdir(parents=True, exist_ok=True)

joblib.dump(
    {
        "model": model,
        "scaler": scaler,
        "features": FEATURES
    },
    output / "fraud_anomaly.joblib"
)

print("TraceShield AI model trained successfully!")
