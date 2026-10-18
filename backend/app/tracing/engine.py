from collections import deque
from datetime import datetime
from fastapi import APIRouter, HTTPException
import networkx as nx

router = APIRouter(
    prefix="/api/v1/tracing",
    tags=["Money Tracing"]
)

# Fictional banking records for demonstration only.
ACCOUNTS = {
    "ACC001": {"name": "Demo Customer A", "bank": "Demo Bank One"},
    "ACC002": {"name": "Demo Recipient B", "bank": "Demo Bank Two"},
    "ACC003": {"name": "Demo Recipient C", "bank": "Demo Bank Three"},
    "ACC004": {"name": "Demo Recipient D", "bank": "Demo Bank Four"},
    "ACC005": {"name": "Demo Recipient E", "bank": "Demo Bank Five"},
}

TRANSACTIONS = [
    {"id": "TX001", "sender": "ACC001", "recipient": "ACC002", "amount": 80000, "time": "2026-10-17T10:00:00"},
    {"id": "TX002", "sender": "ACC002", "recipient": "ACC003", "amount": 55000, "time": "2026-10-17T10:03:00"},
    {"id": "TX003", "sender": "ACC002", "recipient": "ACC004", "amount": 25000, "time": "2026-10-17T10:05:00"},
    {"id": "TX004", "sender": "ACC003", "recipient": "ACC005", "amount": 40000, "time": "2026-10-17T10:08:00"},
]

@router.get("/{account_id}")
def trace_money(account_id: str):
    if account_id not in ACCOUNTS:
        raise HTTPException(status_code=404, detail="Account not found")

    graph = nx.MultiDiGraph()

    for account, details in ACCOUNTS.items():
        graph.add_node(account, **details)

    for tx in TRANSACTIONS:
        graph.add_edge(
            tx["sender"],
            tx["recipient"],
            key=tx["id"],
            **tx
        )

    # Traverse outward only, with time moving forward along each path.
    queue = deque([(account_id, datetime.min)])
    visited_states = set()
    matched_ids = set()

    while queue:
        account, earliest_time = queue.popleft()
        state = (account, earliest_time)

        if state in visited_states:
            continue

        visited_states.add(state)

        for _, recipient, key, data in graph.out_edges(
            account, keys=True, data=True
        ):
            tx_time = datetime.fromisoformat(data["time"])
            if tx_time >= earliest_time:
                matched_ids.add(key)
                queue.append((recipient, tx_time))

    edges = [
        tx for tx in TRANSACTIONS
        if tx["id"] in matched_ids
    ]

    connected = {account_id}
    for tx in edges:
        connected.add(tx["sender"])
        connected.add(tx["recipient"])

    nodes = [
        {"id": account, **ACCOUNTS[account]}
        for account in sorted(connected)
    ]

    return {
        "origin": account_id,
        "connected_accounts": len(nodes) - 1,
        "total_related_transactions": len(edges),
        "nodes": nodes,
        "edges": edges,
        "notice": (
            "This is a chronological relationship graph based on "
            "synthetic records. It does not prove the origin of "
            "specific funds or establish fraudulent ownership."
        )
    }
