import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import Chart from 'chart.js/auto';

export default function Accounting() {
  const { paymentMethods, setPaymentMethods, accCategories, setAccCategories, getAccountingList, updateAccountingList, saveData } = useData();
  const [currentAccTab, setCurrentAccTab] = useState('summary');
  const [isAccDetailsEditMode, setIsAccDetailsEditMode] = useState(false);
  const [isAccAccountsEditMode, setIsAccAccountsEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const accountingList = getAccountingList();

  // Modal State
  const [editingIndex, setEditingIndex] = useState(-1);
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txType, setTxType] = useState('expense');
  const [txMethod, setTxMethod] = useState(paymentMethods[0] || '現金');
  const [txToMethod, setTxToMethod] = useState(paymentMethods[0] || '現金');
  const [txItems, setTxItems] = useState([{ title: '', category: accCategories.expense[0], amount: '' }]);

  const accChartRef = useRef(null);
  const categoryChartRef = useRef(null);
  const accChartInstance = useRef(null);
  const categoryChartInstance = useRef(null);

  useEffect(() => {
    if (currentAccTab === 'stats') {
      renderAccChart();
      renderCategoryChart();
    }
  }, [currentAccTab, accountingList]);

  // Derived state for summary
  const totalIncome = accountingList.filter(i => i.type === 'income').reduce((sum, i) => sum + (parseInt(i.amount) || 0), 0);
  const totalExpense = accountingList.filter(i => i.type === 'expense').reduce((sum, i) => sum + (parseInt(i.amount) || 0), 0);
  const summaryBalance = totalIncome - totalExpense;

  const handleOpenModal = (index = -1) => {
    if (index > -1) {
      const item = accountingList[index];
      setEditingIndex(index);
      setTxDate(item.date);
      setTxType(item.type);
      setTxMethod(item.method || '現金');
      if (item.type === 'transfer') setTxToMethod(item.to_method || paymentMethods[0] || '現金');
      setTxItems([{ title: item.title, category: item.category || accCategories.expense[0], amount: item.amount }]);
    } else {
      setEditingIndex(-1);
      setTxDate(new Date().toISOString().split('T')[0]);
      setTxType('expense');
      setTxMethod(paymentMethods[0] || '現金');
      setTxToMethod(paymentMethods[0] || '現金');
      setTxItems([{ title: '', category: accCategories.expense[0], amount: '' }]);
    }
    setIsModalOpen(true);
  };

  const handleSaveTransaction = () => {
    if (!txDate) return alert("請輸入日期");
    if (txType === 'transfer' && txMethod === txToMethod) return alert("轉出與轉入帳戶不能相同！");
    if (txItems.length === 0) return alert("請至少保留一筆資料輸入框！");

    let hasError = false;
    const newItems = txItems.map(item => {
      let t = item.title.trim();
      const a = parseInt(item.amount);
      if (isNaN(a) || a <= 0) hasError = true;
      if (txType === 'transfer' && !t) t = "轉帳";
      if (txType !== 'transfer' && !t) hasError = true;

      return {
        date: txDate,
        title: t,
        category: txType === 'transfer' ? null : item.category,
        amount: a,
        type: txType,
        method: txMethod,
        to_method: txType === 'transfer' ? txToMethod : null
      };
    });

    if (hasError) return alert("請確認每筆資料的「項目名稱」與「金額」皆已填寫，且金額必須大於 0！");

    let newList = [...accountingList];
    if (editingIndex > -1) {
      newList[editingIndex] = newItems[0];
    } else {
      newList.push(...newItems);
    }

    updateAccountingList(newList);
    setIsModalOpen(false);
  };

  const handleDeleteTransaction = (idx) => {
    if (window.confirm("確定要刪除這筆紀錄嗎？")) {
      let newList = [...accountingList];
      newList.splice(idx, 1);
      updateAccountingList(newList);
    }
  };

  const renderAccChart = () => {
    if (!accChartRef.current) return;
    const monthlyData = {};
    const allMonths = new Set();
    accountingList.forEach(item => {
      const month = item.date.substring(0, 7);
      allMonths.add(month);
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
      const amt = parseInt(item.amount) || 0;
      if (item.type === 'income') monthlyData[month].income += amt;
      else if (item.type === 'expense') monthlyData[month].expense += amt;
    });

    const sortedMonths = Array.from(allMonths).sort();
    const dataIncome = sortedMonths.map(m => monthlyData[m].income);
    const dataExpense = sortedMonths.map(m => monthlyData[m].expense);
    const dataBalance = sortedMonths.map(m => monthlyData[m].income - monthlyData[m].expense);

    if (accChartInstance.current) accChartInstance.current.destroy();
    accChartInstance.current = new Chart(accChartRef.current, {
      type: 'bar',
      data: {
        labels: sortedMonths,
        datasets: [
          { type: 'line', label: '結餘', data: dataBalance, borderColor: '#f1c40f', borderWidth: 2, fill: false, tension: 0.1, order: 0 },
          { label: '收入', data: dataIncome, backgroundColor: 'rgba(46, 204, 113, 0.6)', borderColor: '#2ecc71', borderWidth: 1, order: 1 },
          { label: '支出', data: dataExpense, backgroundColor: 'rgba(231, 76, 60, 0.6)', borderColor: '#e74c3c', borderWidth: 1, order: 2 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  };

  const renderCategoryChart = () => {
    if (!categoryChartRef.current) return;
    const categoryData = {};
    let tExpense = 0;

    accountingList.forEach(item => {
      if (item.type === 'expense') {
        const amt = parseInt(item.amount) || 0;
        const cat = item.category || '其他';
        if (!categoryData[cat]) categoryData[cat] = 0;
        categoryData[cat] += amt;
        tExpense += amt;
      }
    });

    if (categoryChartInstance.current) categoryChartInstance.current.destroy();
    
    if (tExpense === 0) return; // Will show "no data" text

    const sortedCategories = Object.keys(categoryData).sort((a, b) => categoryData[b] - categoryData[a]);
    const labels = sortedCategories;
    const data = sortedCategories.map(cat => categoryData[cat]);

    const bgColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8AC926'];
    const dynamicBackgroundColors = labels.map((cat, i) => cat === "糊塗帳" ? '#7f8c8d' : bgColors[i % bgColors.length]);

    categoryChartInstance.current = new Chart(categoryChartRef.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: dynamicBackgroundColors, borderWidth: 2, borderColor: '#ffffff' }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: $${ctx.parsed} (${Math.round((ctx.parsed / tExpense) * 100)}%)`
            }
          }
        }
      }
    });
  };

  const getBalances = () => {
    const balances = {};
    paymentMethods.forEach(m => balances[m] = 0);
    accountingList.forEach(item => {
      const m = item.method || '現金';
      const a = parseInt(item.amount) || 0;
      if (balances[m] === undefined) balances[m] = 0;
      if (item.type === 'income') balances[m] += a;
      else if (item.type === 'expense') balances[m] -= a;
      else if (item.type === 'transfer') {
        balances[m] -= a;
        if (item.to_method) {
          if (balances[item.to_method] === undefined) balances[item.to_method] = 0;
          balances[item.to_method] += a;
        }
      }
    });
    return balances;
  };

  const balances = getBalances();

  return (
    <div id="view-accounting">
      <div className="week-tabs" style={{ marginBottom: '20px' }}>
        <button className={`tab-btn ${currentAccTab === 'summary' ? 'active' : ''}`} onClick={() => setCurrentAccTab('summary')}>📊 摘要</button>
        <button className={`tab-btn ${currentAccTab === 'details' ? 'active' : ''}`} onClick={() => setCurrentAccTab('details')}>📝 明細</button>
        <button className={`tab-btn ${currentAccTab === 'stats' ? 'active' : ''}`} onClick={() => setCurrentAccTab('stats')}>📈 統計</button>
        <button className={`tab-btn ${currentAccTab === 'accounts' ? 'active' : ''}`} onClick={() => setCurrentAccTab('accounts')}>⚙️ 設定</button>
      </div>

      {currentAccTab === 'summary' && (
        <div id="view-acc-summary">
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <h2 style={{ justifyContent: 'center', border: 'none', marginBottom: '30px' }}>💰 本學期收支總覽</h2>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '30px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>總收入</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2ecc71' }}>${totalIncome}</div>
              </div>
              <div style={{ flex: 1, borderLeft: '1px solid #eee', borderRight: '1px solid #eee' }}>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>總支出</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#e74c3c' }}>${totalExpense}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>結餘</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: summaryBalance >= 0 ? '#333' : '#e74c3c' }}>${summaryBalance}</div>
              </div>
            </div>
            <button className="btn btn-add" onClick={() => handleOpenModal()} style={{ fontSize: '1.1rem', padding: '15px' }}>+ 記一筆</button>
          </div>
        </div>
      )}

      {currentAccTab === 'details' && (
        <div id="view-acc-details">
          <div className="card">
            <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📝 收支明細列表</span>
              <button className="btn-icon" onClick={() => setIsAccDetailsEditMode(!isAccDetailsEditMode)} style={{ fontSize: '0.85rem', background: isAccDetailsEditMode ? '#e6f0ff' : 'transparent', border: `1px solid ${isAccDetailsEditMode ? 'var(--primary)' : '#ddd'}`, color: isAccDetailsEditMode ? 'var(--primary)' : '#888', padding: '6px 12px' }}>
                {isAccDetailsEditMode ? '✏️ 編輯模式' : '🔒 唯讀模式'}
              </button>
            </h2>
            <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '10px', WebkitOverflowScrolling: 'touch' }}>
              <table id="accounting-table" style={{ minWidth: '700px', width: '100%', textAlign: 'center' }}>
                <thead>
                  <tr>
                    <th width="15%">日期</th>
                    <th width="12%">分類</th>
                    <th width="23%">項目</th>
                    <th width="15%">支付方式</th>
                    <th width="15%">金額</th>
                    {isAccDetailsEditMode && <th width="20%">更改/刪除</th>}
                  </tr>
                </thead>
                <tbody>
                  {accountingList.length === 0 ? <tr><td colSpan={isAccDetailsEditMode ? 6 : 5} className="no-class">💰 目前無收支紀錄</td></tr> : 
                    [...accountingList].sort((a,b)=>new Date(b.date)-new Date(a.date)).map((item, idx) => {
                      const actualIdx = accountingList.indexOf(item);
                      const isIncome = item.type === 'income';
                      const isTransfer = item.type === 'transfer';
                      return (
                        <tr key={actualIdx}>
                          <td>{item.date}</td>
                          <td>
                            {isTransfer ? <span style={{ color: '#aaa' }}>-</span> : <span style={{ background: '#f5f5f5', color: '#666', border: '1px solid #ddd', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{item.category || '其他'}</span>}
                          </td>
                          <td style={{ textAlign: 'left' }}>
                            {isTransfer && <span style={{ background: '#3498db', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', marginRight: '5px' }}>轉帳</span>}
                            {item.title}
                          </td>
                          <td>
                            {isTransfer ? <span style={{ fontSize: '0.85rem', color: '#555' }}>{item.method} ➝ {item.to_method}</span> : <span style={{ backgroundColor: '#f3e5f5', color: '#8e24aa', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{item.method || '現金'}</span>}
                          </td>
                          <td style={{ fontWeight: 'bold', color: isTransfer ? '#3498db' : (isIncome ? '#2ecc71' : '#e74c3c') }}>
                            {!isTransfer ? (isIncome ? '+' : '-') : ''}${item.amount}
                          </td>
                          {isAccDetailsEditMode && (
                            <td>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <button className="btn-edit" onClick={() => handleOpenModal(actualIdx)} style={{ padding: '6px 12px', margin: 0, fontSize: '0.9rem' }}>✏️</button>
                                <button className="btn-delete" onClick={() => handleDeleteTransaction(actualIdx)} style={{ padding: '6px 12px', margin: 0, fontSize: '0.9rem' }}>🗑️</button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {currentAccTab === 'stats' && (
        <div id="view-acc-stats">
          <div className="card" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column' }}>
            <h2>📈 每月收支趨勢</h2>
            <div style={{ flex: 1, position: 'relative', minHeight: '300px' }}>
              <canvas ref={accChartRef}></canvas>
            </div>
          </div>
          <div className="card" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column' }}>
            <h2>📊 各分類支出比例</h2>
            <div style={{ flex: 1, position: 'relative', minHeight: '250px' }}>
              <canvas ref={categoryChartRef}></canvas>
            </div>
          </div>
        </div>
      )}

      {currentAccTab === 'accounts' && (
        <div id="view-acc-accounts">
           <div className="card">
            <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>💳 帳戶餘額概況</span>
              <button className="btn-icon" onClick={() => setIsAccAccountsEditMode(!isAccAccountsEditMode)} style={{ fontSize: '0.85rem', background: isAccAccountsEditMode ? '#e6f0ff' : 'transparent', border: `1px solid ${isAccAccountsEditMode ? 'var(--primary)' : '#ddd'}`, color: isAccAccountsEditMode ? 'var(--primary)' : '#888', padding: '6px 12px' }}>
                {isAccAccountsEditMode ? '✏️ 編輯模式' : '🔒 唯讀模式'}
              </button>
            </h2>
            <div>
              {paymentMethods.map(method => (
                <div key={method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #eee' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{method}</div>
                    <div style={{ fontSize: '0.85rem', color: '#888' }}>本學期結餘</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: balances[method] >= 0 ? '#2ecc71' : '#e74c3c' }}>${balances[method]}</div>
                  </div>
                </div>
              ))}
            </div>
           </div>
        </div>
      )}

      {/* Accounting Modal */}
      {isModalOpen && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ textAlign: 'left' }}>
            <h3 style={{ textAlign: 'center', marginTop: 0 }}>💰 {editingIndex > -1 ? '編輯收支紀錄' : '新增收支紀錄'}</h3>
            <div className="input-group">
              <label>類型</label>
              <select value={txType} onChange={e => { setTxType(e.target.value); setTxItems(txItems.map(i => ({...i, category: accCategories[e.target.value]?.[0] || '其他'}))) }} className="login-input" style={{ background: 'white' }}>
                <option value="expense">💸 支出</option>
                <option value="income">💰 收入</option>
                <option value="transfer">🔁 轉帳</option>
              </select>
            </div>
            <div className="input-group">
              <label>日期</label>
              <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} />
            </div>
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ marginBottom: 0 }}>項目說明 & 分類 & 金額</label>
                {editingIndex === -1 && <button className="btn" onClick={() => setTxItems([...txItems, { title: '', category: accCategories[txType]?.[0] || '其他', amount: '' }])} style={{ background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', width: 'auto', padding: '4px 10px', fontSize: '0.8rem', borderRadius: '6px' }}>+ 新增另一筆</button>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {txItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fdfdfd', padding: '10px', border: '1px solid #eee', borderRadius: '8px' }}>
                    <input type="text" placeholder={txType === 'transfer' ? "轉帳" : "例如：早餐"} value={item.title} onChange={e => { const n = [...txItems]; n[i].title = e.target.value; setTxItems(n) }} style={{ flex: 2, padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.95rem' }} />
                    {txType !== 'transfer' && (
                      <select value={item.category} onChange={e => { const n = [...txItems]; n[i].category = e.target.value; setTxItems(n) }} style={{ flex: 1.5, padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}>
                        {accCategories[txType]?.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                    <input type="number" placeholder="金額" value={item.amount} onChange={e => { const n = [...txItems]; n[i].amount = e.target.value; setTxItems(n) }} style={{ flex: 1.5, padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }} />
                    {txItems.length > 1 && editingIndex === -1 && <button onClick={() => setTxItems(txItems.filter((_, idx) => idx !== i))} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>✖</button>}
                  </div>
                ))}
              </div>
            </div>
            <div className="input-group">
              <label>{txType === 'transfer' ? '轉出帳戶 (扣款)' : '支付方式'}</label>
              <select value={txMethod} onChange={e => setTxMethod(e.target.value)} className="login-input" style={{ background: 'white' }}>
                {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {txType === 'transfer' && (
              <div className="input-group">
                <label>轉入帳戶 (存入)</label>
                <select value={txToMethod} onChange={e => setTxToMethod(e.target.value)} className="login-input" style={{ background: 'white' }}>
                  {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}
            <button className="btn" style={{ width: '100%', background: editingIndex > -1 ? '#f39c12' : '#333' }} onClick={handleSaveTransaction}>{editingIndex > -1 ? "💾 保存修改" : "+ 確定新增"}</button>
            <button className="btn" style={{ width: '100%', marginTop: '10px', background: 'transparent', color: '#666', border: '1px solid #ddd' }} onClick={() => setIsModalOpen(false)}>關閉</button>
          </div>
        </div>
      )}
    </div>
  );
}
