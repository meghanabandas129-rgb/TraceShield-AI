import axios from "axios";

export interface AccountNode {
  id: string;
  name: string;
  bank: string;
}

export interface TransactionEdge {
  id: string;
  sender: string;
  recipient: string;
  amount: number;
  time: string;
}

export interface TracingResponse {
  origin: string;
  connected_accounts: number;
  total_related_transactions: number;
  nodes: AccountNode[];
  edges: TransactionEdge[];
  notice: string;
}

export async function getMoneyTrace(accountId: string) {
  const response = await axios.get<TracingResponse>(
    `/api/v1/tracing/${encodeURIComponent(accountId)}`
  );
  return response.data;
}
