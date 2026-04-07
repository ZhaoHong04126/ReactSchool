import React, { useState } from 'react';
import { useData } from '../context/DataContext';

export default function SelfStudy() {
  const { getSelfStudyActivities, updateSelfStudyActivities, selfStudyConversionRate, updateSelfStudyConversionRate, allData, currentSemester, saveData } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [formData, setFormData] = useState({ name: '', location: '', date: '', hours: '' });
  const [rateInput, setRateInput] = useState(selfStudyConversionRate);

  const activities = getSelfStudyActivities();

  // Helper to sync to grades
  const syncToGrades = () => {
    let totalHours = activities.reduce((sum, item) => sum + (parseFloat(item.hours) || 0), 0);
    const credits = Math.floor(totalHours / selfStudyConversionRate);

    if (credits === 0) {
      alert(`目前累計時數不足以兌換學分（需滿 ${selfStudyConversionRate} 小時）。\n繼續加油去參加活動吧！`);
      return;
    }

    const currentAllData = { ...allData };
    if (!currentAllData[currentSemester]) currentAllData[currentSemester] = {};
    if (!currentAllData[currentSemester].grades) currentAllData[currentSemester].grades = [];
    
    const grades = currentAllData[currentSemester].grades;
    let existingIndex = grades.findIndex(g => g.subject === '自主學習' && g.score === -1);

    if (existingIndex > -1) {
      grades[existingIndex].credit = credits;
      alert(`已更新成績單中「自主學習」學分為 ${credits}！`);
    } else {
      grades.push({
        subject: '自主學習',
        category: '自由選修',
        nature: '選修',
        credit: credits,
        score: -1
      });
      alert(`已新增「自主學習」至成績單，學分為 ${credits}！`);
    }

    saveData(currentAllData);
  };

  const openModal = (index = -1) => {
    setEditingIndex(index);
    if (index > -1) {
      const item = activities[index];
      setFormData({ name: item.name, location: item.location || '', date: item.date, hours: item.hours });
    } else {
      setFormData({ name: '', location: '', date: new Date().toISOString().split('T')[0], hours: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const { name, location, date, hours } = formData;
    const h = parseFloat(hours);
    if (!name.trim() || !date || isNaN(h) || h <= 0) {
      alert('請輸入活動名稱、日期與有效的獲得時數');
      return;
    }

    const newData = { name: name.trim(), location: location.trim(), date, hours: h };
    const newList = [...activities];

    if (editingIndex > -1) {
      newList[editingIndex] = newData;
      alert("活動修改成功！");
    } else {
      newList.push(newData);
      alert("活動已新增！");
    }

    updateSelfStudyActivities(newList);
    setIsModalOpen(false);
  };

  const handleDelete = (index) => {
    if (window.confirm("確定要刪除這筆活動紀錄嗎？")) {
      const newList = [...activities];
      newList.splice(index, 1);
      updateSelfStudyActivities(newList);
      if (editingIndex === index) setIsModalOpen(false);
    }
  };

  const totalHours = activities.reduce((sum, item) => sum + (parseFloat(item.hours) || 0), 0);
  const credits = Math.floor(totalHours / selfStudyConversionRate);
  const hoursLeft = selfStudyConversionRate - (totalHours % selfStudyConversionRate);

  // Sorting
  const sortedActivities = [...activities].map((item, originalIndex) => ({item, originalIndex}))
    .sort((a,b) => new Date(b.item.date) - new Date(a.item.date));

  return (
    <div id="view-self-study">
      <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
        <h2 style={{ justifyContent: 'center', border: 'none', marginBottom: '20px' }}>🏃 自主學習進度</h2>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>累計時數</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{totalHours}</div>
          </div>
          <div style={{ flex: 1, borderLeft: '1px solid #eee', borderRight: '1px solid #eee' }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>可得學分</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2ecc71' }}>{credits}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>距離下學分需</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e74c3c' }}>{hoursLeft}</div>
          </div>
        </div>
        <button className="btn" onClick={syncToGrades} style={{ background: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold' }}>🔄 結算並同步至成績單</button>
        <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          (每滿 <span>{selfStudyConversionRate}</span> 小時可兌換 1 學分)
          <button onClick={() => { setRateInput(selfStudyConversionRate); setIsRateModalOpen(true); }} style={{ background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 8px', transition: 'all 0.2s' }}>✏️ 編輯</button>
        </div>
      </div>

      <div className="card">
        <h2>📝 活動紀錄</h2>
        <div style={{ minHeight: '150px' }}>
          {sortedActivities.length === 0 ? <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>目前沒有活動紀錄，趕快去參加活動吧！</p> :
            sortedActivities.map(({item, originalIndex}) => (
              <div key={originalIndex} className="card" style={{ marginBottom: '12px', padding: '15px', borderLeft: '5px solid var(--primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openModal(originalIndex)}>
                    <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '4px' }}>{item.date} • {item.location || '無地點'}</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '5px' }}>{item.name}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{item.hours} 小時</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => openModal(originalIndex)} style={{ background: 'transparent', border: 'none', color: '#f39c12', cursor: 'pointer', fontSize: '0.9rem' }}>✏️</button>
                      <button onClick={() => handleDelete(originalIndex)} style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '0.9rem' }}>🗑️</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
        <button className="btn btn-add" onClick={() => openModal(-1)}>+ 新增活動紀錄</button>
      </div>

      {isModalOpen && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ textAlign: 'left' }}>
            <h3 style={{ textAlign: 'center', marginTop: 0 }}>{editingIndex > -1 ? '✏️ 編輯活動紀錄' : '🏃 新增活動紀錄'}</h3>
            <div className="input-group">
              <label>日期</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="input-group">
              <label>活動與證明名稱</label>
              <input type="text" placeholder="輸入活動名稱..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="input-group">
              <label>發證單位/活動地點 (選填)</label>
              <input type="text" placeholder="例如：學生會、資訊講堂" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <div className="input-group">
              <label>獲得時數 (限數字)</label>
              <input type="number" step="0.5" placeholder="例如：2 或 1.5" value={formData.hours} onChange={e => setFormData({...formData, hours: e.target.value})} />
            </div>
            <button className="btn" style={{ width: '100%', background: editingIndex > -1 ? '#f39c12' : 'var(--primary)' }} onClick={handleSave}>{editingIndex > -1 ? '💾 儲存修改' : '+ 儲存'}</button>
            <button className="btn" style={{ width: '100%', marginTop: '10px', background: 'transparent', color: '#666', border: '1px solid #ddd' }} onClick={() => setIsModalOpen(false)}>取消</button>
          </div>
        </div>
      )}

      {isRateModalOpen && (
         <div className="modal" style={{ display: 'flex', zIndex: 1100 }}>
         <div className="modal-content" style={{ textAlign: 'left', maxWidth: '350px' }}>
           <h3 style={{ textAlign: 'center', marginTop: 0 }}>⚙️ 學期兌換率設定</h3>
           <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px' }}>設定自主學習時數兌換 1 學分所需的時數。大多數學校預設為 18 小時。</p>
           <div className="input-group">
             <label>每 N 小時兌換一學分</label>
             <input type="number" step="1" value={rateInput} onChange={e => setRateInput(e.target.value)} />
           </div>
           <button className="btn" style={{ width: '100%', background: 'var(--primary)' }} onClick={() => {
              const r = parseFloat(rateInput);
              if(!isNaN(r) && r > 0) {
                updateSelfStudyConversionRate(r);
                alert("設定成功");
                setIsRateModalOpen(false);
              } else {
                alert("請輸入大於 0 的有效數字！");
              }
           }}>💾 儲存</button>
           <button className="btn" style={{ width: '100%', marginTop: '10px', background: 'transparent', color: '#666', border: '1px solid #ddd' }} onClick={() => setIsRateModalOpen(false)}>取消</button>
         </div>
       </div>
      )}
    </div>
  );
}
