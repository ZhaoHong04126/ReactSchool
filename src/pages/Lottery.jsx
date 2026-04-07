import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

const defaultLotteryData = [
  { title: "午餐吃什麼？", items: ["水餃", "炒飯", "義大利麵", "滷肉飯", "牛肉麵", "麥當勞", "超商", "便當", "健康餐", "吃土"] },
  { title: "飲料喝什麼？", items: ["50嵐", "清心", "麻古", "可不可", "茶湯會", "珍煮丹", "迷客夏", "超商", "喝水就好"] },
  { title: "今晚打哪款遊戲？", items: ["LOL", "APEX", "Valorant", "原神", "Minecraft", "Steam 單機", "傳說對決", "早點睡比較實在"] }
];

export default function Lottery() {
  const { getLotteryList, updateLotteryList } = useData();
  const rawList = getLotteryList();
  
  // Initialize with default data if empty
  const [list, setList] = useState([]);
  
  useEffect(() => {
    if (rawList.length === 0) {
      updateLotteryList(defaultLotteryData);
      setList(defaultLotteryData);
    } else {
      setList(rawList);
    }
  }, [rawList]);

  const [currentCatIndex, setCurrentCatIndex] = useState(0);
  const [newItemText, setNewItemText] = useState('');
  
  // Animation state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawResult, setDrawResult] = useState('');

  const currentCategory = list[currentCatIndex] || { title: '', items: [] };

  const handleAddCategory = () => {
    const title = window.prompt("請輸入新籤筒名稱：\n(例如：晚餐吃什麼、誰去拿外送)");
    if (!title) return;
    const newList = [...list, { title, items: [] }];
    updateLotteryList(newList);
    setCurrentCatIndex(newList.length - 1);
  };

  const handleDeleteCategory = () => {
    if (list.length <= 1) {
      alert("至少要保留一個籤筒喔！");
      return;
    }
    if (window.confirm(`確定要刪除「${currentCategory.title}」這整個籤筒嗎？`)) {
      const newList = [...list];
      newList.splice(currentCatIndex, 1);
      updateLotteryList(newList);
      setCurrentCatIndex(0);
    }
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    const newList = [...list];
    newList[currentCatIndex].items.push(newItemText.trim());
    updateLotteryList(newList);
    setNewItemText('');
  };

  const handleDeleteItem = (itemIndex) => {
    const newList = [...list];
    newList[currentCatIndex].items.splice(itemIndex, 1);
    updateLotteryList(newList);
  };

  const startLottery = () => {
    if (currentCategory.items.length === 0) {
      alert("這個籤筒裡面沒有選項喔！\n請先在下方新增一些選項 :)");
      return;
    }
    if (isDrawing) return;

    setIsDrawing(true);
    setDrawResult('');
    
    let rounds = 0;
    const maxRounds = 20;
    let speed = 50;
    const items = currentCategory.items;

    const roll = () => {
      const randIdx = Math.floor(Math.random() * items.length);
      setDrawResult(items[randIdx]);
      
      rounds++;
      if (rounds < maxRounds) {
        speed += 10;
        setTimeout(roll, speed);
      } else {
        const finalIdx = Math.floor(Math.random() * items.length);
        setDrawResult(items[finalIdx]);
        setIsDrawing(false);
      }
    };
    
    roll();
  };

  if (list.length === 0) return null; // Waiting for useEffect to populate

  return (
    <div id="view-lottery">
      <div className="card" style={{ textAlign: 'center' }}>
        <h2 style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span>🎰 {currentCategory.title}</span>
        </h2>
        <div id="lottery-result-box" style={{ background: isDrawing ? '#fffde7' : '#f8f9fa', border: `2px dashed ${isDrawing ? '#fbc02d' : '#ddd'}`, borderRadius: '12px', padding: '40px 20px', margin: '20px 0', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
          <span style={{ fontSize: isDrawing ? '2.5rem' : '2rem', fontWeight: 'bold', color: isDrawing ? 'var(--primary)' : (drawResult ? 'var(--primary)' : '#aaa'), textShadow: isDrawing ? '0 0 10px rgba(74, 144, 226, 0.3)' : 'none', transform: isDrawing ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.1s' }}>
            {drawResult || '準備好了嗎？'}
          </span>
        </div>
        <button className="btn" style={{ width: '100%', padding: '15px', fontSize: '1.2rem', background: isDrawing ? '#ccc' : 'var(--primary)', boxShadow: isDrawing ? 'none' : '0 4px 12px rgba(74, 144, 226, 0.3)', pointerEvents: isDrawing ? 'none' : 'auto' }} onClick={startLottery}>
          {isDrawing ? '🎲 抽籤中...' : '🎲 開始抽籤'}
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0, border: 'none' }}>📝 籤筒清單</h2>
          <select value={currentCatIndex} onChange={e => setCurrentCatIndex(Number(e.target.value))} style={{ padding: '5px', borderRadius: '6px', border: '1px solid #ddd' }}>
            {list.map((cat, idx) => (
              <option key={idx} value={idx}>{cat.title}</option>
            ))}
          </select>
        </div>
        <div className="input-group" style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="新增選項 (例如: 麥當勞)" value={newItemText} onChange={e => setNewItemText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddItem()} style={{ flex: 1 }} />
          <button className="btn" onClick={handleAddItem} style={{ width: 'auto', background: '#666' }}>+</button>
        </div>
        <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {currentCategory.items.map((item, idx) => (
            <span key={idx} style={{ background: '#f0f4f8', padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem', color: '#333', border: '1px solid #e1e8ed', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {item}
              <button onClick={() => handleDeleteItem(idx)} style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: 0, marginLeft: '5px' }}>✖</button>
            </span>
          ))}
          {currentCategory.items.length === 0 && (
            <div style={{ color: '#999', fontSize: '0.9rem', textAlign: 'center', width: '100%', padding: '10px' }}>籤筒空空的，趕快新增選項吧！</div>
          )}
        </div>
        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button className="btn" onClick={handleAddCategory} style={{ background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', width: 'auto', fontSize: '0.8rem' }}> + 新增分類 </button>
          <button className="btn" onClick={handleDeleteCategory} style={{ background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', width: 'auto', fontSize: '0.8rem', marginLeft: '5px' }}> 🗑️ 刪除此分類 </button>
        </div>
      </div>
    </div>
  );
}
