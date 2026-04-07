import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';

export default function Anniversary() {
  const { getAnniversaries, updateAnniversaries } = useData();
  const anniversaries = getAnniversaries();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', date: '' });

  const sortedList = useMemo(() => {
    return [...anniversaries].map((item, originalIndex) => ({ item, originalIndex }))
      .sort((a, b) => new Date(a.item.date) - new Date(b.item.date));
  }, [anniversaries]);

  const handleSave = () => {
    const { title, date } = formData;
    if (!title || !date) {
      alert("請輸入標題與日期");
      return;
    }

    const newList = [...anniversaries, { title, date }];
    updateAnniversaries(newList);
    setIsModalOpen(false);
    alert("紀念日已新增！");
  };

  const handleDelete = (index) => {
    if (window.confirm("確定要刪除這個紀念日嗎？")) {
      const newList = [...anniversaries];
      newList.splice(index, 1);
      updateAnniversaries(newList);
    }
  };

  const openModal = () => {
    setFormData({ title: '', date: '' });
    setIsModalOpen(true);
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return (
    <div id="view-anniversary">
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center' }}>💝 紀念日 & 倒數</h2>
        <div id="anniversary-list" style={{ minHeight: '200px' }}>
          {sortedList.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              💝 新增第一個倒數日吧！<br />(例如：交往紀念、生日倒數)
            </p>
          ) : (
            sortedList.map(({ item, originalIndex }) => {
              const targetDate = new Date(item.date);
              targetDate.setHours(0, 0, 0, 0);
              
              const diffTime = now - targetDate;
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              
              let statusText = "";
              let daysText = "";
              let color = "";
              let fontWeight = "";

              if (diffDays === 0) {
                statusText = "就是今天！";
                daysText = "TODAY";
                color = "#e74c3c";
                fontWeight = "bold";
              } else if (diffDays > 0) {
                statusText = "已過去";
                daysText = `${diffDays} 天`;
                color = "#7f8c8d";
                fontWeight = "normal";
              } else {
                statusText = "還有";
                daysText = `${Math.abs(diffDays)} 天`;
                color = "#27ae60";
                fontWeight = "bold";
              }

              return (
                <div key={originalIndex} style={{ background: 'white', borderBottom: '1px solid #eee', padding: '15px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '0.85rem', color: '#888' }}>{item.date} ({statusText})</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', color, fontWeight }}>{daysText}</div>
                    <button onClick={() => handleDelete(originalIndex)} style={{ background: 'transparent', border: 'none', color: '#e74c3c', fontSize: '0.8rem', cursor: 'pointer', marginTop: '5px', opacity: 0.7 }}>🗑️ 刪除</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <button className="btn btn-add" onClick={openModal}>+ 新增紀念日</button>
      </div>

      {isModalOpen && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ textAlign: 'left' }}>
            <h3 style={{ textAlign: 'center', marginTop: 0 }}>💝 新增紀念日</h3>
            <div className="input-group">
              <label>標題名稱</label>
              <input type="text" placeholder="例如：男友生日、交往紀念" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="input-group">
              <label>目標日期</label>
              <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <button className="btn" style={{ width: '100%', background: 'var(--primary)' }} onClick={handleSave}>+ 新增</button>
            <button className="btn" style={{ width: '100%', marginTop: '10px', background: 'transparent', color: '#666', border: '1px solid #ddd' }} onClick={() => setIsModalOpen(false)}>取消</button>
          </div>
        </div>
      )}
    </div>
  );
}
