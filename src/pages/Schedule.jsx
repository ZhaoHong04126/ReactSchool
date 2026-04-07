import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

export default function Schedule({ switchTab }) {
  const { customPeriods, periodConfig, periodTimesConfig, getWeeklySchedule, updateWeeklySchedule } = useData();
  const [scheduleMode, setScheduleMode] = useState('daily');
  const [currentDay, setCurrentDay] = useState(new Date().getDay());
  const [isWeeklyEditMode, setIsWeeklyEditMode] = useState(false);
  const [selectionAnchor, setSelectionAnchor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Course form state
  const [editingIndices, setEditingIndices] = useState([]);
  const [formData, setFormData] = useState({
    pStart: '',
    pEnd: '',
    subject: '',
    room: '',
    teacher: '',
    color: '#ffffff'
  });

  const weeklySchedule = getWeeklySchedule();

  const getPeriodTimes = () => {
    const times = {};
    const { classDur, breakDur, startHash } = periodConfig;
    let [h, m] = startHash.split(':').map(Number);
    let currentMin = h * 60 + m;
    let zeroStart = currentMin - (classDur + breakDur);
    
    if (customPeriods.includes('0')) {
      times['0'] = {
        start: periodTimesConfig['0']?.start || formatTime(zeroStart),
        end: periodTimesConfig['0']?.end || formatTime(zeroStart + classDur)
      };
    }

    customPeriods.forEach(p => {
      if (p === '0') return;
      let pStart = formatTime(currentMin);
      let pEnd = formatTime(currentMin + classDur);
      times[p] = {
        start: periodTimesConfig[p]?.start || pStart,
        end: periodTimesConfig[p]?.end || pEnd
      };
      currentMin += classDur + breakDur;
    });
    return times;
  };

  const formatTime = (totalMinutes) => {
    let h = Math.floor(totalMinutes / 60);
    let m = totalMinutes % 60;
    if (h >= 24) h -= 24;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getDayName = (day) => {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return days[day] || '';
  };

  const handleEditCourse = (dayStr, startIndex) => {
    const todayData = weeklySchedule[dayStr] || [];
    const startItem = todayData[startIndex];
    if (!startItem) return;

    let indices = [startIndex];
    let currentPIndex = customPeriods.indexOf(startItem.period);
    let endPeriod = startItem.period;

    for (let i = startIndex + 1; i < todayData.length; i++) {
      const nextItem = todayData[i];
      const nextPIndex = customPeriods.indexOf(nextItem.period);

      if (nextPIndex === currentPIndex + 1 &&
          nextItem.subject === startItem.subject &&
          nextItem.room === startItem.room) {
        indices.push(i);
        endPeriod = nextItem.period;
        currentPIndex = nextPIndex;
      } else {
        break;
      }
    }

    setEditingIndices(indices);
    setFormData({
      pStart: startItem.period || '',
      pEnd: endPeriod || '',
      subject: startItem.subject || '',
      room: startItem.room || '',
      teacher: startItem.teacher || '',
      color: startItem.color || '#ffffff'
    });
    setIsModalOpen(true);
  };

  const handleAddSubmit = () => {
    let { pStart, pEnd, subject, room, teacher, color } = formData;
    pStart = pStart.trim();
    pEnd = pEnd.trim();
    if (!subject || !pStart) {
      alert('請至少輸入「科目」與「起始節次」');
      return;
    }

    const idxStart = customPeriods.indexOf(pStart);
    let idxEnd = pEnd ? customPeriods.indexOf(pEnd) : idxStart;

    if (idxStart === -1 || idxEnd === -1 || idxEnd < idxStart) {
      alert('節次名稱無效或結束早於起始');
      return;
    }

    let newSchedule = { ...weeklySchedule };
    if (!newSchedule[currentDay]) newSchedule[currentDay] = [];

    if (editingIndices.length > 0) {
      let sortedIndices = [...editingIndices].sort((a, b) => b - a);
      sortedIndices.forEach(idx => {
        newSchedule[currentDay].splice(idx, 1);
      });
    }

    const times = getPeriodTimes();
    for (let i = idxStart; i <= idxEnd; i++) {
      const p = customPeriods[i];
      newSchedule[currentDay].push({
        period: p,
        time: times[p]?.start || "",
        subject, room, teacher, color
      });
    }

    newSchedule[currentDay].sort((a, b) => {
      let idxA = customPeriods.indexOf(a.period);
      let idxB = customPeriods.indexOf(b.period);
      if (idxA === -1) idxA = 999;
      if (idxB === -1) idxB = 999;
      return idxA - idxB;
    });

    updateWeeklySchedule(newSchedule);
    closeModal();
  };

  const handleDeleteCourse = (dayStr, startIndex) => {
    if (!window.confirm('確定刪除這堂課嗎？')) return;
    const todayData = weeklySchedule[dayStr] || [];
    const startItem = todayData[startIndex];

    let indicesToDelete = [startIndex];
    let currentPIndex = customPeriods.indexOf(startItem.period);

    for (let i = startIndex + 1; i < todayData.length; i++) {
        const nextItem = todayData[i];
        const nextPIndex = customPeriods.indexOf(nextItem.period);
        if (nextPIndex === currentPIndex + 1 && nextItem.subject === startItem.subject && nextItem.room === startItem.room) {
            indicesToDelete.push(i);
            currentPIndex = nextPIndex;
        } else {
            break;
        }
    }

    let newSchedule = { ...weeklySchedule };
    indicesToDelete.sort((a, b) => b - a).forEach(idx => newSchedule[dayStr].splice(idx, 1));
    updateWeeklySchedule(newSchedule);
    if(isModalOpen) closeModal();
  };

  const handleWeeklyCellClick = (day, period, courseIndex = -1) => {
    if (!isWeeklyEditMode) {
      alert("目前為唯讀模式，請先開啟編輯模式");
      return;
    }
    setCurrentDay(day);

    if (courseIndex > -1) {
      handleEditCourse(day, courseIndex);
      setSelectionAnchor(null);
    } else {
      if (!selectionAnchor || selectionAnchor.day !== day) {
        setSelectionAnchor({ day, period });
      } else {
        const idxStart = customPeriods.indexOf(selectionAnchor.period);
        const idxCurrent = customPeriods.indexOf(period);
        let finalStart = idxStart <= idxCurrent ? selectionAnchor.period : period;
        let finalEnd = idxStart <= idxCurrent ? period : selectionAnchor.period;
        
        setFormData({ ...formData, pStart: finalStart, pEnd: finalEnd });
        setEditingIndices([]);
        setIsModalOpen(true);
        setSelectionAnchor(null);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIndices([]);
    setFormData({ pStart: '', pEnd: '', subject: '', room: '', teacher: '', color: '#ffffff' });
  };

  const renderDailySchedule = () => {
    const todayData = weeklySchedule[currentDay] || [];
    return (
      <div id="subview-sch-daily">
        <div className="card">
          <div className="week-tabs">
            {[1, 2, 3, 4, 5, 6, 0].map(day => (
              <button key={day} className={`tab-btn ${currentDay === day ? 'active' : ''}`} onClick={() => setCurrentDay(day)}>
                {getDayName(day)}
              </button>
            ))}
          </div>
          <h2>本日課程</h2>
          <table id="schedule-table">
            <thead>
              <tr>
                <th width="15%">節次</th>
                <th width="20%">時間</th>
                <th width="25%">科目</th>
                <th width="20%">地點</th>
                <th width="20%">老師</th>
              </tr>
            </thead>
            <tbody>
              {todayData.length === 0 ? (
                <tr><td colSpan="5" className="no-class" style={{textAlign: 'center', padding: '20px', color: '#999'}}>😴 無課程</td></tr>
              ) : (
                todayData.map((item, index) => {
                  const customColor = item.color && item.color !== '#ffffff' ? item.color : 'transparent';
                  return (
                    <tr key={index} style={{ borderLeft: customColor !== 'transparent' ? `5px solid ${customColor}` : '' }}>
                      <td style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{item.period}</td>
                      <td style={{ color: 'var(--text-sub)' }}>{item.time}</td>
                      <td style={{ fontWeight: 'bold' }}>{item.subject}</td>
                      <td><span style={{ background: 'var(--border)', color: 'var(--text-main)', padding: '2px 4px', borderRadius: '4px', fontSize: '0.8rem' }}>{item.room}</span></td>
                      <td style={{ fontSize: '0.85rem' }}>{item.teacher}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          <button className="btn btn-add" onClick={() => { setEditingIndices([]); setIsModalOpen(true); }}>+ 編輯本日課程</button>
        </div>
      </div>
    );
  };

  const renderWeeklySchedule = () => {
    const times = getPeriodTimes();
    let skipMap = new Set();
    const dayKeys = [1, 2, 3, 4, 5, 6, 0];

    return (
      <div id="subview-sch-weekly">
        <div className="card">
          <h2>📅 週課表
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-icon" onClick={() => { setIsWeeklyEditMode(!isWeeklyEditMode); setSelectionAnchor(null); }} style={{ fontSize: '0.9rem', background: isWeeklyEditMode ? '#e6f0ff' : 'transparent', border: `1px solid ${isWeeklyEditMode ? 'var(--primary)' : '#ddd'}`, color: isWeeklyEditMode ? 'var(--primary)' : '#888' }}>
                {isWeeklyEditMode ? '✏️ 編輯模式' : '🔒 唯讀模式'}
              </button>
            </div>
          </h2>
          <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '10px', WebkitOverflowScrolling: 'touch' }}>
            <table className="weekly-table">
              <thead>
                <tr>
                  <th style={{ width: '20px', background: '#f8f9fa' }}>節</th>
                  <th style={{ width: '42px', background: '#f8f9fa', fontSize: '0.85rem', color: '#666' }}>時間</th>
                  <th style={{ minWidth: '45px' }}>一</th>
                  <th style={{ minWidth: '45px' }}>二</th>
                  <th style={{ minWidth: '45px' }}>三</th>
                  <th style={{ minWidth: '45px' }}>四</th>
                  <th style={{ minWidth: '45px' }}>五</th>
                  <th style={{ minWidth: '45px', color: '#e74c3c' }}>六</th>
                  <th style={{ minWidth: '45px', color: '#e74c3c' }}>日</th>
                </tr>
              </thead>
              <tbody>
                {customPeriods.map((p, pIndex) => (
                  <tr key={p}>
                    <td style={{ fontWeight: 'bold', background: '#f4f7f6', color: '#555', textAlign: 'center', verticalAlign: 'middle' }}>{p}</td>
                    <td style={{ fontSize: '0.75rem', color: '#888', background: '#f4f7f6', textAlign: 'center', verticalAlign: 'middle', lineHeight: '1.2' }}>
                      {times[p]?.start}<br/>~<br/>{times[p]?.end}
                    </td>
                    {dayKeys.map(day => {
                      if (skipMap.has(`${day}-${p}`)) return null;

                      const dayCourses = weeklySchedule[day] || [];
                      const courseIndex = dayCourses.findIndex(c => c.period === p);
                      const course = dayCourses[courseIndex];

                      if (course) {
                        let spanCount = 1;
                        for (let nextI = pIndex + 1; nextI < customPeriods.length; nextI++) {
                          const nextP = customPeriods[nextI];
                          const nextCourse = dayCourses.find(c => c.period === nextP);
                          if (nextCourse && nextCourse.subject === course.subject && nextCourse.room === course.room) {
                            spanCount++;
                            skipMap.add(`${day}-${nextP}`);
                          } else {
                            break;
                          }
                        }

                        let bgColor = course.color && course.color !== '#ffffff' ? course.color : '#fff3e0';
                        return (
                          <td key={day} rowSpan={spanCount} onClick={() => handleWeeklyCellClick(day, p, courseIndex)} style={{ cursor: isWeeklyEditMode ? 'pointer' : 'default', background: bgColor, padding: '4px', textAlign: 'center', verticalAlign: 'middle', border: '1px solid #eee' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#333', lineHeight: '1.2' }}>{course.subject}</div>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>{course.room || ''}</div>
                          </td>
                        );
                      } else {
                        const isSelected = selectionAnchor && selectionAnchor.day === day && selectionAnchor.period === p;
                        return (
                          <td key={day} onClick={() => handleWeeklyCellClick(day, p)} style={{ cursor: isWeeklyEditMode ? 'pointer' : 'default', border: '1px solid #f9f9f9', background: isSelected ? 'rgba(74,144,226,0.2)' : 'transparent' }}></td>
                        );
                      }
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectionAnchor && <div style={{textAlign: 'center', padding: '10px', color: 'var(--primary)', fontWeight: 'bold'}}>已選取週{getDayName(selectionAnchor.day)}第 {selectionAnchor.period} 節，請點選「結束節次」</div>}
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!isModalOpen) return null;
    const todayData = weeklySchedule[currentDay] || [];
    
    return (
      <div className="modal" style={{ display: 'flex' }}>
        <div className="modal-content" style={{ textAlign: 'left' }}>
          <h3 style={{ textAlign: 'center', marginTop: 0 }}>✏️ 編輯課程 ({getDayName(currentDay)})</h3>
          
          <div style={{ marginBottom: '20px', maxHeight: '150px', overflowY: 'auto' }}>
            {todayData.length === 0 ? <p style={{ color: '#999', textAlign: 'center' }}>無課程</p> : 
              todayData.map((item, idx) => (
                <div key={idx} className="course-list-item" style={{display:'flex', justifyContent:'space-between', padding:'8px', borderBottom:'1px solid #eee'}}>
                  <div>
                    <div style={{fontWeight:'bold'}}>[{item.period}] {item.subject}</div>
                    <div style={{fontSize:'0.8rem', color:'#666'}}>{item.time} {item.room ? `@${item.room}` : ''}</div>
                  </div>
                  <div style={{display:'flex', gap:'5px', alignItems:'center'}}>
                    <button onClick={() => handleEditCourse(currentDay, idx)} style={{padding:'2px 8px', fontSize:'0.8rem'}}>修改</button>
                    <button onClick={() => {
                        if (switchTab) switchTab('grade-calc');
                        closeModal();
                    }} style={{padding:'2px 8px', fontSize:'0.8rem', background:'#e8f5e9', color:'#2e7d32', border:'1px solid #2e7d32'}}>🧮 配分筆記</button>
                    <button onClick={() => handleDeleteCourse(currentDay, idx)} style={{padding:'2px 8px', fontSize:'0.8rem', background:'#ffebee', color:'#e74c3c', border:'1px solid #e74c3c'}}>刪除</button>
                  </div>
                </div>
              ))
            }
          </div>
          <hr style={{ border: 0, borderTop: '1px dashed #ddd', margin: '15px 0' }} />
          
          <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary)' }}>新增一堂課(至少輸入科目與時間)</h4>
          <div className="input-group">
            <label>節次區間 (起始 - 結束)</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="text" value={formData.pStart} onChange={e => setFormData({...formData, pStart: e.target.value})} className="login-input" placeholder="起始 (如: 1)" style={{ flex: 1, marginBottom: 0, textAlign: 'center' }} />
              <span style={{ color: '#999', fontWeight: 'bold' }}>至</span>
              <input type="text" value={formData.pEnd} onChange={e => setFormData({...formData, pEnd: e.target.value})} className="login-input" placeholder="結束 (如: 3)" style={{ flex: 1, marginBottom: 0, textAlign: 'center' }} />
            </div>
          </div>
          <div className="input-group">
            <label>科目</label>
            <input type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="輸入科目..." />
          </div>
          <div className="input-group">
            <label>地點</label>
            <input type="text" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} placeholder="輸入地點..." />
          </div>
          <div className="input-group">
            <label>老師</label>
            <input type="text" value={formData.teacher} onChange={e => setFormData({...formData, teacher: e.target.value})} placeholder="輸入老師..." />
          </div>
          <div className="input-group">
            <label>標記顏色 (選填)</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px', flexWrap: 'wrap' }}>
              {['#ffffff', '#ffcdd2', '#ffe0b2', '#fff9c4', '#c8e6c9', '#bbdefb', '#e1bee7'].map(c => (
                <div key={c} onClick={() => setFormData({...formData, color: c})} className={`color-swatch ${formData.color === c ? 'selected' : ''}`} style={{ background: c, border: '1px solid #ddd', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer', ...formData.color === c ? {border: '2px solid var(--primary)', transform: 'scale(1.1)'} : {} }}></div>
              ))}
            </div>
          </div>

          <button className="btn" style={{ width: '100%', background: editingIndices.length ? '#f39c12' : '#333' }} onClick={handleAddSubmit}>
            {editingIndices.length ? "💾 保存修改" : "+ 加入清單"}
          </button>
          <button className="btn" style={{ width: '100%', marginTop: '10px', background: 'transparent', color: '#666', border: '1px solid #ddd' }} onClick={closeModal}>關閉</button>
        </div>
      </div>
    );
  };

  return (
    <div id="view-schedule">
      <div className="week-tabs" style={{ marginBottom: '20px' }}>
        <button className={`tab-btn ${scheduleMode === 'daily' ? 'active' : ''}`} onClick={() => setScheduleMode('daily')}>📅 本日課程</button>
        <button className={`tab-btn ${scheduleMode === 'weekly' ? 'active' : ''}`} onClick={() => setScheduleMode('weekly')}>🗓️ 週課表</button>
      </div>

      {scheduleMode === 'daily' ? renderDailySchedule() : renderWeeklySchedule()}
      {renderModal()}
    </div>
  );
}
