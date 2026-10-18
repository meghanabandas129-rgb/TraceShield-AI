import { useMemo, useState } from "react";
import type { TracingResponse } from "../services/api";

interface Props {
  trace: TracingResponse;
}

export default function InvestigationTools({ trace }: Props) {
  const [query, setQuery] = useState("");
  const [minAmount, setMinAmount] = useState("0");

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    const minimum = Math.max(0, Number(minAmount) || 0);

    return trace.edges.filter((tx) => {
      const matchesSearch =
        tx.id.toLowerCase().includes(search) ||
        tx.sender.toLowerCase().includes(search) ||
        tx.recipient.toLowerCase().includes(search);

      return matchesSearch && tx.amount >= minimum;
    });
  }, [trace.edges, query, minAmount]);

  const totalVolume = filtered.reduce(
    (sum, tx) => sum + tx.amount, 0
  );

  const largestTransfer = filtered.reduce(
    (largest, tx) => Math.max(largest, tx.amount), 0
  );

  const money = (value: number) =>
    `₹${value.toLocaleString("en-IN")}`;

  function exportCSV() {
    const safe = (value: string | number) => {
      let text = String(value);
      // Prevent spreadsheet formula interpretation.
      if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = [
      ["Transaction ID", "Sender", "Recipient", "Amount INR", "Time"],
      ...filtered.map((tx) => [
        tx.id, tx.sender, tx.recipient, tx.amount, tx.time
      ]),
    ];

    const csv = rows.map((row) => row.map(safe).join(",")).join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TraceShield-${trace.origin}-transactions.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="investigation-tools panel">
      <div className="tools-header">
        <div>
          <h2>Investigation Tools</h2>
          <p>Filter and export chronological transaction records.</p>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="export-button"
        >
          Export CSV
        </button>
      </div>

      <div className="tools-filters">
        <label>
          Search transaction or account
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ACC002 or TX001"
          />
        </label>

        <label>
          Minimum amount (INR)
          <input
            type="number"
            min="0"
            step="1"
            value={minAmount}
            onChange={(event) => setMinAmount(event.target.value)}
          />
        </label>
      </div>

      <div className="tools-stats">
        <article>
          <span>Matching Transactions</span>
          <strong>{filtered.length}</strong>
        </article>
        <article>
          <span>Transaction Volume</span>
          <strong>{money(totalVolume)}</strong>
        </article>
        <article>
          <span>Largest Transfer</span>
          <strong>{money(largestTransfer)}</strong>
        </article>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>From</th>
              <th>To</th>
              <th>Amount</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.id}</td>
                <td>{tx.sender}</td>
                <td>{tx.recipient}</td>
                <td>{money(tx.amount)}</td>
                <td>{tx.time.replace("T", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="tools-empty">No matching transactions.</p>
        )}
      </div>

      <p className="tools-notice">
        Prototype with synthetic records. Transfers and connected
        accounts are not proof of fraud or ownership of specific funds.
      </p>
    </section>
  );
}
