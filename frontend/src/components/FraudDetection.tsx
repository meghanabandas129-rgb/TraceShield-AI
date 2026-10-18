import { useState, type FormEvent } from "react";
import axios from "axios";
import { ShieldAlert, ShieldCheck, LoaderCircle } from "lucide-react";

type FraudResult = {
  anomaly_detected: boolean;
  anomaly_score: number;
  risk_category: string;
  risk_indicators: string[];
  model: string;
  message: string;
};

type FraudInput = {
  amount: number;
  transactions_last_hour: number;
  new_device: number;
  new_recipient: number;
  failed_logins: number;
  hour: number;
};

const initialInput: FraudInput = {
  amount: 95000,
  transactions_last_hour: 18,
  new_device: 1,
  new_recipient: 1,
  failed_logins: 5,
  hour: 2,
};

export default function FraudDetection() {
  const [input, setInput] = useState<FraudInput>(initialInput);
  const [result, setResult] = useState<FraudResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await axios.post<FraudResult>(
        "/api/v1/fraud/predict",
        input,
        { timeout: 15000 }
      );
      setResult(response.data);
    } catch {
      setError(
        "Could not analyze the transaction. Check the backend on port 8001."
      );
    } finally {
      setLoading(false);
    }
  }

  function update(field: keyof FraudInput, value: number) {
    setInput((previous) => ({ ...previous, [field]: value }));
  }

  return (
    <section className="fraud-section">
      <div className="fraud-heading">
        <div>
          <h2>AI Fraud Detection</h2>
          <p>Analyze transaction patterns using the Isolation Forest model.</p>
        </div>
      </div>

      <form onSubmit={analyze} className="fraud-form">
        <label>
          Transaction Amount (INR)
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={input.amount}
            onChange={(e) => update("amount", Number(e.target.value))}
          />
        </label>

        <label>
          Transactions in Last Hour
          <input
            type="number"
            min="0"
            step="1"
            required
            value={input.transactions_last_hour}
            onChange={(e) =>
              update("transactions_last_hour", Number(e.target.value))
            }
          />
        </label>

        <label>
          Failed Login Attempts
          <input
            type="number"
            min="0"
            step="1"
            required
            value={input.failed_logins}
            onChange={(e) => update("failed_logins", Number(e.target.value))}
          />
        </label>

        <label>
          Transaction Hour (0–23)
          <input
            type="number"
            min="0"
            max="23"
            step="1"
            required
            value={input.hour}
            onChange={(e) => update("hour", Number(e.target.value))}
          />
        </label>

        <label>
          New Device?
          <select
            value={input.new_device}
            onChange={(e) => update("new_device", Number(e.target.value))}
          >
            <option value={0}>No</option>
            <option value={1}>Yes</option>
          </select>
        </label>

        <label>
          First-Time Recipient?
          <select
            value={input.new_recipient}
            onChange={(e) => update("new_recipient", Number(e.target.value))}
          >
            <option value={0}>No</option>
            <option value={1}>Yes</option>
          </select>
        </label>

        <button className="fraud-submit" type="submit" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircle size={17} className="fraud-spinner" />
              Analyzing...
            </>
          ) : (
            "Analyze Transaction"
          )}
        </button>
      </form>

      {error && <p className="fraud-error" role="alert">{error}</p>}

      {result && (
        <div className="fraud-result">
          <div className="fraud-result-title">
            {result.anomaly_detected ? (
              <ShieldAlert size={28} color="#d97706" />
            ) : (
              <ShieldCheck size={28} color="#16a34a" />
            )}
            <div>
              <h3>{result.risk_category}</h3>
              <p>Model: {result.model}</p>
            </div>
          </div>

          <div className="fraud-score">
            <span>Anomaly Score</span>
            <strong>{result.anomaly_score.toFixed(5)}</strong>
          </div>

          <h4>Risk Indicators</h4>
          {result.risk_indicators.length > 0 ? (
            <ul>
              {result.risk_indicators.map((indicator) => (
                <li key={indicator}>{indicator}</li>
              ))}
            </ul>
          ) : (
            <p>No configured risk indicators were reported.</p>
          )}

          <p className="fraud-disclaimer">{result.message}</p>
          <p className="fraud-disclaimer">
            Anomaly scores are not fraud probabilities. Human review is
            required before taking action.
          </p>
        </div>
      )}
    </section>
  );
}
