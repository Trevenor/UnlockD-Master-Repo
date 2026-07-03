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

interface GroupExpense {
  id: string;
  description: string;
  totalAmount: number;
  paidBy: string;
  splitType: 'Equal' | 'Custom';
  splits: { [memberName: string]: number };
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

function App() {
  // --- POPUP WELCOME MODAL STATE ---
  const [showWelcome, setShowWelcome] = useState(true);

  // --- 1. YOUR ORIGINAL ACCOUNTS & TRANSACTIONS ---
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

  // --- 2. ISOLATED FEATURE 3 STATE ARRAYS ---
  const groupMembers = ['Aman', 'Bhavik', 'Chirag', 'Divya'];
  const [expenses, setExpenses] = useState<GroupExpense[]>(() => {
    const saved = localStorage.getItem('unlockd_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [expDescription, setExpDescription] = useState('');
  const [expTotalAmount, setExpTotalAmount] = useState('');
  const [expPaidBy, setExpPaidBy] = useState('Aman');
  const [expSplitType, setExpSplitType] = useState<'Equal' | 'Custom'>('Equal');
  const [customSplits, setCustomSplits] = useState<{ [key: string]: string }>({
    Aman: '', Bhavik: '', Chirag: '', Divya: ''
  });
  const [splitErrorMessage, setSplitErrorMessage] = useState('');

  // Execution engine form UI states
  const [isProcessing, setIsProcessing] = useState(false);
  const [fromAccountId, setFromAccountId] = useState('1');
  const [toAccountId, setToAccountId] = useState('2');
  const [transactionCategory, setTransactionCategory] = useState('Stocks & Blind Luck');
  const [amountStr, setAmountStr] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    localStorage.setItem('unlockd_expenses', JSON.stringify(expenses));
  }, [expenses]);

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

  useEffect(() => {
    localStorage.setItem('unlockd_accounts', JSON.stringify(accounts));
    localStorage.setItem('unlockd_transactions', JSON.stringify(transactions));
  }, [accounts, transactions]);

  const totalNetWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalTransferred = transactions
    .filter(tx => tx.status === 'Completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // --- GREEDY DEBT BALANCER ALGORITHM ---
  const computeOptimizedSettlements = (): Settlement[] => {
    const netBalances: { [name: string]: number } = {};
    groupMembers.forEach(m => (netBalances[m] = 0));

    expenses.forEach(exp => {
      netBalances[exp.paidBy] += exp.totalAmount;
      groupMembers.forEach(m => {
        netBalances[m] -= exp.splits[m] || 0;
      });
    });

    const participants = Object.keys(netBalances).map(name => ({
      name,
      balance: netBalances[name]
    })).filter(p => Math.abs(p.balance) > 0.1);

    const settlements: Settlement[] = [];
    let safeLoopGuard = 0;

    while (participants.length > 1 && safeLoopGuard < 50) {
      participants.sort((a, b) => a.balance - b.balance);
      const debtor = participants[0];
      const creditor = participants[participants.length - 1];

      if (!debtor || !creditor || Math.abs(debtor.balance) < 0.1 || Math.abs(creditor.balance) < 0.1) break;

      const settleAmount = Math.min(Math.abs(debtor.balance), creditor.balance);
      debtor.balance += settleAmount;
      creditor.balance -= settleAmount;

      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(settleAmount)
      });

      if (Math.abs(debtor.balance) < 0.1) participants.shift();
      if (Math.abs(creditor.balance) < 0.1) participants.pop();
      safeLoopGuard++;
    }
    return settlements;
  };

  const optimizedSettlements = computeOptimizedSettlements();

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setSplitErrorMessage('');
    const total = parseFloat(expTotalAmount);
    if (isNaN(total) || total <= 0) {
      setSplitErrorMessage('Please enter a valid expense amount.');
      return;
    }

    let dynamicSplits: { [key: string]: number } = {};
    if (expSplitType === 'Equal') {
      const equalShare = total / groupMembers.length;
      groupMembers.forEach(m => (dynamicSplits[m] = equalShare));
    } else {
      let customSum = 0;
      for (const m of groupMembers) {
        const share = parseFloat(customSplits[m] || '0');
        dynamicSplits[m] = share;
        customSum += share;
      }
      if (Math.abs(customSum - total) > 0.5) {
        setSplitErrorMessage(`Custom splits must equal exactly total amount (Sum: ₹${customSum}).`);
        return;
      }
    }

    const newExpense: GroupExpense = {
      id: `exp_${Date.now()}`,
      description: expDescription || 'Shared Expense',
      totalAmount: total,
      paidBy: expPaidBy,
      splitType: expSplitType,
      splits: dynamicSplits
    };

    setExpenses(prev => [newExpense, ...prev]);
    setExpDescription('');
    setExpTotalAmount('');
    setCustomSplits({ Aman: '', Bhavik: '', Chirag: '', Divya: '' });
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) return;
    if (fromAccountId === toAccountId) return;

    const sourceAccount = accounts.find(acc => acc.id === fromAccountId);
    if (!sourceAccount) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (sourceAccount.balance < amount) {
        setErrorMessage(`Overdraft Blocked: "${sourceAccount.name}" has no money.`);
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
      setSuccessMessage(`Transaction cleared smoothly.`);
      setAmountStr('');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 relative">
      
      {/* INTERACTIVE CLICHÉ WELCOME POPUP MODAL */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-slate-950/80 transition-all duration-300">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex justify-center">
              <img src="/logo.jpeg" className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-xl [image-rendering:pixelated]" alt="Logo" />
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
            <button onClick={() => setShowWelcome(false)} className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black py-3 rounded-xl text-sm hover:from-amber-300 hover:to-orange-400 transition-all duration-150 transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-orange-500/10 cursor-pointer">
              Let's Get Started →
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD CONTAINER - APPLIES CONDITIONAL BLUR BLOCKS WHEN MODAL IS ACTIVE */}
      <div className={`max-w-6xl mx-auto space-y-8 transition-all duration-500 ${showWelcome ? 'blur-md pointer-events-none scale-95 opacity-40' : 'blur-none scale-100 opacity-100'}`}>
        
        {/* Header Banner */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/80 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" className="w-12 h-12 rounded-xl object-cover border border-amber-500/30" alt="Logo" />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Gujjew Finance
              </h1>
              <p className="text-sm text-slate-400 mt-1">Interest is earned, never paid. 💸</p>
            </div>
          </div>
          <span className="bg-amber-500/10 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-500/20 animate-pulse">
            ⚡ Live Production Environment
          </span>
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
                <div key={budget.category} className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xs font-bold text-slate-200">{budget.category}</h3>
                    {isApproachingLimit && <span className="bg-rose-500/10 text-rose-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-rose-500/20">🚨 EXPENSE CRITICAL</span>}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Burned: ₹{budget.spent.toLocaleString('en-IN')}</span>
                      <span>Cap: ₹{budget.limit.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${isApproachingLimit ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} style={{ width: `${percentUsed}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Main Workspaces Layout (Sprint 1 + 2 Core Modules) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-4">Liquidity Positions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {accounts.map(acc => (
                  <div key={acc.id} className="bg-slate-900 border border-slate-800/80 rounded-xl p-5">
                    <p className="text-xs font-bold text-slate-400">{acc.name}</p>
                    <p className="text-2xl font-black mt-2 text-slate-100">₹{acc.balance.toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Transfer Portal */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-1">The Capital Shuffler</h2>
              <form onSubmit={handleTransfer} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Source</label>
                    <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200">
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Destination</label>
                    <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200">
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Category Override</label>
                    <select value={transactionCategory} onChange={(e) => setTransactionCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200">
                      {budgets.map(b => <option key={b.category} value={b.category}>{b.category}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Volume (INR)</label>
                  <input type="number" value={amountStr} onChange={(e) => setAmountStr(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm" placeholder="Enter custom position" />
                </div>
                <button type="submit" className="w-full bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg text-sm transition hover:bg-amber-300">Authorize Transaction</button>
              </form>
            </div>
          </div>

          {/* Paper Trail Ledger Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-[420px] flex flex-col">
            <h2 className="text-lg font-semibold text-slate-200">The Paper Trail</h2>
            <div className="flex-1 overflow-y-auto space-y-3 mt-4 pr-1 custom-scrollbar">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-slate-950 border border-slate-800/60 p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold text-slate-300">{tx.fromAccount} → {tx.toAccount}</p>
                    <span className="text-[9px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded mt-1 inline-block">{tx.category}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">₹{tx.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- 3. ISOLATED NEW FEATURE 3 SECTION (BILL SPLITTER) --- */}
        <hr className="border-slate-800" />
        
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">
            🤝 Split Bill Ledger Module
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Log Shared Expense</h3>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input type="text" placeholder="Description" value={expDescription} onChange={(e) => setExpDescription(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100" />
                  <input type="number" placeholder="Amount (₹)" value={expTotalAmount} onChange={(e) => setExpTotalAmount(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100" />
                  <select value={expPaidBy} onChange={(e) => setExpPaidBy(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200">
                    {groupMembers.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => setExpSplitType('Equal')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${expSplitType === 'Equal' ? 'bg-amber-400 text-slate-950 border-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>Equal Split</button>
                  <button type="button" onClick={() => setExpSplitType('Custom')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${expSplitType === 'Custom' ? 'bg-amber-400 text-slate-950 border-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>Custom Split</button>
                </div>

                {expSplitType === 'Custom' && (
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                    {groupMembers.map(m => (
                      <div key={m} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{m}</span>
                        <input type="number" placeholder="₹0" value={customSplits[m]} onChange={(e) => setCustomSplits({ ...customSplits, [m]: e.target.value })} className="w-24 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-right" />
                      </div>
                    ))}
                  </div>
                )}

                {splitErrorMessage && <div className="text-rose-400 text-xs">⚠️ {splitErrorMessage}</div>}
                <button type="submit" className="w-full bg-slate-800 text-slate-100 text-xs font-bold py-2 rounded-lg border border-slate-700 transition hover:bg-slate-700">Add Bill</button>
              </form>
            </div>

            {/* Algorithmic Clearing Pathways Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Minimum Transaction Settlements</h3>
              
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[160px] custom-scrollbar">
                {optimizedSettlements.length === 0 ? (
                  <p className="text-xs text-emerald-400 font-medium py-4 text-center">🤝 All clear! Financial harmony reached.</p>
                ) : (
                  optimizedSettlements.map((set, i) => (
                    <div key={i} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                      <div><span className="text-rose-400 font-bold">{set.from}</span> → <span className="text-emerald-400 font-bold">{set.to}</span></div>
                      <span className="font-bold text-amber-400">₹{set.amount}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default App;