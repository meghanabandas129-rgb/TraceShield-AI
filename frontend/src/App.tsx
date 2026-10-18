import InvestigationTools from "./components/InvestigationTools";
import FraudDetection from "./components/FraudDetection";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Network, Search, ShieldCheck, ArrowRightLeft, Landmark } from "lucide-react";
import axios from "axios";
import { getMoneyTrace, type TracingResponse } from "./services/api";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState<"fraud" | "tracing">("tracing");
  const [accountId, setAccountId] = useState("ACC001");
  const [trace, setTrace] = useState<TracingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const loadTrace = useCallback(async (id: string) => {
    setLoading(true);
    setError("");
    setSelectedAccount(null);

    try {
      const result = await getMoneyTrace(id.toUpperCase());
      setTrace(result);
    } catch (err) {
      setTrace(null);
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError("Account not found in the demonstration dataset.");
      } else {
        setError("Unable to load tracing data. Check that the backend is running on port 8001.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrace("ACC001");
  }, [loadTrace]);

  const nodes: Node[] = useMemo(
    () => (trace?.nodes ?? []).map((account, index) => {
      const locations: Record<string, { x: number; y: number }> = {
        ACC001: { x: 320, y: 0 },
        ACC002: { x: 320, y: 160 },
        ACC003: { x: 70, y: 330 },
        ACC004: { x: 570, y: 330 },
        ACC005: { x: 70, y: 490 },
      };

      return {
        id: account.id,
        position: locations[account.id] ?? {
          x: (index % 3) * 250,
          y: Math.floor(index / 3) * 170,
        },
        data: {
          label: `${account.name}\n${account.id}\n${account.bank}`,
        },
        style: {
          background: account.id === trace?.origin ? "#dbeafe" : "#ffffff",
          border: selectedAccount === account.id
            ? "3px solid #f59e0b"
            : "2px solid #2563eb",
          borderRadius: 14,
          padding: 14,
          width: 190,
          color: "#0f172a",
          textAlign: "center",
          whiteSpace: "pre-line",
          lineHeight: 1.6,
          boxShadow: "0 6px 18px rgba(15,23,42,0.09)",
        },
      };
    }),
    [trace, selectedAccount]
  );

  const edges: Edge[] = useMemo(
    () => (trace?.edges ?? []).map((tx) => ({
      id: tx.id,
      source: tx.sender,
      target: tx.recipient,
      label: `₹${tx.amount.toLocaleString("en-IN")}`,
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#0891b2", strokeWidth: 2 },
      labelStyle: { fill: "#0f172a", fontWeight: 700 },
    })),
    [trace]
  );

  const selectedDetails = trace?.nodes.find(
    (account) => account.id === selectedAccount
  );

  return (
    <main className="shell">
      
      <aside className="sidebar">
        <div className="logo">
          <ShieldCheck size={28} />
          <span>TraceShield AI</span>
        </div>

        <div className="nav-label">INVESTIGATION</div>
        <nav className="nav-items" aria-label="Investigation navigation">
          <button
            type="button"
            className={activePage === "fraud" ? "nav-active" : "nav-link"}
            onClick={() => setActivePage("fraud")}
            aria-current={activePage === "fraud" ? "page" : undefined}
          >
            <ShieldCheck size={19} />
            Fraud Detection
          </button>
          <button
            type="button"
            className={activePage === "tracing" ? "nav-active" : "nav-link"}
            onClick={() => setActivePage("tracing")}
            aria-current={activePage === "tracing" ? "page" : undefined}
          >
            <Network size={19} />
            Money Tracing
          </button>
        </nav>

        <div className="sidebar-note">
          Investigator prototype
          <small>Fictional transaction data only</small>
        </div>
      </aside>

      <div className="content">
        {activePage === "fraud" && <FraudDetection />}
        {activePage === "tracing" && (
          <>
        <header className="topbar">
          <div>
            <p className="eyebrow">CYBERCRIME INVESTIGATION</p>
            <h1>Money Flow Investigation</h1>
            <p className="subtitle">
              Explore account relationships and chronological transfers.
            </p>
          </div>
          <span className="demo-label">DEMO ENVIRONMENT</span>
        </header>

        <form
          className="search-card"
          onSubmit={(event) => {
            event.preventDefault();
            if (accountId.trim()) void loadTrace(accountId.trim());
          }}
        >
          <label htmlFor="account">Origin Account ID</label>
          <div className="search-line">
            <input
              id="account"
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              placeholder="ACC001"
              required
            />
            <button type="submit" disabled={loading}>
              <Search size={17} />
              {loading ? "Tracing..." : "Trace Account"}
            </button>
          </div>
        </form>

        {error && <div className="error">{error}</div>}

        {trace && (
          <>
            <section className="stats">
              <article>
                <Landmark size={23} />
                <p>Origin Account</p>
                <strong>{trace.origin}</strong>
              </article>
              <article>
                <Network size={23} />
                <p>Connected Accounts</p>
                <strong>{trace.connected_accounts}</strong>
              </article>
              <article>
                <ArrowRightLeft size={23} />
                <p>Related Transactions</p>
                <strong>{trace.total_related_transactions}</strong>
              </article>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Transaction Network</h2>
                  <p>Click an account node to inspect its details.</p>
                </div>
              </div>

              <div className="graph">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  fitView
                  fitViewOptions={{ padding: 0.25 }}
                  onNodeClick={(_, node) => setSelectedAccount(node.id)}
                  proOptions={{ hideAttribution: true }}
                >
                  <Background />
                  <Controls />
                  <MiniMap />
                </ReactFlow>
              </div>

              {selectedDetails && (
                <div className="details">
                  <strong>{selectedDetails.name}</strong>
                  <span>{selectedDetails.id}</span>
                  <span>{selectedDetails.bank}</span>
                </div>
              )}
            </section>

            <section className="panel">
              <h2>Transaction Timeline</h2>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Transaction</th>
                      <th>Sender</th>
                      <th>Recipient</th>
                      <th>Amount</th>
                      <th>Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trace.edges.map((tx) => (
                      <tr key={tx.id}>
                        <td>{tx.id}</td>
                        <td>{tx.sender}</td>
                        <td>{tx.recipient}</td>
                        <td className="amount">
                          ₹{tx.amount.toLocaleString("en-IN")}
                        </td>
                        <td>{tx.time.replace("T", " ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <InvestigationTools trace={trace} />
            <p className="disclaimer">{trace.notice}</p>
          </>
        )}
          </>
        )}
      </div>
    </main>
  );
}

export default App;





