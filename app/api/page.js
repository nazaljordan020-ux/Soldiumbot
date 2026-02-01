"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [transactions, setTransactions] = useState([]);

  // Polling API every 5 seconds for demo purposes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/helius-history"); // create this route later
        const data = await res.json();
        setTransactions(data.transactions || []);
      } catch (err) {
        console.error(err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6 font-sans">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
        SoldiumX Token Transactions
      </h1>

      <div className="max-w-4xl mx-auto grid gap-4">
        {transactions.length === 0 && (
          <p className="text-center text-gray-500">
            No transactions yet...
          </p>
        )}

        {transactions.map((tx, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg shadow-md flex justify-between items-center
            ${tx.type === "BUY" ? "bg-green-100 border-l-4 border-green-500" : "bg-red-100 border-l-4 border-red-500"}`}
          >
            <div>
              <p className="text-lg font-semibold">{tx.type === "BUY" ? "🟢 BUY" : "🔴 SELL"}</p>
              <p className="text-gray-700 text-sm">
                Token: {tx.mint}
              </p>
              <p className="text-gray-700 text-sm">
                Amount: {tx.amount.toLocaleString()}
              </p>
            </div>
            <div className="text-gray-500 text-xs">
              {new Date(tx.timestamp).toLocaleTimeString()}  
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
