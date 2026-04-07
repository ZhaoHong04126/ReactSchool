import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';

export default function Homework() {
  const { getHomeworkList, updateHomeworkList, getWeeklySchedule } = useData();
  const homeworkList = getHomeworkList();
  const weeklySchedule = getWeeklySchedule();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [isManualInput, setIsManualInput] = useState(false);

  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    score: '',
    total: 100
  });

  const subjects = useMemo(() => {
    const list = new Set();
    Object.values(weeklySchedule).forEach(day => {
      day.forEach(c => {
        if (c.subject) list.add(c.subject);
      });
    });
    return Array.from(list);
  }, [weeklySchedule]);

  const totalCount = homeworkList.length;
  const completedCount = homeworkList.filter(hw => hw.completed).length;

  const sortedList = useMemo(() => {
    return [...homeworkList].map((item, originalIndex) => ({ item, originalIndex }))
      .sort((a, b) => {
        if (a.item.completed !== b.item.completed) return a.item.completed ? 1 : -1;
        return new Date(a.item.date) - new Date(b.item.date);
      });
  }, [homeworkList]);

  const handleOpenModal = (index = -1) => {
    setEditingIndex(index);
    if (index > -1) {
      const item = homeworkList[index];
      const isCustomSubj = !subjects.includes(item.subject);
      setIsManualInput(isCustomSubj);
      setFormData({
        subject: item.subject,
        title: item.title,
        date: item.date,
        score: item.score || '',
        total: item.total || 100
      });
    } else {
      setIsManualInput(false);
      setFormData({
        subject: '',
        title: '',
        date: new Date().toISOString().split('T')[0],
        score: '',
        total: 100
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const { subject, title, date, score, total } = formData;
    if (!subject || !title || !date) {
      alert("請輸入科目、作業名稱與日期");
      return;
    }

    const hwData = {
      subject,
      title,
      date,
      score: score,
      total: total || 100,
      completed: editingIndex > -1 ? homeworkList[editingIndex].completed : false
    };

    const newList = [...homeworkList];
    if (editingIndex > -1) {
      newList[editingIndex] = hwData;
      alert("作業修改成功！");
    } else {
      newList.push(hwData);
      alert("作業已新增！");
    }

    updateHomeworkList(newList);
    setIsModalOpen(false);
  };

  const handleDelete = (index) => {
    if (window.confirm("確定要刪除這項作業嗎？")) {
      const newList = [...homeworkList];
      newList.splice(index, 1);
      updateHomeworkList(newList);
      if (editingIndex === index) setIsModalOpen(false);
    }
  };

  const toggleStatus = (index) => {
    const newList = [...homeworkList];
    newList[index] = { ...newList[index], completed: !newList[index].completed };
    updateHomeworkList(newList);
  };

  return (
    <div id="view-homework">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ margin: 0, border: 'none' }}>🎒 作業成績</h2>
          <div id="homework-summary" style={{ fontSize: '0.85rem', color: '#666' }}>
            <span style={{ marginRight: '15px' }}>總計: <b>{totalCount}</b></span>
            <span style={{ color: '#2ecc71' }}>完成: <b>{completedCount}</b></span> /{" "}
            <span style={{ color: '#e74c3c' }}>未完: <b>{totalCount - completedCount}</b></span>
          </div>
        </div>

        <div id="homework-list" style={{ minHeight: '200px' }}>
          {sortedList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎒</div>
              <p>目前沒有作業<br />享受自由的時光吧！</p>
            </div>
          ) : (
            sortedList.map(({ item, originalIndex }) => {
              const statusColor = item.completed ? '#2ecc71' : '#e74c3c';
              const cardOpacity = item.completed ? 0.7 : 1;
              const decoration = item.completed ? 'line-through' : 'none';
              const icon = item.completed ? '✅' : '⬜';

              return (
                <div key={originalIndex} className="card" style={{ marginBottom: '12px', padding: '15px', borderLeft: `5px solid ${statusColor}`, opacity: cardOpacity }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleOpenModal(originalIndex)}>
                      <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '4px' }}>
                        {item.date} • <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{item.subject}</span>
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)', textDecoration: decoration, marginBottom: '5px' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        分數: <span style={{ fontWeight: 'bold', color: '#333' }}>{item.score || '-'}</span> / {item.total || 100}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                      <button onClick={(e) => { e.stopPropagation(); toggleStatus(originalIndex); }} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} title="切換狀態">
                        {icon}
                      </button>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(originalIndex); }} style={{ background: 'transparent', border: 'none', color: '#f39c12', cursor: 'pointer', fontSize: '0.9rem' }}>✏️</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(originalIndex); }} style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '0.9rem' }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button className="btn btn-add" onClick={() => handleOpenModal(-1)}>+ 新增作業</button>
      </div>

      {isModalOpen && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ textAlign: 'left' }}>
            <h3 style={{ textAlign: 'center', marginTop: 0 }}>{editingIndex > -1 ? '✏️ 編輯作業' : '🎒 新增作業'}</h3>
            <div className="input-group">
              <label>科目</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {isManualInput ? (
                  <input type="text" placeholder="手寫輸入科目名稱..." value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} style={{ flex: 1 }} />
                ) : (
                  <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} style={{ flex: 1 }}>
                    <option value="" disabled>請選擇科目</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
                <button type="button" onClick={() => setIsManualInput(!isManualInput)} style={{ padding: '8px', border: '1px solid #ddd', background: '#f5f5f5', borderRadius: '4px', cursor: 'pointer' }}>
                  {isManualInput ? "📜" : "✏️"}
                </button>
              </div>
            </div>
            <div className="input-group">
              <label>作業/小考名稱</label>
              <input type="text" placeholder="例如：期中報告、第一章小考" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="input-group">
              <label>繳交期限 / 考試日期</label>
              <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div className="input-group" style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label>獲得分數 (選填)</label>
                <input type="number" step="0.1" placeholder="得分" value={formData.score} onChange={e => setFormData({ ...formData, score: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label>滿分 (預設 100)</label>
                <input type="number" step="1" placeholder="滿分" value={formData.total} onChange={e => setFormData({ ...formData, total: e.target.value })} />
              </div>
            </div>
            <button className="btn" style={{ width: '100%', background: editingIndex > -1 ? '#f39c12' : 'var(--primary)' }} onClick={handleSave}>
              {editingIndex > -1 ? '💾 儲存修改' : '+ 儲存'}
            </button>
            <button className="btn" style={{ width: '100%', marginTop: '10px', background: 'transparent', color: '#666', border: '1px solid #ddd' }} onClick={() => setIsModalOpen(false)}>取消</button>
          </div>
        </div>
      )}
    </div>
  );
}
