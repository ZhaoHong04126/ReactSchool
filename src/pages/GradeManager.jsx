import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../context/DataContext';
import Chart from 'chart.js/auto';

export default function GradeManager() {
  const { 
    currentSemester, semesterList, allData,
    getWeeklySchedule, 
    getGradeList, updateGradeList, 
    getRegularExams, updateRegularExams, 
    getMidtermExams, updateMidtermExams,
    graduationTarget, updateGraduationTarget,
    categoryTargets, updateCategoryTargets
  } = useData();

  const [activeTab, setActiveTab] = useState('dashboard');
  
  const gradeList = getGradeList() || [];
  const regularExams = getRegularExams() || {};
  const midtermExams = getMidtermExams() || {};
  
  // Weekly Subjects Set
  const subjects = useMemo(() => {
    let allSubjects = new Set();
    const ws = getWeeklySchedule() || {};
    Object.values(ws).forEach(day => {
      day.forEach(c => {
        if (c.subject) allSubjects.add(c.subject);
      });
    });
    return Array.from(allSubjects).sort();
  }, [getWeeklySchedule()]);

  // Derived dashboard data
  const dashboardStats = useMemo(() => {
    let ts = 0, tcGpa = 0, earned = 0, failed = 0;
    gradeList.forEach(g => {
      const sc = parseFloat(g.score);
      const cr = parseFloat(g.credit) || 0;
      if (sc === -1) {
        earned += cr;
      } else {
        const valSc = sc || 0;
        const pass = valSc >= 60;
        ts += valSc * cr;
        tcGpa += cr;
        if (pass) earned += cr;
        else failed++;
      }
    });
    return {
      gpa: tcGpa > 0 ? (ts / tcGpa).toFixed(1) : "0.0",
      earned,
      failed
    };
  }, [gradeList]);

  // Grade Edit State
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [editingGradeIndex, setEditingGradeIndex] = useState(-1);
  const [isSelfStudy, setIsSelfStudy] = useState(false);
  const [isManualSubject, setIsManualSubject] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    subjectSelect: '', subjectText: '', category: '通識', nature: '必修', credit: '1', score: ''
  });

  // Exam State
  const [examSubject, setExamSubject] = useState('');
  const [examModalType, setExamModalType] = useState(null); // 'regular' or 'midterm'
  const [examForm, setExamForm] = useState({ name: '', score: '' });

  // Settings State
  const [isCreditEditMode, setIsCreditEditMode] = useState(false);
  const [creditForm, setCreditForm] = useState({ grad: graduationTarget, targets: { ...categoryTargets } });
  
  // Update credit form when targets change from other places
  useEffect(() => {
    setCreditForm({ grad: graduationTarget, targets: { ...categoryTargets } });
  }, [graduationTarget, categoryTargets]);

  const handleOpenGradeModal = (index = -1) => {
    setEditingGradeIndex(index);
    if (index > -1) {
      const item = gradeList[index];
      const selfStudy = item.score === -1;
      setIsSelfStudy(selfStudy);
      const existsInOptions = subjects.includes(item.subject);
      setIsManualSubject(!existsInOptions && !selfStudy);
      
      setGradeForm({
        subjectSelect: existsInOptions ? item.subject : (subjects[0] || ''),
        subjectText: !existsInOptions ? item.subject : '',
        category: item.category || '通識',
        nature: item.nature || '必修',
        credit: item.credit || '1',
        score: selfStudy ? '' : item.score
      });
    } else {
      setIsSelfStudy(false);
      setIsManualSubject(false);
      setGradeForm({
        subjectSelect: subjects[0] || '', subjectText: '', category: '通識', nature: '必修', credit: '1', score: ''
      });
    }
    setIsGradeModalOpen(true);
  };

  const handleSaveGrade = () => {
    if (isSelfStudy) {
      const c = parseFloat(gradeForm.credit) || 0;
      if (c <= 0) return alert('學分不能為0');
    } else {
      if ((!isManualSubject && !gradeForm.subjectSelect) || (isManualSubject && !gradeForm.subjectText)) {
        return alert('請選擇或輸入科目');
      }
      if (!gradeForm.score) return alert('請輸入分數');
    }

    const newGrade = {
      subject: isSelfStudy ? '自主學習' : (isManualSubject ? gradeForm.subjectText : gradeForm.subjectSelect),
      category: isSelfStudy ? '自由選修' : gradeForm.category,
      nature: isSelfStudy ? '選修' : gradeForm.nature,
      credit: parseFloat(gradeForm.credit) || 0,
      score: isSelfStudy ? -1 : parseFloat(gradeForm.score)
    };

    const newList = [...gradeList];
    if (editingGradeIndex > -1) newList[editingGradeIndex] = newGrade;
    else newList.push(newGrade);

    updateGradeList(newList);
    setIsGradeModalOpen(false);
  };

  const handleDeleteGrade = (index) => {
    if (window.confirm("確定刪除此成績？")) {
      const newList = [...gradeList];
      newList.splice(index, 1);
      updateGradeList(newList);
    }
  };

  const handleSaveExam = () => {
    if (!examForm.name || !examForm.score) return alert("請輸入名稱和分數");
    
    if (examModalType === 'regular') {
      const current = regularExams[examSubject] || [];
      updateRegularExams({ ...regularExams, [examSubject]: [...current, { title: examForm.name, score: parseFloat(examForm.score) }] });
    } else if (examModalType === 'midterm') {
      const current = midtermExams[examSubject] || [];
      updateMidtermExams({ ...midtermExams, [examSubject]: [...current, { title: examForm.name, score: parseFloat(examForm.score) }] });
    }
    setExamModalType(null);
  };

  const handleDeleteExam = (type, index) => {
    if (window.confirm("確定要刪除這筆成績嗎？")) {
      if (type === 'regular') {
        const current = [...(regularExams[examSubject] || [])];
        current.splice(index, 1);
        updateRegularExams({ ...regularExams, [examSubject]: current });
      } else {
        const current = [...(midtermExams[examSubject] || [])];
        current.splice(index, 1);
        updateMidtermExams({ ...midtermExams, [examSubject]: current });
      }
    }
  };

  const renderDashboard = () => (
    <div id="subview-grade-dashboard">
      <div className="card">
        <h2>📊 成績總覽 ({currentSemester})</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '15px' }}>
          <div style={{ flex: 1, minWidth: '150px', background: 'var(--primary)', color: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 10px rgba(74,144,226,0.3)' }}>
            <div style={{ fontSize: '1rem', opacity: 0.9 }}>本學期加權平均</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{dashboardStats.gpa}</div>
          </div>
          <div style={{ flex: 1, minWidth: '150px', background: '#2ecc71', color: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 10px rgba(46,204,113,0.3)' }}>
            <div style={{ fontSize: '1rem', opacity: 0.9 }}>獲得學分數</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{dashboardStats.earned}</div>
          </div>
          <div style={{ flex: 1, minWidth: '150px', background: '#e74c3c', color: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 10px rgba(231,76,60,0.3)' }}>
            <div style={{ fontSize: '1rem', opacity: 0.9 }}>被當掉的科數</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{dashboardStats.failed}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGradeList = () => (
    <div id="subview-grade-list">
      <div className="card">
        <h2>🧾 學期成績單</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead>
            <tr>
              <th style={{ background: '#f8f9fa', padding: '10px' }}>科目</th>
              <th style={{ background: '#f8f9fa', padding: '10px' }}>學分</th>
              <th style={{ background: '#f8f9fa', padding: '10px' }}>實得</th>
              <th style={{ background: '#f8f9fa', padding: '10px' }}>分數</th>
            </tr>
          </thead>
          <tbody>
            {gradeList.length === 0 ? <tr><td colSpan="4" style={{ padding: '20px', color: '#999' }}>無成績</td></tr> : 
              gradeList.map((g, i) => {
                const isSelfStudy = g.score === -1;
                const pass = isSelfStudy || parseFloat(g.score) >= 60;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{g.subject}</td>
                    <td style={{ padding: '10px' }}>{g.credit}</td>
                    <td style={{ padding: '10px' }}>{pass ? g.credit : 0}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: pass ? (isSelfStudy ? '#2e7d32' : '#2ecc71') : '#e74c3c' }}>
                      {isSelfStudy ? <span style={{ background:'#e8f5e9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>P (通過)</span> : g.score}
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
        <div style={{ marginTop: '15px', fontWeight: 'bold', color: 'var(--primary)', textAlign: 'right' }}>
          加權平均: {dashboardStats.gpa} <span style={{ fontSize: '0.8rem', color: '#666' }}>(實得{dashboardStats.earned}學分)</span>
        </div>
        <button className="btn" style={{ width: '100%', marginTop: '15px' }} onClick={() => handleOpenGradeModal(-1)}>⚙️ 管理學期成績</button>
      </div>
    </div>
  );

  const renderExams = () => {
    const rExams = regularExams[examSubject] || [];
    const mExams = midtermExams[examSubject] || [];
    
    return (
      <div id="subview-grade-exams">
        <div className="card">
          <h2>📝 日常考試分數</h2>
          <select className="login-input" value={examSubject} onChange={e => setExamSubject(e.target.value)} style={{ width: '100%', marginBottom: '15px' }}>
            <option value="" disabled>選擇科目</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <tbody>
              {!examSubject ? <tr><td colSpan="3" style={{ padding: '20px', color: '#999' }}>👈 請先選擇科目</td></tr> :
               (rExams.length === 0 && mExams.length === 0) ? <tr><td colSpan="3" style={{ padding: '20px', color: '#999' }}>📭 目前無紀錄</td></tr> :
               <>
                 {rExams.map((ex, i) => (
                   <tr key={`reg-${i}`} style={{ borderBottom: '1px solid #eee' }}>
                     <td style={{ padding: '10px' }}><span style={{ background:'#e3f2fd', color:'#1565c0', padding:'2px 6px', borderRadius:'4px', fontSize:'0.8rem' }}>平常考</span></td>
                     <td style={{ padding: '10px', textAlign: 'left' }}>{ex.title} <span onClick={() => handleDeleteExam('regular', i)} style={{ cursor: 'pointer', color: '#e74c3c', fontSize:'0.8rem', marginLeft:'5px' }}>🗑️</span></td>
                     <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--primary)' }}>{ex.score}</td>
                   </tr>
                 ))}
                 {mExams.map((ex, i) => (
                   <tr key={`mid-${i}`} style={{ borderBottom: '1px solid #eee' }}>
                     <td style={{ padding: '10px' }}><span style={{ background:'#fff8e1', color:'#f57f17', padding:'2px 6px', borderRadius:'4px', fontSize:'0.8rem' }}>段考</span></td>
                     <td style={{ padding: '10px', textAlign: 'left' }}>{ex.title} <span onClick={() => handleDeleteExam('midterm', i)} style={{ cursor: 'pointer', color: '#e74c3c', fontSize:'0.8rem', marginLeft:'5px' }}>🗑️</span></td>
                     <td style={{ padding: '10px', fontWeight: 'bold', color: 'var(--primary)' }}>{ex.score}</td>
                   </tr>
                 ))}
               </>
              }
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button className="btn" style={{ flex: 1, background: '#4a90e2' }} onClick={() => { if(!examSubject) return alert("請先選科目"); setExamForm({name:'',score:''}); setExamModalType('regular');}}>+ 平常考</button>
            <button className="btn" style={{ flex: 1, background: '#f39c12' }} onClick={() => { if(!examSubject) return alert("請先選科目"); setExamForm({name:'',score:''}); setExamModalType('midterm');}}>+ 段/期考</button>
          </div>
        </div>
      </div>
    );
  };
  
  // Custom Hook for Chart
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (activeTab === 'chart') {
      const labels = [];
      const dataPoints = [];
      
      const sortedSemesters = semesterList.slice().sort(); 
      sortedSemesters.forEach(sem => {
        let semData = allData[sem];
        let grades = (sem === currentSemester) ? gradeList : (semData ? semData.grades : []);

        if (grades && grades.length > 0) {
            let semTs = 0, semTc = 0;
            grades.forEach(g => {
                const s = parseFloat(g.score);
                const c = parseFloat(g.credit) || 0;
                if (s !== -1) {
                    semTs += (s || 0) * c;
                    semTc += c;
                }
            });
            const avg = semTc > 0 ? (semTs / semTc).toFixed(1) : 0;
            labels.push(sem);
            dataPoints.push(avg);
        }
      });

      if (chartInstance.current) chartInstance.current.destroy();
      
      const thresholdLinesPlugin = {
          id: 'thresholdLines',
          beforeDatasetsDraw(chart) {
              const { ctx, scales: { y }, chartArea: { left, right } } = chart;
              ctx.save();
              ctx.lineWidth = 3; 
              ctx.strokeStyle = '#f1c40f';
              ctx.setLineDash([5, 5]);

              const y60 = y.getPixelForValue(60);
              if (y60 >= chart.chartArea.top && y60 <= chart.chartArea.bottom) {
                  ctx.beginPath(); ctx.moveTo(left, y60); ctx.lineTo(right, y60); ctx.stroke();
              }
              const y80 = y.getPixelForValue(80);
              if (y80 >= chart.chartArea.top && y80 <= chart.chartArea.bottom) {
                  ctx.beginPath(); ctx.moveTo(left, y80); ctx.lineTo(right, y80); ctx.stroke();
              }
              ctx.restore();
          }
      };

      if (chartRef.current) {
        chartInstance.current = new Chart(chartRef.current, {
          type: 'line',
          data: {
              labels,
              datasets: [{
                  label: '學期平均',
                  data: dataPoints,
                  borderColor: '#4a90e2',
                  backgroundColor: 'rgba(74, 144, 226, 0.1)',
                  fill: true,
                  tension: 0.3
              }]
          },
          plugins: [thresholdLinesPlugin],
          options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: { y: { beginAtZero: false, suggestedMin: 40, suggestedMax: 100 } },
              plugins: { legend: { display: false } }
          }
        });
      }
    }
  }, [activeTab, gradeList, currentSemester, allData, semesterList]);

  const renderChart = () => (
    <div id="subview-grade-chart" style={{ display: activeTab === 'chart' ? 'block' : 'none' }}>
      <div className="card">
        <h2>📈 歷年成績走勢</h2>
        <div style={{ height: '300px', width: '100%', background: 'white', borderRadius: '12px', padding: '10px', boxSizing: 'border-box' }}>
            <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );

  const renderCredits = () => {
    // Calculate total earned across all semesters
    let totalEarned = 0;
    let earnedMap = {};
    const categoriesKeys = Object.keys(categoryTargets);
    const renderCats = [...categoriesKeys];
    if (!renderCats.includes('其他')) renderCats.push('其他');

    renderCats.forEach(cat => earnedMap[cat] = { total: 0, "必修": 0, "選修": 0, "必選修": 0 });

    semesterList.forEach(sem => {
      let grades = (sem === currentSemester) ? gradeList : (allData[sem]?.grades || []);
      grades.forEach(g => {
        const sc = parseFloat(g.score);
        const cr = parseFloat(g.credit) || 0;
        let cat = g.category || '其他';
        if (sc === -1 || g.subject === '自主學習') cat = '自由選修';
        if (!earnedMap[cat]) earnedMap[cat] = { total: 0, "必修": 0, "選修": 0, "必選修": 0 };
        
        const nature = g.nature || '必修';
        if (sc >= 60 || sc === -1) {
          totalEarned += cr;
          earnedMap[cat].total += cr;
          if (earnedMap[cat][nature] !== undefined) earnedMap[cat][nature] += cr;
          else earnedMap[cat]["選修"] += cr;
        }
      });
    });

    const progressPercent = Math.min((totalEarned / graduationTarget) * 100, 100);
    const pColor = progressPercent < 30 ? '#e74c3c' : (progressPercent < 70 ? '#f39c12' : '#2ecc71');

    return (
      <div id="subview-grade-credits" style={{ display: activeTab === 'credits' ? 'block' : 'none' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>🎓 學分標準與進度</h2>
            <button className="btn-icon" onClick={() => setIsCreditEditMode(!isCreditEditMode)} style={{ background: isCreditEditMode ? '#e6f0ff' : 'transparent', border: `1px solid ${isCreditEditMode ? 'var(--primary)' : '#ddd'}`, padding: '5px 10px', borderRadius: '6px' }}>
              {isCreditEditMode ? '儲存設定' : '⚙️ 設定標準'}
            </button>
          </div>
          
          {isCreditEditMode ? (
            <div style={{ marginTop: '15px' }}>
              <div className="input-group">
                <label>修改畢業總學分門檻</label>
                <input type="number" value={creditForm.grad} onChange={e => setCreditForm({...creditForm, grad: parseInt(e.target.value)||0})} className="login-input" />
              </div>
              <h4>各分類門檻</h4>
              {Object.keys(creditForm.targets).map(cat => {
                const target = creditForm.targets[cat];
                const isComplex = typeof target === 'object';
                return (
                  <div key={cat} style={{ marginTop: '10px', background: '#fafafa', padding: '12px', borderRadius: '6px', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>{cat}</span>
                      <button onClick={() => {
                        const newT = {...creditForm.targets}; delete newT[cat]; setCreditForm({...creditForm, targets: newT});
                      }} style={{ background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 10px' }}>🗑️</button>
                    </div>
                    {isComplex ? (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}><span style={{ fontSize: '0.8rem', color: '#666' }}>必修</span><input type="number" value={target['必修']} onChange={e => { const newT = {...creditForm.targets}; newT[cat]['必修'] = parseInt(e.target.value)||0; setCreditForm({...creditForm, targets: newT}); }} style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} /></div>
                        <div style={{ flex: 1 }}><span style={{ fontSize: '0.8rem', color: '#666' }}>選修</span><input type="number" value={target['選修']} onChange={e => { const newT = {...creditForm.targets}; newT[cat]['選修'] = parseInt(e.target.value)||0; setCreditForm({...creditForm, targets: newT}); }} style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} /></div>
                      </div>
                    ) : (
                      <div style={{ flex: 1 }}><span style={{ fontSize: '0.8rem', color: '#666' }}>總目標</span><input type="number" value={target} onChange={e => { const newT = {...creditForm.targets}; newT[cat] = parseInt(e.target.value)||0; setCreditForm({...creditForm, targets: newT}); }} style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} /></div>
                    )}
                  </div>
                );
              })}
              <div style={{ marginTop: '10px' }}>
                <button className="btn" style={{ background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', width: 'auto', padding: '6px 12px' }} onClick={() => {
                  const name = window.prompt("請輸入新模組名稱 (如: 專業)");
                  if(name && !creditForm.targets[name]) {
                    const isComplex = window.confirm("是否細分必修與選修？");
                    setCreditForm({...creditForm, targets: {...creditForm.targets, [name]: isComplex ? {'必修':0, '選修':0} : 0}});
                  }
                }}>+ 新增學分模組</button>
              </div>
              <button className="btn" onClick={() => { updateGraduationTarget(creditForm.grad); updateCategoryTargets(creditForm.targets); setIsCreditEditMode(false); }} style={{ width: '100%', marginTop: '15px' }}>💾 儲存並返回</button>
            </div>
          ) : (
            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#555' }}>總學分進度</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}><span style={{ fontSize: '1.8rem' }}>{totalEarned}</span> / {graduationTarget}</span>
              </div>
              <div style={{ background: '#eee', borderRadius: '10px', height: '16px', width: '100%', overflow: 'hidden' }}>
                <div style={{ background: pColor, width: `${progressPercent}%`, height: '100%', transition: 'width 0.5s ease-in-out' }}></div>
              </div>
              
              <div style={{ marginTop: '25px' }}>
                {renderCats.length === 0 ? <p style={{ textAlign: 'center', color: '#999' }}>尚未設定學分模組</p> : 
                  renderCats.map(cat => {
                    const data = earnedMap[cat];
                    const targetConfig = categoryTargets[cat];
                    const isComplex = typeof targetConfig === 'object';
                    
                    if (!isComplex) {
                        const target = targetConfig || 0;
                        const earned = data.total;
                        if (target === 0 && earned === 0 && cat !== '其他') return null;
                        const pct = target > 0 ? Math.min(Math.round((earned / target) * 100), 100) : 0;
                        const bColor = pct >= 100 ? "#2ecc71" : "#4a90e2";
                        return (
                          <div key={cat} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 'bold', color: '#555' }}>{cat}</span>
                                <span style={{ fontWeight: 'bold', color: bColor }}>{earned > 0 ? earned + ' / ' + target : earned}</span>
                            </div>
                            <div style={{ background: '#eee', borderRadius: '6px', height: '10px', width: '100%', overflow: 'hidden' }}>
                                <div style={{ background: bColor, width: `${pct}%`, height: '100%' }}></div>
                            </div>
                          </div>
                        );
                    } else {
                        const reqTarget = targetConfig["必修"] || 0;
                        const eleTarget = targetConfig["選修"] || 0;
                        const reqEarned = data["必修"] || 0;
                        const eleEarned = (data["選修"] || 0) + (data["必選修"] || 0);

                        const rPct = reqTarget > 0 ? Math.min(Math.round((reqEarned / reqTarget) * 100), 100) : (reqEarned > 0 ? 100 : 0);
                        const ePct = eleTarget > 0 ? Math.min(Math.round((eleEarned / eleTarget) * 100), 100) : (eleEarned > 0 ? 100 : 0);
                        const rColor = rPct >= 100 ? "#2ecc71" : "#e74c3c";
                        const eColor = ePct >= 100 ? "#2ecc71" : "#f39c12";

                        return (
                          <div key={cat} style={{ marginBottom: '15px', background: '#fafafa', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }}>
                            <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '8px', fontSize: '0.95rem' }}>{cat}模組</div>
                            <div style={{ marginBottom: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
                                    <span>必修</span><span>{reqEarned} / {reqTarget}</span>
                                </div>
                                <div style={{ background: '#e0e0e0', borderRadius: '4px', height: '8px', width: '100%', overflow: 'hidden' }}>
                                    <div style={{ background: rColor, width: `${rPct}%`, height: '100%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
                                    <span>選修</span><span>{eleEarned} / {eleTarget}</span>
                                </div>
                                <div style={{ background: '#e0e0e0', borderRadius: '4px', height: '8px', width: '100%', overflow: 'hidden' }}>
                                    <div style={{ background: eColor, width: `${ePct}%`, height: '100%' }}></div>
                                </div>
                            </div>
                          </div>
                        );
                    }
                  })
                }
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGradeModal = () => {
    if (!isGradeModalOpen) return null;
    return (
      <div className="modal" style={{ display: 'flex' }}>
        <div className="modal-content" style={{ textAlign: 'left', maxHeight: '80vh', overflowY: 'auto' }}>
          <h3>✏️ 學期成績管理</h3>
          <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '15px' }}>
            {gradeList.length === 0 ? <p style={{ color: '#999', textAlign: 'center' }}>無成績</p> : 
              gradeList.map((item, idx) => (
                <div key={idx} className="course-list-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #eee' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{item.subject}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{item.credit}學分 | {item.score === -1 ? '自主學習' : item.score+'分'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <button onClick={() => handleOpenGradeModal(idx)} style={{ padding: '2px 8px', fontSize: '0.8rem' }}>修改</button>
                    <button onClick={() => handleDeleteGrade(idx)} style={{ padding: '2px 8px', fontSize: '0.8rem', background: '#ffebee', color: '#e74c3c', border: '1px solid #e74c3c' }}>刪除</button>
                  </div>
                </div>
              ))
            }
          </div>
          
          <div style={{ borderTop: '1px dashed #ddd', paddingTop: '15px', marginTop: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary)' }}>新增成績 / 覆寫紀錄</h4>
            
            <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="selfStudyCheck" checked={isSelfStudy} onChange={e => setIsSelfStudy(e.target.checked)} />
              <label htmlFor="selfStudyCheck" style={{ marginBottom: 0 }}>這是一門自主學習 (抵免學分)</label>
            </div>
            
            {!isSelfStudy && (
              <>
                <div className="input-group">
                  <label>科目</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {!isManualSubject ? (
                      <select className="login-input" value={gradeForm.subjectSelect} onChange={e => setGradeForm({...gradeForm, subjectSelect: e.target.value})} style={{ flex: 1, marginBottom: 0 }}>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input type="text" className="login-input" placeholder="手動輸入科目名稱" value={gradeForm.subjectText} onChange={e => setGradeForm({...gradeForm, subjectText: e.target.value})} style={{ flex: 1, marginBottom: 0 }} />
                    )}
                    <button className="btn" style={{ width: 'auto', background: 'transparent', border: '1px solid #ddd', color: '#333' }} onClick={() => setIsManualSubject(!isManualSubject)}>
                      {isManualSubject ? '📜' : '✏️'}
                    </button>
                  </div>
                </div>
                <div className="input-group">
                  <label>課程歸類與性質</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select className="login-input" value={gradeForm.category} onChange={e => setGradeForm({...gradeForm, category: e.target.value})} style={{ flex: 1, marginBottom: 0 }}>
                      {Object.keys(categoryTargets).map(c => <option key={c} value={c}>{c}</option>)}
                      {!categoryTargets['其他'] && <option value="其他">其他</option>}
                    </select>
                    <select className="login-input" value={gradeForm.nature} onChange={e => setGradeForm({...gradeForm, nature: e.target.value})} style={{ flex: 1, marginBottom: 0 }}>
                      <option value="必修">必修</option>
                      <option value="選修">選修</option>
                      <option value="必選修">必選修</option>
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label>學期成績分數 (0-100)</label>
                  <input type="number" className="login-input" value={gradeForm.score} onChange={e => setGradeForm({...gradeForm, score: e.target.value})} placeholder="例如: 85" />
                </div>
              </>
            )}
            
            <div className="input-group">
              <label>學分數</label>
              <input type="number" className="login-input" value={gradeForm.credit} onChange={e => setGradeForm({...gradeForm, credit: e.target.value})} placeholder="學分數" />
            </div>
            
            <button className="btn" style={{ width: '100%', background: editingGradeIndex > -1 ? '#f39c12' : '#333' }} onClick={handleSaveGrade}>
              {editingGradeIndex > -1 ? "💾 保存修改" : "+ 加入成績單"}
            </button>
          </div>
          <button className="btn" style={{ width: '100%', marginTop: '10px', background: 'transparent', color: '#666', border: '1px solid #ddd' }} onClick={() => setIsGradeModalOpen(false)}>關閉</button>
        </div>
      </div>
    );
  };

  const renderExamModal = () => {
    if (!examModalType) return null;
    return (
      <div className="modal" style={{ display: 'flex' }}>
        <div className="modal-content" style={{ textAlign: 'left' }}>
          <h3>✏️ 新增 {examModalType === 'regular' ? '平常考' : '段/期考'} 成績</h3>
          <p style={{ textAlign: 'center', color: 'var(--primary)', fontWeight: 'bold' }}>{examSubject}</p>
          <div className="input-group">
            <label>測驗名稱 (例如: 第一次小考)</label>
            <input type="text" className="login-input" value={examForm.name} onChange={e => setExamForm({...examForm, name: e.target.value})} />
          </div>
          <div className="input-group">
            <label>獲得分數</label>
            <input type="number" className="login-input" value={examForm.score} onChange={e => setExamForm({...examForm, score: e.target.value})} />
          </div>
          <button className="btn" style={{ width: '100%', background: 'var(--primary)' }} onClick={handleSaveExam}>💾 儲存成績</button>
          <button className="btn" style={{ width: '100%', marginTop: '10px', background: 'transparent', color: '#666', border: '1px solid #ddd' }} onClick={() => setExamModalType(null)}>關閉</button>
        </div>
      </div>
    );
  };

  return (
    <div id="view-grade">
      <div className="week-tabs" style={{ marginBottom: '20px', overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex' }}>
        <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📈 總覽</button>
        <button className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`} onClick={() => setActiveTab('exams')}>📝 日常考</button>
        <button className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>🧾 學期成績</button>
        <button className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`} onClick={() => setActiveTab('chart')}>📈 歷年走勢</button>
        <button className={`tab-btn ${activeTab === 'credits' ? 'active' : ''}`} onClick={() => setActiveTab('credits')}>🎓 學分門檻</button>
      </div>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'exams' && renderExams()}
      {activeTab === 'list' && renderGradeList()}
      {activeTab === 'credits' && renderCredits()}
      {renderChart()}
      
      {renderGradeModal()}
      {renderExamModal()}
    </div>
  );
}
