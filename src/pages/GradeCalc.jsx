import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';

export default function GradeCalc() {
  const { getGradeCalcNotes, updateGradeCalcNotes, getWeeklySchedule } = useData();
  const notes = getGradeCalcNotes();
  const weeklySchedule = getWeeklySchedule();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [isManualInput, setIsManualInput] = useState(false);
  
  const [subject, setSubject] = useState('');
  const [formulas, setFormulas] = useState([{ name: '', weight: '' }]);
  const [remarks, setRemarks] = useState(['']);

  const subjects = useMemo(() => {
    const list = new Set();
    Object.values(weeklySchedule).forEach(day => {
      day.forEach(c => {
        if (c.subject) list.add(c.subject);
      });
    });
    return Array.from(list);
  }, [weeklySchedule]);

  const toggleEditMode = () => {
    if (!isEditMode) {
      if (window.confirm("確定要開啟編輯模式嗎？\n\n開啟後您可以新增、修改或刪除計算筆記。")) {
        setIsEditMode(true);
      }
    } else {
      setIsEditMode(false);
    }
  };

  const handleOpenModal = (index = -1) => {
    setEditingIndex(index);
    if (index > -1) {
      const item = notes[index];
      const isCustomSubj = !subjects.includes(item.subject);
      setIsManualInput(isCustomSubj);
      setSubject(item.subject || '');

      const parsedFormulas = item.formula ? item.formula.split('\n').map(f => {
        const parts = f.split('||');
        return { name: parts[0] || '', weight: parts[1] || '' };
      }) : [];
      // Ensure at least 3 rows
      while (parsedFormulas.length < 3) {
        parsedFormulas.push({ name: '', weight: '' });
      }
      setFormulas(parsedFormulas);

      const parsedRemarks = item.remark ? item.remark.split('\n') : [];
      if (parsedRemarks.length === 0) parsedRemarks.push('');
      setRemarks(parsedRemarks);
    } else {
      setIsManualInput(false);
      setSubject('');
      setFormulas([
        { name: '平時作業', weight: '30%' },
        { name: '期中考', weight: '30%' },
        { name: '期末考', weight: '40%' }
      ]);
      setRemarks(['']);
    }
    setIsModalOpen(true);
  };

  const addFormulaRow = () => setFormulas([...formulas, { name: '', weight: '' }]);
  const addRemarkRow = () => setRemarks([...remarks, '']);

  const handleSave = () => {
    const sub = subject.trim();
    const validFormulas = formulas.filter(f => f.name.trim() !== '' || f.weight.trim() !== '');
    const validRemarks = remarks.map(r => r.trim()).filter(r => r !== '');

    if (!sub || validFormulas.length === 0) {
      alert("請填寫「科目」並至少輸入一項「項目或配分」！");
      return;
    }

    const noteData = {
      subject: sub,
      formula: validFormulas.map(f => `${f.name.trim()}||${f.weight.trim()}`).join('\n'),
      remark: validRemarks.join('\n')
    };

    const newList = [...notes];
    if (editingIndex > -1) {
      newList[editingIndex] = noteData;
      alert("計算筆記已更新！");
    } else {
      newList.push(noteData);
      alert("計算筆記已新增！");
    }

    updateGradeCalcNotes(newList);
    setIsModalOpen(false);
  };

  const handleDelete = (index) => {
    if (!isEditMode) return;
    if (window.confirm("確定要刪除這則計算筆記嗎？")) {
      const newList = [...notes];
      newList.splice(index, 1);
      updateGradeCalcNotes(newList);
    }
  };

  return (
    <div id="view-grade-calc">
      <div className="card">
        <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🧮 配分筆記</span>
          <button onClick={toggleEditMode} style={{ fontSize: '0.85rem', background: isEditMode ? '#e6f0ff' : 'transparent', border: `1px solid ${isEditMode ? 'var(--primary)' : '#ddd'}`, color: isEditMode ? 'var(--primary)' : '#888', transition: 'all 0.3s', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
            {isEditMode ? '✏️ 編輯模式' : '🔒 唯讀模式'}
          </button>
        </h2>

        <div id="grade-calc-list">
          {notes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🧮</div>
              <p>目前沒有成績計算筆記<br />把各科的配分方式記下來吧！</p>
            </div>
          ) : (
            notes.map((item, index) => {
              const parsedFormulas = item.formula ? item.formula.split('\n').map(f => f.split('||')) : [];
              const parsedRemarks = item.remark ? item.remark.split('\n') : [];

              return (
                <div key={index} className="card" style={{ marginBottom: '12px', padding: '15px', borderLeft: '5px solid #9b59b6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '8px' }}>
                        {item.subject}
                      </div>
                      <div style={{ marginBottom: '5px', background: '#f9f9f9', padding: '10px', borderRadius: '6px', border: '1px solid #eee' }}>
                        {parsedFormulas.map((parts, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'white', border: '1px solid #ddd', borderRadius: '4px', padding: '6px 10px', marginBottom: '5px', fontSize: '0.9rem', color: '#555' }}>
                            <span>{parts[0]}</span>
                            {parts[1] && <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{parts[1]}</span>}
                          </div>
                        ))}
                      </div>
                      {parsedRemarks.map((r, i) => r && <div key={i} style={{ fontSize: '0.85rem', color: '#888', marginTop: '6px' }}>💡 {r}</div>)}
                    </div>
                    {isEditMode && (
                      <div style={{ display: 'flex', gap: '5px', marginLeft: '10px', flexDirection: 'column' }}>
                        <button onClick={() => handleOpenModal(index)} style={{ background: 'transparent', border: 'none', color: '#f39c12', cursor: 'pointer', fontSize: '1rem', padding: '4px' }}>✏️</button>
                        <button onClick={() => handleDelete(index)} style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '1rem', padding: '4px' }}>🗑️</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button className="btn btn-add" onClick={() => handleOpenModal(-1)}>+ 新增計算筆記</button>
      </div>

      {isModalOpen && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ textAlign: 'left', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ textAlign: 'center', marginTop: 0 }}>{editingIndex > -1 ? '✏️ 編輯計算筆記' : '➕ 新增計算筆記'}</h3>
            
            <div className="input-group">
              <label>科目</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {isManualInput ? (
                  <input type="text" placeholder="手寫輸入科目名稱..." value={subject} onChange={e => setSubject(e.target.value)} style={{ flex: 1 }} />
                ) : (
                  <select value={subject} onChange={e => setSubject(e.target.value)} style={{ flex: 1 }}>
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
              <label>配分項目</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {formulas.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="項目名稱" value={f.name} onChange={e => { const updated = [...formulas]; updated[i].name = e.target.value; setFormulas(updated); }} style={{ flex: 2 }} />
                    <input type="text" placeholder="配分" value={f.weight} onChange={e => { const updated = [...formulas]; updated[i].weight = e.target.value; setFormulas(updated); }} style={{ flex: 1 }} />
                  </div>
                ))}
              </div>
              <button onClick={addFormulaRow} style={{ marginTop: '10px', background: 'transparent', border: '1px dashed var(--primary)', color: 'var(--primary)', padding: '6px', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>+ 增加一項</button>
            </div>

            <div className="input-group">
              <label>補充紀錄</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {remarks.map((r, i) => (
                  <input key={i} type="text" placeholder="補充說明 (選填)..." value={r} onChange={e => { const updated = [...remarks]; updated[i] = e.target.value; setRemarks(updated); }} style={{ width: '100%' }} />
                ))}
              </div>
              <button onClick={addRemarkRow} style={{ marginTop: '10px', background: 'transparent', border: '1px dashed #aaa', color: '#666', padding: '6px', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>+ 新增行</button>
            </div>

            <button className="btn" style={{ width: '100%', background: editingIndex > -1 ? '#f39c12' : 'var(--primary)', marginTop: '10px' }} onClick={handleSave}>
              {editingIndex > -1 ? '💾 儲存修改' : '+ 儲存'}
            </button>
            <button className="btn" style={{ width: '100%', marginTop: '10px', background: 'transparent', color: '#666', border: '1px solid #ddd' }} onClick={() => setIsModalOpen(false)}>取消</button>
          </div>
        </div>
      )}
    </div>
  );
}
