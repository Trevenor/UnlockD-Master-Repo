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
  description: string;
  amount: number;
  category: string;
  timestamp: string; // ISO String format for clean date filtering
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
  const [showWelcome, setShowWelcome] = useState(true);

  // --- BASE STATES ---
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

  // --- FEATURE 3 STATES ---
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

  // --- FEATURE 4: FILTER MATRIX STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterAccount, setFilterAccount] = useState('All');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  // Inline Editing States
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Form states
  const [isProcessing, setIsProcessing] = useState(false);
  const [fromAccountId, setFromAccountId] = useState('1');
  const [toAccountId, setToAccountId] = useState('2');
  const [transactionDescription, setTransactionDescription] = useState('');
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

  // --- FILTER & SEARCH PROCESSING PIPELINE ---
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.fromAccount.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.toAccount.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'All' || tx.category === filterCategory;
    const matchesAccount = filterAccount === 'All' || tx.fromAccount === filterAccount || tx.toAccount === filterAccount;
    
    const minAmt = parseFloat(filterMinAmount);
    const maxAmt = parseFloat(filterMaxAmount);
    const matchesMinAmount = isNaN(minAmt) || tx.amount >= minAmt;
    const matchesMaxAmount = isNaN(maxAmt) || tx.amount <= maxAmt;

    const txDate = new Date(tx.timestamp).getTime();
    const startLimit = filterStartDate ? new Date(filterStartDate).getTime() : null;
    // Set end limit to end of the day if provided
    const endLimit = filterEndDate ? new Date(filterEndDate).setHours(23, 59, 59, 999) : null;
    
    const matchesStartDate = !startLimit || txDate >= startLimit;
    const matchesEndDate = !endLimit || txDate <= endLimit;

    return matchesSearch && matchesCategory && matchesAccount && matchesMinAmount && matchesMaxAmount && matchesStartDate && matchesEndDate;
  });

  // --- EDIT DATA MANAGEMENT ACTIONS ---
  const startEditing = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditDescription(tx.description);
    setEditCategory(tx.category);
  };

  const saveEdit = (id: string) => {
    setTransactions(prev => prev.map(tx => {
      if (tx.id === id) {
        return { ...tx, description: editDescription, category: editCategory };
      }
      return tx;
    }));
    setEditingTxId(null);
  };

  // --- HISTORY DATA EXPORTER (CSV BUILDER) ---
  const exportToCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['Timestamp', 'Sender/Debit Source', 'Recipient/Credit Destination', 'Description', 'Category', 'Volume (INR)', 'Status'];
    const rows = transactions.map(tx => [
      new Date(tx.timestamp).toLocaleString(),
      tx.fromAccount,
      tx.toAccount,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.category,
      tx.amount,
      tx.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gujjew_finance_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- BILL SPLITTER DEBT ALGORITHM ---
  const computeOptimizedSettlements = (): Settlement[] => {
    const netBalances: { [name: string]: number } = {};
    groupMembers.forEach(m => (netBalances[m] = 0));
    expenses.forEach(exp => {
      netBalances[exp.paidBy] += exp.totalAmount;
      groupMembers.forEach(m => { netBalances[m] -= exp.splits[m] || 0; });
    });
    const participants = Object.keys(netBalances).map(name => ({
      name, balance: netBalances[name]
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
      settlements.push({ from: debtor.name, to: creditor.name, amount: Math.round(settleAmount) });
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
    if (isNaN(total) || total <= 0) return;

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
        setSplitErrorMessage(`Splits must equal exactly total.`);
        return;
      }
    }
    const newExpense: GroupExpense = {
      id: `exp_${Date.now()}`, description: expDescription || 'Shared Expense',
      totalAmount: total, paidBy: expPaidBy, splitType: expSplitType, splits: dynamicSplits
    };
    setExpenses(prev => [newExpense, ...prev]);
    setExpDescription(''); setExpTotalAmount('');
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(''); setSuccessMessage('');
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
        description: transactionDescription || 'Direct Capital Shuffle',
        amount: amount,
        category: transactionCategory,
        timestamp: new Date().toISOString(),
        status: 'Completed',
        type: 'Transfer'
      };
      setTransactions(prev => [successTx, ...prev]);
      setSuccessMessage(`Transaction cleared smoothly.`);
      setAmountStr(''); setTransactionDescription('');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 relative">
      
      {/* CLICHÉ POPUP */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-slate-950/80 transition-all duration-300">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex justify-center">
              <img src="/logo.jpeg" className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-xl [image-rendering:pixelated]" alt="Logo" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Gujjew Finance</h2>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Premium Ledger Alpha v1.02</p>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed px-2">
              Tired of using the same old legacy banking pipelines? <br />
              <span className="text-amber-400 font-semibold">Here, try Gujjew Finance.</span> <br />
              Where numbers only go up and interest is earned, never paid.
            </p>
            <button onClick={() => setShowWelcome(false)} className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black py-3 rounded-xl text-sm shadow-lg shadow-orange-500/10 cursor-pointer">
              Let's Get Started →
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD GRID */}
      <div className={`max-w-6xl mx-auto space-y-8 transition-all duration-500 ${showWelcome ? 'blur-md pointer-events-none scale-95 opacity-40' : 'blur-none scale-100 opacity-100'}`}>
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/80 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" className="w-12 h-12 rounded-xl object-cover border border-amber-500/30" alt="Logo" />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Gujjew Finance</h1>
              <p className="text-sm text-slate-400 mt-1">Interest is earned, never paid. 💸</p>
            </div>
          </div>
          <span className="bg-amber-500/10 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-500/20">⚡ Feature 4 Loaded</span>
        </header>

        {/* Analytics Summary */}
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

        {/* Feature 2: Budgeting */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-4">🛡️ Budget Drainage Trackers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {budgets.map(budget => {
              const percentUsed = Math.min((budget.spent / budget.limit) * 100, 100);
              const isApproachingLimit = percentUsed >= 80;
              return (
                <div key={budget.category} className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xs font-bold text-slate-200">{budget.category}</h3>
                    {isApproachingLimit && <span className="bg-rose-500/10 text-rose-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-rose-500/20">🚨 EXPENSE CRITICAL</span>}
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${isApproachingLimit ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} style={{ width: `${percentUsed}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Workspaces Main Core Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Liquidity Accounts */}
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

            {/* Core Transfer Execution Engine */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-1">The Capital Shuffler</h2>
              <form onSubmit={handleTransfer} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Source</label>
                    <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200">
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Destination</label>
                    <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200">
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Category Pipeline</label>
                    <select value={transactionCategory} onChange={(e) => setTransactionCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200">
                      {budgets.map(b => <option key={b.category} value={b.category}>{b.category}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Description / Merchant Name</label>
                    <input type="text" value={transactionDescription} onChange={(e) => setTransactionDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100" placeholder="e.g., Zerodha Deposit, Chai Tapri" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Volume (INR)</label>
                    <input type="number" value={amountStr} onChange={(e) => setAmountStr(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs" placeholder="₹ Value" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-amber-400 text-slate-950 font-bold py-2 rounded-lg text-xs transition hover:bg-amber-300">Authorize Transaction</button>
              </form>
            </div>
          </div>

          {/* Feature 3 Module Component */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-200">Greedy Settlements</h2>
              <p className="text-xs text-slate-400 mb-4">Algorithmic debt optimization netting.</p>
              <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                {optimizedSettlements.length === 0 ? (
                  <p className="text-xs text-emerald-400 font-medium text-center py-4">🤝 Financial harmony reached.</p>
                ) : (
                  optimizedSettlements.map((set, i) => (
                    <div key={i} className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between text-xs">
                      <span>{set.from} → {set.to}</span>
                      <span className="font-bold text-amber-400">₹{set.amount}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <form onSubmit={handleAddExpense} className="space-y-2 pt-4 border-t border-slate-800 mt-4">
              <div className="grid grid-cols-2 gap-1.5">
                <input type="text" placeholder="Bill Tag" value={expDescription} onChange={(e) => setExpDescription(e.target.value)} className="bg-slate-950 border border-slate-800 rounded p-1.5 text-xs" />
                <input type="number" placeholder="Amt (₹)" value={expTotalAmount} onChange={(e) => setExpTotalAmount(e.target.value)} className="bg-slate-950 border border-slate-800 rounded p-1.5 text-xs" />
              </div>
              <button type="submit" className="w-full bg-slate-800 text-xs font-bold py-1.5 rounded border border-slate-700">Add Equal Split Bill</button>
            </form>
          </div>
        </div>

        {/* --- FEATURE 4: ADVANCED TRANSACTION MANAGEMENT LEDGER (FULL BAR HUB) --- */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Live Advanced Transaction Auditor</h2>
              <p className="text-xs text-slate-400">Filter, edit, categorize, and export master transaction matrices.</p>
            </div>
            <button 
              onClick={exportToCSV}
              disabled={transactions.length === 0}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
            >
              📥 Export Ledger History (.CSV)
            </button>
          </div>

          {/* Filter Panel State Selectors Inputs */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <div className="col-span-2 lg:col-span-1">
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Search Keywords</label>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-200" placeholder="Merchant, Account..." />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Category</label>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300">
                <option value="All">All Categories</option>
                {budgets.map(b => <option key={b.category} value={b.category}>{b.category}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Account Pipeline</label>
              <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300">
                <option value="All">All Pipelines</option>
                {accounts.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Min Amount (₹)</label>
              <input type="number" value={filterMinAmount} onChange={(e) => setFilterMinAmount(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-100" placeholder="Min" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Max Amount (₹)</label>
              <input type="number" value={filterMaxAmount} onChange={(e) => setFilterMaxAmount(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-100" placeholder="Max" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Start Date</label>
              <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">End Date</label>
              <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300" />
            </div>
          </div>

          {/* Master Output List Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-[350px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse bg-slate-900/40">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black tracking-wider sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="p-3">Timeline</th>
                  <th className="p-3">Audit Hop</th>
                  <th className="p-3">Description / Merchant</th>
                  <th className="p-3">Category Allocation</th>
                  <th className="p-3 text-right">Volume</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">No transactions match your explicit filtering matrices.</td>
                  </tr>
                ) : (
                  filteredTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-900/60 transition duration-150">
                      <td className="p-3 text-slate-400 text-[11px]">
                        {new Date(tx.timestamp).toLocaleDateString()} <br />
                        <span className="text-[10px] text-slate-600">{new Date(tx.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="p-3 font-medium text-slate-300">
                        {tx.fromAccount} <span className="text-slate-600">→</span> <span className="text-slate-400">{tx.toAccount}</span>
                      </td>
                      
                      {/* Inline Edit Handler for Descriptions */}
                      <td className="p-3">
                        {editingTxId === tx.id ? (
                          <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 max-w-xs" />
                        ) : (
                          <span className="text-slate-200">{tx.description}</span>
                        )}
                      </td>

                      {/* Inline Edit Handler for Categories */}
                      <td className="p-3">
                        {editingTxId === tx.id ? (
                          <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200">
                            {budgets.map(b => <option key={b.category} value={b.category}>{b.category}</option>)}
                          </select>
                        ) : (
                          <span className="bg-slate-800/80 px-2 py-1 rounded text-[10px] font-semibold text-slate-400 border border-slate-800">{tx.category}</span>
                        )}
                      </td>
                      
                      <td className="p-3 text-right font-bold text-teal-400 text-sm">
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                      
                      {/* Action Triggers */}
                      <td className="p-3 text-center">
                        {editingTxId === tx.id ? (
                          <button onClick={() => saveEdit(tx.id)} className="bg-amber-400 text-slate-950 px-2.5 py-1 rounded font-bold hover:bg-amber-300 transition">Save</button>
                        ) : (
                          <button onClick={() => startEditing(tx)} className="text-slate-400 hover:text-amber-400 font-semibold transition px-2 py-1">Categorize/Edit</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}

export default App;