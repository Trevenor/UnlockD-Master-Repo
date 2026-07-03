// @ts-nocheck
import React, { useState, useEffect } from 'react';

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
  category: string;
  timestamp: string;
  status: 'Completed' | 'Failed';
  type: 'Transfer';
}

interface Budget {
  category: string;
  limit: number;
  spent: number;
}

function App() {
  // --- POPUP WELCOME MODAL STATE ---
  const [showWelcome, setShowWelcome] = useState(true);

  // --- CORE STATE ENGINE ---
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('unlockd_accounts');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Papa ka Business Fund', balance: 5000 },
      { id: '2', name: 'Safe FD & Gold Vault', balance: 60887 },
      { id: '3', name: 'Crypto & Risky Bets', balance: 23713 }
    ];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('unlockd_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('unlockd_budgets');
    return saved ? JSON.parse(saved) : [
      { category: 'Stocks & Blind Luck', limit: 25000, spent: 0 },
      { category: 'Chai & Office Snacks', limit: 15000, spent: 0 },
      { category: 'Irresponsible Luxury', limit: 10000, spent: 0 }
    ];
  });

  // UI Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [fromAccountId, setFromAccountId] = useState('1');
  const [toAccountId, setToAccountId] = useState('2');
  const [transactionCategory, setTransactionCategory] = useState('Stocks & Blind Luck');
  const [amountStr, setAmountStr] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingText, setLoadingText] = useState('Consulting Astrologer...');

  useEffect(() => {
    setBudgets(prevBudgets => 
      prevBudgets.map(budget => {
        const totalSpentInCat = transactions
          .filter(tx => tx.status === 'Completed' && tx.category === budget.category)
          .reduce((sum, tx) => sum + tx.amount, 0);
        return { ...budget, spent: totalSpentInCat };
      })
    );
  }, [transactions]);

  const triggerMonthlyReset = () => {
    setTransactions([]);
    setSuccessMessage('Forced Amnesia Activated: The tax authorities know nothing.');
  };

  useEffect(() => {
    localStorage.setItem('unlockd_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('unlockd_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const totalNetWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalTransferred = transactions
    .filter(tx => tx.status === 'Completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('Zero rupees? What is this, a charity?');
      return;
    }
    if (fromAccountId === toAccountId) {
      setErrorMessage('Moving money to the exact same account will not trick your accountant.');
      return;
    }

    const sourceAccount = accounts.find(acc => acc.id === fromAccountId);
    if (!sourceAccount) return;

    setIsProcessing(true);
    setLoadingText('Consulting Astrologer...');
    setTimeout(() => setLoadingText('Bribing the Database...'), 350);

    setTimeout(() => {
      setIsProcessing(false);

      if (sourceAccount.balance < amount) {
        const failedTx: Transaction = {
          id: `tx_${Date.now()}`,
          fromAccount: accounts.find(a => a.id === fromAccountId)?.name || 'Unknown',
          toAccount: accounts.find(a => a.id === toAccountId)?.name || 'Unknown',
          amount: amount,
          category: transactionCategory,
          timestamp: new Date().toLocaleString(),
          status: 'Failed',
          type: 'Transfer'
        };
        setTransactions(prev => [failedTx, ...prev]);
        setErrorMessage(`Overdraft Blocked: "${sourceAccount.name}" has no money. Go ask your cousin for a loan.`);
        return;
      }

      setAccounts(prev => prev.map(acc => {
        if (acc.id === fromAccountId) return { ...acc, balance: acc.balance - amount };
        if (acc.id === toAccountId) return { ...acc, balance: acc.balance + amount };
        return acc;
      }));

      const successTx: Transaction = {
        id: `tx_${Date.now()}`,
        fromAccount: accounts.find(a => a.id === fromAccountId)?.name || 'Unknown',
        toAccount: accounts.find(a => a.id === toAccountId)?.name || 'Unknown',
        amount: amount,
        category: transactionCategory,
        timestamp: new Date().toLocaleString(),
        status: 'Completed',
        type: 'Transfer'
      };

      setTransactions(prev => [successTx, ...prev]);
      setSuccessMessage(`Transaction cleared. Go buy something nice before inflation hits.`);
      setAmountStr('');
    }, 850);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 relative">
      
      {/* INTERACTIVE CLICHÉ WELCOME POPUP MODAL */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-slate-950/80 transition-all duration-300">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
            {/* Top Logo Flare */}
            <div className="flex justify-center">
              <img 
                src="/logo.jpeg" 
                className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-xl [image-rendering:pixelated]" 
                alt="Logo" 
              />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Gujjew Finance
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Premium Ledger Alpha v1.02</p>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed px-2">
              Tired of using the same old legacy banking pipelines? <br />
              <span className="text-amber-400 font-semibold">Here, try Gujjew Finance.</span> <br />
              Where numbers only go up and interest is earned, never paid.
            </p>

            <button
              onClick={() => setShowWelcome(false)}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black py-3 rounded-xl text-sm hover:from-amber-300 hover:to-orange-400 transition-all duration-150 transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-orange-500/10 cursor-pointer"
            >
              Let's Get Started →
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD CONTAINER - BLURS OUT CONDITIONALLY WHILE MODAL IS ACTIVE */}
      <div className={`max-w-6xl mx-auto space-y-8 transition-all duration-500 ${showWelcome ? 'blur-md pointer-events-none scale-98 opacity-40' : 'blur-none scale-100 opacity-100'}`}>
        
        {/* Header Banner */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/80 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.jpeg" 
              className="w-12 h-12 rounded-xl object-cover border border-amber-500/30 shadow-md [image-rendering:pixelated]" 
              alt="Logo" 
            />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Gujjew Finance
              </h1>
              <p className="text-sm text-slate-400 mt-1">Interest is earned, never paid. 💸</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={triggerMonthlyReset}
              className="bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 font-medium px-3 py-1.5 rounded-lg border border-slate-800 transition cursor-pointer"
            >
              🔄 Hide the Books (Monthly Reset)
            </button>
            <span className="bg-amber-500/10 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-500/20 flex items-center gap-1.5 animate-pulse">
              📈 Stonks Only Go Up
            </span>
          </div>
        </header>

        {/* Dynamic Analytics Overview Widget */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 border border-slate-800/60 p-4 rounded-xl">
            <p className="text-xs text-slate-500 font-medium uppercase">Declaration to Tax Officials</p>
            <p className="text-xl font-bold text-amber-400 mt-1">₹{totalNetWorth.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/60 p-4 rounded-xl">
            <p className="text-xs text-slate-500 font-medium uppercase">Velocity of Capital Flight</p>
            <p className="text-xl font-bold text-teal-400 mt-1">₹{totalTransferred.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/60 p-4 rounded-xl">
            <p className="text-xs text-slate-500 font-medium uppercase">Audit Evaded Count</p>
            <p className="text-xl font-bold text-slate-300 mt-1">{transactions.length} Sins Documented</p>
          </div>
        </section>

        {/* Feature 2: Budgeting Tracking Hub */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-4">🛡️ Budget Drainage Trackers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {budgets.map(budget => {
              const percentUsed = Math.min((budget.spent / budget.limit) * 100, 100);
              const remaining = budget.limit - budget.spent;
              const isApproachingLimit = percentUsed >= 80;

              return (
                <div key={budget.category} className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xs font-bold text-slate-200">{budget.category}</h3>
                    {isApproachingLimit && (
                      <span className="bg-rose-500/10 text-rose-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-rose-500/20 animate-bounce">
                        🚨 STOP SPENDING
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Burned: ₹{budget.spent.toLocaleString('en-IN')}</span>
                      <span>Cap: ₹{budget.limit.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${isApproachingLimit ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                        style={{ width: `${percentUsed}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800/50">
                    <span className="text-slate-500">Left before broke</span>
                    <span className={`font-bold ${remaining <= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      ₹{remaining.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Controls Panel */}
          <div className="lg:col-span-2 space-y-8">
            {/* Operational Accounts */}
            <div>
              <h2 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-4">Liquidity Positions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {accounts.map(acc => (
                  <div key={acc.id} className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition">
                    <p className="text-xs font-bold text-slate-400">{acc.name}</p>
                    <p className="text-2xl font-black mt-2 text-slate-100">
                      ₹{acc.balance.toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Transfer Portal */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
              <h2 className="text-lg font-semibold text-slate-200 mb-1">The Capital Shuffler</h2>
              <p className="text-xs text-slate-400 mb-6">Moving numbers around to feel productive.</p>

              <form onSubmit={handleTransfer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Where's it coming from?</label>
                    <select 
                      value={fromAccountId} 
                      onChange={(e) => setFromAccountId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 text-slate-200"
                    >
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Where's it going?</label>
                    <select 
                      value={toAccountId} 
                      onChange={(e) => setToAccountId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 text-slate-200"
                    >
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Excuse Type (Category)</label>
                    <select 
                      value={transactionCategory} 
                      onChange={(e) => setTransactionCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 text-slate-200"
                    >
                      {budgets.map(b => <option key={b.category} value={b.category}>{b.category}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">How much damage? (INR)</label>
                  <input 
                    type="number" 
                    placeholder="Enter an aggressive amount"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 text-slate-100"
                    disabled={isProcessing}
                  />
                </div>

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
                  className={`w-full text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                    isProcessing ? 'bg-amber-500/50 cursor-not-allowed text-slate-800' : 'bg-amber-400 hover:bg-amber-300'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {loadingText}
                    </>
                  ) : 'Sign Electronic Permission Slip'}
                </button>
              </form>
            </div>
          </div>

          {/* Immutable Ledger History Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md h-[550px] flex flex-col">
            <h2 className="text-lg font-semibold text-slate-200 mb-1">The Paper Trail</h2>
            <p className="text-xs text-slate-400 mb-4">Evidence of financial decisions.</p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {transactions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <p className="text-xs text-slate-500">Perfectly clean ledger. Clean as a whistle.</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="bg-slate-950 border border-slate-800/60 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-300">
                          {tx.fromAccount} → {tx.toAccount}
                        </p>
                        <span className="inline-block text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider bg-slate-800 text-slate-400">
                          {tx.category}
                        </span>
                      </div>
                      <span className={`text-xs font-bold ${tx.status === 'Completed' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-900/60">
                      <span>{tx.timestamp}</span>
                      <span className={`font-bold tracking-wider uppercase text-[9px] ${
                        tx.status === 'Completed' ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {tx.status === 'Completed' ? 'Settled 🤝' : 'Denied 💁‍♂️'}
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