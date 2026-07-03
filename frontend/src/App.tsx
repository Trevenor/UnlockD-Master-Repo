// @ts-nocheck
import React, { useState, useEffect } from "react";

// --- TYPE DEFINITIONS ---
interface Account {
  id: string;
  name: string;
  balance: number;
}

interface Transaction {
  id: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  timestamp: string;
  status: "Completed" | "Failed";
  type: "Transfer";
}

function App() {
  // --- STATE ---
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem("unlockd_accounts");
    return saved
      ? JSON.parse(saved)
      : [
          { id: "1", name: "Primary Checking", balance: 5000 },
          { id: "2", name: "Savings Account", balance: 12000 },
          { id: "3", name: "Investment Wallet", balance: 1500 },
        ];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("unlockd_transactions");
    return saved ? JSON.parse(saved) : [];
  });

  // UI Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [fromAccountId, setFromAccountId] = useState("1");
  const [toAccountId, setToAccountId] = useState("2");
  const [amountStr, setAmountStr] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // --- SAVE TO LOCALSTORAGE ---
  useEffect(() => {
    localStorage.setItem("unlockd_accounts", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem("unlockd_transactions", JSON.stringify(transactions));
  }, [transactions]);

  // --- LIVE DERIVED ANALYTICS (DYNAMIC STATS) ---
  const totalNetWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalTransferred = transactions
    .filter((tx) => tx.status === "Completed")
    .reduce((sum, tx) => sum + tx.amount, 0);

  // --- ATOMIC TRANSFER WITH DELAY ---
  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      setErrorMessage("Please enter a valid transfer amount.");
      return;
    }
    if (fromAccountId === toAccountId) {
      setErrorMessage("Source and destination accounts match.");
      return;
    }

    const sourceAccount = accounts.find((acc) => acc.id === fromAccountId);
    if (!sourceAccount) return;

    // Trigger Processing Animation
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);

      // Overdraft Prevention Guard Check
      if (sourceAccount.balance < amount) {
        const failedTx: Transaction = {
          id: `tx_${Date.now()}`,
          fromAccount:
            accounts.find((a) => a.id === fromAccountId)?.name || "Unknown",
          toAccount:
            accounts.find((a) => a.id === toAccountId)?.name || "Unknown",
          amount: amount,
          timestamp: new Date().toLocaleString(),
          status: "Failed",
          type: "Transfer",
        };
        setTransactions((prev) => [failedTx, ...prev]);
        setErrorMessage(
          `Overdraft Guard Triggered: Insufficient funds in ${sourceAccount.name}.`,
        );
        return;
      }

      // Execute Changes Synchronously
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === fromAccountId)
            return { ...acc, balance: acc.balance - amount };
          if (acc.id === toAccountId)
            return { ...acc, balance: acc.balance + amount };
          return acc;
        }),
      );

      const successTx: Transaction = {
        id: `tx_${Date.now()}`,
        fromAccount:
          accounts.find((a) => a.id === fromAccountId)?.name || "Unknown",
        toAccount:
          accounts.find((a) => a.id === toAccountId)?.name || "Unknown",
        amount: amount,
        timestamp: new Date().toLocaleString(),
        status: "Completed",
        type: "Transfer",
      };

      setTransactions((prev) => [successTx, ...prev]);
      setSuccessMessage(
        `Transferred ₹${amount.toLocaleString("en-IN")} securely.`,
      );
      setAmountStr("");
    }, 750); // Fast fake network latency for a high-end feel
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Banner */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/80 pb-6 gap-4">
          <div className="flex items-center gap-3">
            {/* Optimized High-Quality Render Layer */}
            <img
              src="/logo.jpeg"
              className="w-12 h-12 rounded-xl object-cover border border-amber-500/30 shadow-md [image-rendering:pixelated] [image-rendering:-webkit-optimize-contrast]"
              alt="Logo"
            />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Gujjew Finance
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                One stop to all your financial needs
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="bg-amber-500/10 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-500/20 flex items-center gap-1.5 animate-pulse">
              ⚡ Live Dynamic Environment
            </span>
          </div>
        </header>

        {/* Dynamic Analytics Overview Widget */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 border border-slate-800/60 p-4 rounded-xl">
            <p className="text-xs text-slate-500 font-medium uppercase">
              Total Combined Assets
            </p>
            <p className="text-xl font-bold text-amber-400 mt-1">
              ₹{totalNetWorth.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/60 p-4 rounded-xl">
            <p className="text-xs text-slate-500 font-medium uppercase">
              Total Volumetric Flow
            </p>
            <p className="text-xl font-bold text-teal-400 mt-1">
              ₹{totalTransferred.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/60 p-4 rounded-xl">
            <p className="text-xs text-slate-500 font-medium uppercase">
              Active System Pipelines
            </p>
            <p className="text-xl font-bold text-slate-300 mt-1">
              {transactions.length} Records Logged
            </p>
          </div>
        </section>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Controls Panel */}
          <div className="lg:col-span-2 space-y-8">
            {/* Accounts Cards */}
            <div>
              <h2 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-4">
                Operational Accounts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 shadow-sm hover:border-slate-700/80 transition relative overflow-hidden group"
                  >
                    <p className="text-xs font-bold text-slate-400">
                      {acc.name}
                    </p>
                    <p className="text-2xl font-black mt-2 text-slate-100 transition duration-300">
                      ₹{acc.balance.toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Transfer Portal */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
              <h2 className="text-lg font-semibold text-slate-200 mb-1">
                Execution Engine
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Executes isolated financial updates via React state arrays.
              </p>

              <form onSubmit={handleTransfer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">
                      Debit Source
                    </label>
                    <select
                      value={fromAccountId}
                      onChange={(e) => setFromAccountId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 text-slate-200"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (₹{a.balance})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">
                      Credit Destination
                    </label>
                    <select
                      value={toAccountId}
                      onChange={(e) => setToAccountId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 text-slate-200"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (₹{a.balance})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Transaction Volume (INR)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter explicit baseline volume"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 text-slate-100"
                    disabled={isProcessing}
                  />
                </div>

                {/* Status Banners */}
                {errorMessage && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs font-medium">
                    ❌ {errorMessage}
                  </div>
                )}
                {successMessage && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-medium">
                    ✅ {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition shadow-lg duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                    isProcessing
                      ? "bg-amber-500/50 cursor-not-allowed text-slate-800"
                      : "bg-amber-400 hover:bg-amber-300 shadow-amber-500/5"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-slate-950"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Verifying Ledger...
                    </>
                  ) : (
                    "Authorize Atomic Transfer"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Immutable Ledger History Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md h-[600px] flex flex-col">
            <h2 className="text-lg font-semibold text-slate-200 mb-1">
              Audit Ledger Feed
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Immutable structural record index
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {transactions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <p className="text-xs text-slate-500">
                    System ledger is completely clean.
                  </p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-slate-950 border border-slate-800/60 p-3 rounded-lg space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-300">
                          {tx.fromAccount} → {tx.toAccount}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold ${tx.status === "Completed" ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        ₹{tx.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-900/60">
                      <span>{tx.timestamp}</span>
                      <span
                        className={`font-bold tracking-wider uppercase text-[9px] ${
                          tx.status === "Completed"
                            ? "text-emerald-500"
                            : "text-rose-500"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
