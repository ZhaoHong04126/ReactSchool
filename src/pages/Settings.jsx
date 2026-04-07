import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useData } from '../context/DataContext';

export default function Settings() {
  const { 
    currentSemester, semesterList, allData, saveData,
    userSchoolInfo, customPeriods, periodConfig, periodTimesConfig,
    paymentMethods, accCategories, selfStudyConversionRate, graduationTarget, categoryTargets
  } = useData();

  // Semester Dates View/Edit
  const [isSemEditMode, setIsSemEditMode] = useState(false);
  const [semStart, setSemStart] = useState("");
  const [semEnd, setSemEnd] = useState("");
  
  useEffect(() => {
    if (allData[currentSemester]?.dates) {
      setSemStart(allData[currentSemester].dates.start || "");
      setSemEnd(allData[currentSemester].dates.end || "");
    } else {
      setSemStart("");
      setSemEnd("");
    }
  }, [allData, currentSemester]);

  const handleSaveSemesterDates = () => {
    const newAllData = { ...allData };
    if (!newAllData[currentSemester]) newAllData[currentSemester] = {};
    newAllData[currentSemester].dates = { start: semStart, end: semEnd };
    saveData(newAllData);
    setIsSemEditMode(false);
    alert("學期區間已儲存！");
  };

  // General Settings View/Edit
  const [isGeneralEditMode, setIsGeneralEditMode] = useState(false);
  const [school, setSchool] = useState(userSchoolInfo?.school || "");
  const [department, setDepartment] = useState(userSchoolInfo?.department || "");

  // Update local state if context changes
  useEffect(() => {
    setSchool(userSchoolInfo?.school || "");
    setDepartment(userSchoolInfo?.department || "");
  }, [userSchoolInfo]);

  const handleSaveSchoolInfo = () => {
    saveData(allData, customPeriods, paymentMethods, accCategories, selfStudyConversionRate, graduationTarget, categoryTargets, { school, department });
    setIsGeneralEditMode(false);
    alert("學校與科系資訊已更新！");
  };

  // Theme
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');
  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

  // Auth Logout
  const handleLogout = async () => {
    if (window.confirm("確定要登出嗎？")) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        alert("登出失敗: " + err.message);
      }
    }
  };

  // Backup / Restore
  const handleExportData = () => {
    const backupObj = {
      allData,
      semesterList,
      currentSemester,
      customPeriods,
      periodConfig,
      periodTimesConfig,
      paymentMethods,
      accCategories,
      userSchoolInfo: { school, department },
      selfStudyConversionRate,
      graduationTarget,
      categoryTargets
    };
    const dataStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CampusKing_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (window.confirm("⚠️ 警告：這將覆蓋您目前所有的資料！確定要還原嗎？")) {
          // Trigger save via DataContext.
          // Note: Because of how saveData is implemented, we pass the parsed data explicitly
          // However, context's loadData currently directly loads from storage or cloud. 
          // Best way to restore is call saveData with parsed payload, then reload window.
          saveData(
            parsed.allData || allData,
            parsed.customPeriods || customPeriods,
            parsed.paymentMethods || paymentMethods,
            parsed.accCategories || accCategories,
            parsed.selfStudyConversionRate || selfStudyConversionRate,
            parsed.graduationTarget || graduationTarget,
            parsed.categoryTargets || categoryTargets,
            parsed.userSchoolInfo || userSchoolInfo
          ).then(() => {
            alert("✅ 資料還原成功，即將重新載入頁面！");
            window.location.reload();
          });
        }
      } catch (err) {
        alert("⛔ 無法解析檔案，這可能不是有效的備份檔。");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset input
  };

  return (
    <div id="view-settings">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #f4f7f6' }}>
          <h2 style={{ margin: 0, border: 'none', padding: 0 }}>📅 學期期間設定</h2>
          <button className="btn-icon" onClick={() => setIsSemEditMode(!isSemEditMode)} style={{ fontSize: '0.85rem', background: isSemEditMode ? '#e6f0ff' : 'transparent', border: `1px solid ${isSemEditMode ? 'var(--primary)' : '#ddd'}`, color: isSemEditMode ? 'var(--primary)' : '#888', padding: '6px 12px', borderRadius: '4px' }}>
            {isSemEditMode ? '✏️ 編輯模式' : '🔒 唯讀模式'}
          </button>
        </div>
        
        {!isSemEditMode ? (
          <div id="semester-date-view-mode">
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-sub)' }}>學期開始</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{semStart || '未設定'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', marginBottom: '15px' }}>
              <span style={{ color: 'var(--text-sub)' }}>學期結束</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{semEnd || '未設定'}</span>
            </div>
          </div>
        ) : (
          <div id="semester-date-edit-mode">
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
              <div className="input-group">
                <label>學期開始日 (第 1 週)</label>
                <input type="date" value={semStart} onChange={e => setSemStart(e.target.value)} className="login-input" style={{ background: 'white' }} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>學期結束日</label>
                <input type="date" value={semEnd} onChange={e => setSemEnd(e.target.value)} className="login-input" style={{ background: 'white' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button className="btn" onClick={handleSaveSemesterDates} style={{ flex: 2, background: 'var(--primary)' }}>💾 儲存</button>
              <button className="btn" onClick={() => setIsSemEditMode(false)} style={{ flex: 1, background: 'transparent', color: '#888', border: '1px solid #ddd' }}>取消</button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚙️ 一般設定</span>
          <button className="btn-icon" onClick={() => setIsGeneralEditMode(!isGeneralEditMode)} style={{ fontSize: '0.85rem', background: isGeneralEditMode ? '#e6f0ff' : 'transparent', border: `1px solid ${isGeneralEditMode ? 'var(--primary)' : '#ddd'}`, color: isGeneralEditMode ? 'var(--primary)' : '#888', padding: '6px 12px', borderRadius: '4px' }}>
            {isGeneralEditMode ? '✏️ 編輯模式' : '🔒 唯讀模式'}
          </button>
        </h2>

        {!isGeneralEditMode ? (
          <div className="settings-list">
            <div className="settings-item" onClick={() => alert("請先切換至「✏️ 編輯模式」才可修改")}>
              <div><span className="settings-icon">🏫</span>學校與科系</div>
              <span style={{ color: '#888', fontSize: '0.9rem' }}>{school && department ? `${school} ${department}` : '未設定'}</span>
            </div>
            {/* The time setting logic holds back for now, let users just use simple setup */}
            <div className="settings-item" onClick={handleToggleTheme}>
              <div><span className="settings-icon">🌙</span>深色模式</div>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: theme === 'dark' ? '#2ecc71' : '#ccc' }}>{theme === 'dark' ? 'ON' : 'OFF'}</span>
            </div>
          </div>
        ) : (
          <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <div className="input-group">
              <label>學校名稱</label>
              <input type="text" value={school} onChange={e => setSchool(e.target.value)} className="login-input" placeholder="例如: 國立台灣大學" style={{ background: 'white' }} />
            </div>
            <div className="input-group">
              <label>科系名稱</label>
              <input type="text" value={department} onChange={e => setDepartment(e.target.value)} className="login-input" placeholder="例如: 資訊工程學系" style={{ background: 'white' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn" onClick={handleSaveSchoolInfo} style={{ flex: 2, background: 'var(--primary)' }}>💾 儲存</button>
              <button className="btn" onClick={() => setIsGeneralEditMode(false)} style={{ flex: 1, background: 'transparent', color: '#888', border: '1px solid #ddd' }}>取消</button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ color: 'var(--danger)', borderBottomColor: '#fff0f0' }}>🛡️ 帳號管理</h2>
        <div className="settings-list">
          <div className="settings-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
            <div><span className="settings-icon">🚪</span>登出帳號</div>
          </div>
          <div className="settings-item" onClick={() => alert('因安全考量，註銷帳號請聯繫開發者進行實名刪除。')} style={{ color: '#e74c3c', borderTop: '1px dashed #eee' }}>
            <div><span className="settings-icon">💀</span>註銷帳號 (永久刪除)</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>💾 資料備份與還原</h2>
        <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '12px', marginTop: '5px' }}>
          將所有學期紀錄打包成「專屬大學回憶包」下載，或從先前的備份還原。
        </p>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn" onClick={handleExportData} style={{ fontSize: '0.85rem', padding: '6px 14px', width: 'auto', background: '#2ecc71' }}>📥 匯出</button>
          <button className="btn" onClick={() => document.getElementById('import-file-input').click()} style={{ fontSize: '0.85rem', padding: '6px 14px', width: 'auto', background: '#3498db' }}>📤 匯入</button>
          <input type="file" id="import-file-input" accept=".json" style={{ display: 'none' }} onChange={handleImportData} />
        </div>
      </div>
      
    </div>
  );
}
