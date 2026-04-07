import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';

const taiwanHolidays = [
  { date: "2026-01-01", title: "元旦", isAllDay: true, isSystemHoliday: true },
  { date: "2026-02-14", endDate: "2026-02-22", title: "農曆春節連假", isAllDay: true, isSystemHoliday: true },
  { date: "2026-02-27", endDate: "2026-03-01", title: "和平紀念日", isAllDay: true, isSystemHoliday: true },
  { date: "2026-04-03", endDate: "2026-04-06", title: "兒童節及清明節連假", isAllDay: true, isSystemHoliday: true },
  { date: "2026-05-01", endDate: "2026-05-03", title: "勞動節連假", isAllDay: true, isSystemHoliday: true },
  { date: "2026-06-19", endDate: "2026-06-21", title: "端午節連假", isAllDay: true, isSystemHoliday: true },
  { date: "2026-09-25", endDate: "2026-09-28", title: "中秋節及教師節連假", isAllDay: true, isSystemHoliday: true },
  { date: "2026-10-09", endDate: "2026-10-11", title: "國慶日連假", isAllDay: true, isSystemHoliday: true },
  { date: "2026-10-24", endDate: "2026-10-26", title: "光復節連假", isAllDay: true, isSystemHoliday: true },
  { date: "2026-12-25", endDate: "2026-12-27", title: "行憲紀念日連假", isAllDay: true, isSystemHoliday: true }
];

export default function Calendar() {
  const { getCalendarEvents, updateCalendarEvents, getSelfStudyActivities } = useData();
  const [currentTab, setCurrentTab] = useState('month');
  const [calCurrentDate, setCalCurrentDate] = useState(new Date());
  const [isCalendarEditMode, setIsCalendarEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [editingIndex, setEditingIndex] = useState(-1);
  const [formData, setFormData] = useState({
    date: '', endDate: '', title: '', isAllDay: true, startTime: '', endTime: ''
  });

  const calendarEvents = getCalendarEvents();
  const selfStudyActivities = getSelfStudyActivities();

  const changeMonth = (offset) => {
    setCalCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + offset);
      return d;
    });
  };

  const goToToday = () => setCalCurrentDate(new Date());

  const handleOpenModal = (dateStr = '', index = -1) => {
    if ((dateStr || index > -1) && !isCalendarEditMode) {
      if (window.confirm("目前為「🔒 唯讀模式」\n確定要開啟「✏️ 編輯模式」並新增/修改活動嗎？")) {
        setIsCalendarEditMode(true);
      } else {
        return;
      }
    }

    setEditingIndex(index);
    if (index > -1) {
      const item = calendarEvents[index];
      setFormData({
        date: item.date, endDate: item.endDate || '', title: item.title,
        isAllDay: item.isAllDay, startTime: item.startTime || '', endTime: item.endTime || ''
      });
    } else {
      setFormData({
        date: dateStr || new Date().toISOString().split('T')[0], endDate: '', title: '',
        isAllDay: true, startTime: '', endTime: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveEvent = () => {
    const { date, endDate, title, isAllDay, startTime, endTime } = formData;
    if (!date || !title) return alert("請至少輸入起始日期與名稱");
    if (endDate && endDate < date) return alert("結束日期不能早於起始日期！");
    if (!isAllDay && !startTime) return alert("請輸入開始時間");

    const eventData = { 
        date, endDate: endDate || null, title, isAllDay,
        startTime: isAllDay ? null : startTime, endTime: isAllDay ? null : endTime
    };

    const newList = [...calendarEvents];
    if (editingIndex > -1) {
      newList[editingIndex] = eventData;
      alert("活動已更新！");
    } else {
      newList.push(eventData);
      alert("活動已新增！");
    }

    updateCalendarEvents(newList);
    setIsModalOpen(false);
  };

  const handleDeleteEvent = (index) => {
    if (window.confirm("確定刪除此活動？")) {
      const newList = [...calendarEvents];
      newList.splice(index, 1);
      updateCalendarEvents(newList);
      if (editingIndex === index) setIsModalOpen(false);
    }
  };

  const allEvents = useMemo(() => {
    const userEvents = calendarEvents.map((e, i) => ({ ...e, _originalIndex: i, isUserEvent: true }));
    const selfStudyGridEvents = selfStudyActivities.map((e, i) => ({
      date: e.date, title: `🏃 ${e.name}`, isAllDay: true, isSelfStudyEvent: true, _selfStudyIndex: i
    }));
    
    const combined = [...userEvents, ...selfStudyGridEvents, ...taiwanHolidays];
    combined.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
      const endA = a.endDate ? new Date(a.endDate) : dateA;
      const endB = b.endDate ? new Date(b.endDate) : dateB;
      return (endB - endA); 
    });
    return combined;
  }, [calendarEvents, selfStudyActivities]);

  const renderMonthGrid = () => {
    const year = calCurrentDate.getFullYear();
    const month = calCurrentDate.getMonth(); 

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let gridHtml = [];
    for (let i = 0; i < firstDay; i++) {
      gridHtml.push(<div key={`empty-${i}`} className="cal-day cal-other-month"></div>);
    }

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = isCurrentMonth && today.getDate() === d;
      const mStr = (month + 1).toString().padStart(2, '0');
      const dStr = d.toString().padStart(2, '0');
      const currentDateStr = `${year}-${mStr}-${dStr}`;
      const currentDayOfWeek = new Date(year, month, d).getDay();

      const dayEvents = allEvents.filter(e => {
        const start = e.date; 
        const end = e.endDate || e.date;
        return currentDateStr >= start && currentDateStr <= end;
      });

      let eventsHtml = dayEvents.map((e, idx) => {
        const isStart = (e.date === currentDateStr);
        const isEnd = (!e.endDate || e.endDate === currentDateStr || e.endDate < currentDateStr);

        const onClick = (ev) => {
          ev.stopPropagation();
          if (e.isUserEvent) handleOpenModal('', e._originalIndex);
          else if (e.isSelfStudyEvent && isCalendarEditMode) alert("若要修改自主學習，請至「自主學習」模組中修改。"); 
        };

        if (e.isAllDay || e.endDate) {
          let classes = "cal-event-bar ";
          let inlineStyle = { backgroundColor: e.isSystemHoliday ? "#1565c0" : undefined };

          if (isStart && isEnd) {
            classes += "single ";
            if (!e.isAllDay && e.startTime && e.endTime) {
              const [sh, sm] = e.startTime.split(':').map(Number);
              const startPct = Math.min(85, ((sh * 60 + sm) / 1440) * 100);
              const [eh, em] = e.endTime.split(':').map(Number);
              const endPct = Math.min(85, 100 - (((eh * 60 + em) / 1440) * 100));
              inlineStyle.marginLeft = `${startPct}%`;
              inlineStyle.width = `max(12%, calc(100% - ${startPct}% - ${endPct}%))`;
            }
          } 
          else if (isStart) {
            classes += "start connect-right ";
            if (!e.isAllDay && e.startTime) {
              const [h, m] = e.startTime.split(':').map(Number);
              const percent = Math.min(85, ((h * 60 + m) / 1440) * 100);
              inlineStyle.marginLeft = `${percent}%`;
            }
          } 
          else if (isEnd) {
            classes += "end connect-left ";
            if (!e.isAllDay && e.endTime) {
              const [h, m] = e.endTime.split(':').map(Number);
              const percent = Math.min(85, 100 - (((h * 60 + m) / 1440) * 100));
              inlineStyle.marginRight = `${percent}%`;
            }
          } 
          else {
            classes += "middle connect-left connect-right ";
          }

          let showText = false;
          let text = "";
          let align = "left";

          if (isStart && isEnd) {
            showText = true;
            let timePrefix = (!e.isAllDay && e.startTime) ? `${e.startTime} ` : '';
            text = timePrefix + e.title;
          } else {
            const [sy, sm, sd] = e.date.split('-').map(Number);
            const [ey, em, ed] = (e.endDate || e.date).split('-').map(Number);
            const [cy, cm, cd] = currentDateStr.split('-').map(Number);
            const startMs = Date.UTC(sy, sm - 1, sd);
            const endMs = Date.UTC(ey, em - 1, ed);
            const currentMs = Date.UTC(cy, cm - 1, cd);

            const totalDays = Math.round((endMs - startMs) / 86400000) + 1;
            const currentDayIndex = Math.round((currentMs - startMs) / 86400000);
            const middleIndex = Math.floor((totalDays - 1) / 2);

            if (e.isAllDay) {
              if (isStart || currentDayOfWeek === 0) {
                showText = true; text = e.title;
              }
            } else {
              if (currentDayIndex === 0) {
                showText = true; text = e.startTime ? e.startTime : e.title;
                if (totalDays === 2 && e.startTime) text += " " + e.title;
              }
              if (totalDays > 2 && currentDayIndex === middleIndex) {
                showText = true; text = e.title; align = "center";
              }
              if (currentDayIndex === totalDays - 1 && e.endTime) {
                showText = true; text = e.endTime; align = "right";
              }
              if (currentDayOfWeek === 0 && !showText && currentDayIndex !== totalDays - 1) {
                showText = true; text = e.title;
              }
            }
          }

          if (showText && text !== "") {
            classes += " show-text ";
            if (align === "center") inlineStyle.textAlign = "center";
            if (align === "right") inlineStyle.textAlign = "right";
          }
          
          return <div key={`${e.title}-${idx}`} className={classes} style={inlineStyle} onClick={onClick} title={e.title}>{showText ? text : '\u00A0'}</div>;
        } else {
          let timeStr = e.startTime ? e.startTime.replace(':','') : '';
          const dotStyle = e.isSystemHoliday ? { backgroundColor: '#1565c0' } : {};
          const textStyle = e.isSystemHoliday ? { color: '#1565c0', fontWeight: 'bold' } : {};
          return (
            <div key={`${e.title}-${idx}`} className="cal-event-time" onClick={onClick} title={e.title} style={textStyle}>
               <span className="time-dot" style={dotStyle}></span><span style={{ fontWeight: 'bold', marginRight: '4px' }}>{timeStr}</span>{e.title}
            </div>
          );
        }
      });

      gridHtml.push(
        <div key={`day-${d}`} className={`cal-day ${isToday ? 'cal-today' : ''}`} onClick={() => handleOpenModal(currentDateStr)}>
           <div className="cal-date-num">{d}</div>
           <div className="cal-events-wrapper">{eventsHtml}</div>
        </div>
      );
    }

    return gridHtml;
  };

  const listEvents = useMemo(() => {
    const list = [...allEvents];
    list.sort((a, b) => {
      const dateA = new Date(a.date + (a.startTime && !a.isAllDay ? 'T' + a.startTime : 'T00:00'));
      const dateB = new Date(b.date + (b.startTime && !b.isAllDay ? 'T' + b.startTime : 'T00:00'));
      return dateA - dateB;
    });
    return list.filter(e => !e.isSystemHoliday); // usually skip default holidays in list view for brevity, or include them? Original code included self study and user events only in calendar.js line 129
  }, [allEvents]);

  // Actually, original code only showed userEvents and selfStudyEvents in list view.
  const customListEvents = useMemo(() => {
    const userEvents = calendarEvents.map((e, i) => ({ ...e, _originalIndex: i, isUserEvent: true }));
    const selfStudyGridEvents = selfStudyActivities.map((e, i) => ({
      date: e.date, title: `🏃 ${e.name}`, isAllDay: true, isSelfStudyEvent: true, _selfStudyIndex: i
    }));
    const all = [...userEvents, ...selfStudyGridEvents];
    all.sort((a, b) => {
        const dateA = new Date(a.date + (a.startTime && !a.isAllDay ? 'T' + a.startTime : 'T00:00'));
        const dateB = new Date(b.date + (b.startTime && !b.isAllDay ? 'T' + b.startTime : 'T00:00'));
        return dateA - dateB;
    });
    return all;
  }, [calendarEvents, selfStudyActivities]);

  return (
    <div id="view-calendar">
      <div className="week-tabs" style={{ marginBottom: '20px' }}>
        <button className={`tab-btn ${currentTab === 'month' ? 'active' : ''}`} onClick={() => setCurrentTab('month')}>🗓️ 月曆視圖</button>
        <button className={`tab-btn ${currentTab === 'list' ? 'active' : ''}`} onClick={() => setCurrentTab('list')}>📝 列表視圖</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <button className="btn-icon" onClick={() => setIsCalendarEditMode(!isCalendarEditMode)} style={{ fontSize: '0.85rem', background: isCalendarEditMode ? '#e6f0ff' : 'transparent', border: `1px solid ${isCalendarEditMode ? 'var(--primary)' : '#ddd'}`, color: isCalendarEditMode ? 'var(--primary)' : '#888', padding: '6px 12px' }}>
          {isCalendarEditMode ? '✏️ 編輯模式' : '🔒 唯讀模式'}
        </button>
      </div>

      {currentTab === 'month' && (
        <div id="subview-cal-month" className="card" style={{ padding: '20px 10px', touchAction: 'pan-y' }}>
          <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '0 10px' }}>
             <button className="btn-icon" onClick={() => changeMonth(-1)} style={{ padding: '6px 10px', fontSize: '1rem', border: '1px solid #ddd' }}>&lt;</button>
             <h2 id="calendar-month-year" style={{ margin: 0, border: 'none', padding: 0 }}>
               {calCurrentDate.getFullYear()}年 {calCurrentDate.getMonth() + 1}月
             </h2>
             <button className="btn-icon" onClick={() => changeMonth(1)} style={{ padding: '6px 10px', fontSize: '1rem', border: '1px solid #ddd' }}>&gt;</button>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
             <span onClick={goToToday} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', padding: '5px 10px', borderRadius: '15px', background: '#e6f0ff' }}>返回今日</span>
          </div>
          <div id="calendar-grid" className="calendar-grid">
            <div className="cal-day-header" style={{ color: '#e74c3c' }}>日</div>
            <div className="cal-day-header">一</div>
            <div className="cal-day-header">二</div>
            <div className="cal-day-header">三</div>
            <div className="cal-day-header">四</div>
            <div className="cal-day-header">五</div>
            <div className="cal-day-header" style={{ color: '#e74c3c' }}>六</div>
            {renderMonthGrid()}
          </div>
          {isCalendarEditMode && <button className="btn btn-add" onClick={() => handleOpenModal()} style={{ marginTop: '20px' }}>+ 新增活動</button>}
        </div>
      )}

      {currentTab === 'list' && (
        <div id="subview-cal-list" className="card" style={{ padding: '20px' }}>
          <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #f4f7f6', paddingBottom: '10px' }}>📝 近期活動列表</h2>
          <div id="calendar-list">
            {customListEvents.length === 0 ? <p style={{ color: '#999', textAlign: 'center' }}>😴 目前無活動</p> :
              customListEvents.map((event, idx) => {
                const endDateCheck = event.endDate ? new Date(event.endDate) : new Date(event.date);
                const isPast = endDateCheck < new Date().setHours(0,0,0,0);
                
                let timeBadge = '';
                if (!event.isAllDay && event.startTime) {
                  timeBadge = <span style={{ background: '#e3f2fd', color: '#1565c0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', marginRight: '6px' }}>{event.startTime}{event.endTime ? '~'+event.endTime : ''}</span>;
                } else {
                  timeBadge = <span style={{ background: '#eee', color: '#666', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', marginRight: '6px' }}>全天</span>;
                }

                let dateDisplay = event.date;
                if (event.endDate && event.endDate !== event.date) {
                    const s = event.date.split('-').slice(1).join('/');
                    const e = event.endDate.split('-').slice(1).join('/');
                    dateDisplay = `${s} ~ ${e}`;
                }

                const deleteBtnDisplay = (isCalendarEditMode) ? 'block' : 'none';

                return (
                  <div key={idx} onClick={(e) => {
                     e.stopPropagation();
                     if (event.isUserEvent && isCalendarEditMode) handleOpenModal('', event._originalIndex);
                     else if (event.isSelfStudyEvent && isCalendarEditMode) alert("若要修改自主學習，請至「自主學習」模組中修改。"); 
                  }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', padding: '10px 0', opacity: isPast ? 0.5 : 1, cursor: isCalendarEditMode ? 'pointer' : 'default' }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '2px' }}>{dateDisplay}</div>
                      <div style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        {timeBadge}<span>{event.title}</span>
                      </div>
                    </div>
                    {event.isUserEvent && (
                      <button className="btn-delete" onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event._originalIndex); }} style={{ padding: '4px 8px', display: deleteBtnDisplay }}>🗑️</button>
                    )}
                  </div>
                );
              })
            }
          </div>
          {isCalendarEditMode && <button className="btn btn-add" onClick={() => handleOpenModal()} style={{ marginTop: '20px' }}>+ 新增活動</button>}
        </div>
      )}

      {isModalOpen && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ textAlign: 'left' }}>
            <h3 style={{ textAlign: 'center', marginTop: 0 }}>{editingIndex > -1 ? '✏️ 編輯活動' : '📅 新增活動'}</h3>
            <div className="input-group">
              <label>活動名稱</label>
              <input type="text" placeholder="輸入活動名稱..." value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="input-group">
              <label>起訖日期 (若為單日則結束無需填寫)</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={{ flex: 1 }} />
                <span style={{ display: 'flex', alignItems: 'center', color: '#999' }}>~</span>
                <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} style={{ flex: 1 }} />
              </div>
            </div>
            <div className="input-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
              <label style={{ margin: 0, fontWeight: 'bold', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={formData.isAllDay} onChange={e => setFormData({ ...formData, isAllDay: e.target.checked })} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                全天活動
              </label>
            </div>
            {!formData.isAllDay && (
              <div className="input-group" style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label>開始時間</label>
                  <input type="time" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>結束時間 (選填)</label>
                  <input type="time" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                </div>
              </div>
            )}
            <button className="btn" style={{ width: '100%', background: editingIndex > -1 ? '#f39c12' : '#333' }} onClick={handleSaveEvent}>
              {editingIndex > -1 ? '💾 儲存修改' : '+ 加入'}
            </button>
            {editingIndex > -1 && <button className="btn" style={{ width: '100%', marginTop: '10px', background: '#ffebee', color: '#e74c3c', border: '1px solid #e74c3c' }} onClick={() => handleDeleteEvent(editingIndex)}>🗑️ 刪除活動</button>}
            <button className="btn" style={{ width: '100%', marginTop: '10px', background: 'transparent', color: '#666', border: '1px solid #ddd' }} onClick={() => setIsModalOpen(false)}>取消</button>
          </div>
        </div>
      )}
    </div>
  );
}
