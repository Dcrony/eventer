import { useEffect, useState } from "react";
import API from "../api/axios";
import "./CSS/Transactions.css";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchTransactions = async () => {
      const res = await API.get("/organizer/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTransactions(res.data);
    };

    fetchTransactions();
  }, [token]);

  return (
    <div className="transactions-page pt-20 px-20 min-h-screen">
      <h2>Transaction History</h2>

      <div className="transactions-table">
        <div className="transactions-header">
          <span>Date</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Reference</span>
        </div>

        {transactions.map((tx) => (
          <div key={tx._id} className="transaction-row">
            <span>
              {new Date(tx.createdAt).toLocaleDateString()}
            </span>

            <span>₦{tx.amount}</span>

            <span className={`status ${tx.status}`}>
              {tx.status}
            </span>

            <span>{tx.reference || "-"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}