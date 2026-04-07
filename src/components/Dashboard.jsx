import React, { useState } from 'react';
import { supabase } from '../supabase';
import Schedule from '../pages/Schedule';
import Accounting from '../pages/Accounting';
import Calendar from '../pages/Calendar';
import Lottery from '../pages/Lottery';
import SelfStudy from '../pages/SelfStudy';
import GradeCalc from '../pages/GradeCalc';
import GradeManager from '../pages/GradeManager';
import Homework from '../pages/Homework';
import Anniversary from '../pages/Anniversary';
import Settings from '../pages/Settings';

import '../layout.css';
import '../components.css';
import '../dashboard.css';
import '../calendar.css';
import '../settings.css';
import '../feedback-admin.css';

export default function Dashboard({ user, handleLogout }) {
  const [activeTab, setActiveTab] = useState('schedule');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('bug');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!feedbackContent.trim()) {
      alert("請輸入回饋內容！");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('feedbacks')
        .insert([{
          uid: user ? (user.id || user.uid) : "anonymous",
          type: feedbackType,
          content: feedbackContent,
          status: "pending"
        }]);
      if (error) throw error;
      alert("感謝您的回饋！我們已經收到囉。");
      setFeedbackContent('');
      setIsFeedbackOpen(false);
    } catch (error) {
      console.error("送出回饋失敗:", error);
      alert("送出失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 用來切換右側元件
  const renderContent = () => {
    switch (activeTab) {
      case 'schedule': return <Schedule switchTab={switchTab} />;
      case 'accounting': return <Accounting />;
      case 'calendar': return <Calendar />;
      case 'lottery': return <Lottery />;
      case 'self-study': return <SelfStudy />;
      case 'grade-calc': return <GradeCalc />;
      case 'grade-manager': return <GradeManager />;
      case 'homework': return <Homework />;
      case 'anniversary': return <Anniversary />;
      case 'settings': return <Settings handleLogout={handleLogout} />;
      default: return <Schedule switchTab={switchTab} />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'schedule': return '課表';
      case 'accounting': return '記帳';
      case 'calendar': return '行事曆';
      case 'lottery': return '籤筒';
      case 'self-study': return '自主學習';
      case 'grade-calc': return '配分筆記';
      case 'grade-manager': return '成績與學分';
      case 'homework': return '作業';
      case 'anniversary': return '紀念日';
      case 'settings': return '設定';
      default: return '首頁';
    }
  };

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    
    // 對應原版的 background 切換機制
    document.body.setAttribute('data-page', tabId);
  };

  return (
    <>
      {/* Top bar (Visible on both desktop and mobile, holds the App Title / Notification / Hamburger) */}
      <nav id="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button id="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', padding: '5px' }}>☰</button>
          <h1 id="app-title" style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', letterSpacing: '1px' }}>{getPageTitle()}</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button id="nav-notifications-btn" style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.3rem', cursor: 'pointer', padding: '10px', position: 'relative' }} title="通知中心">
            🔔 <span id="notification-badge" style={{ display: 'none', position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', backgroundColor: '#e74c3c', borderRadius: '50%' }}></span>
          </button>
        </div>
      </nav>
      {isMobileMenuOpen && (
        <div id="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'block' }}></div>
      )}

      {/* Main layout */}
      <div className="dashboard-container" style={{ display: 'flex' }}>
        <aside className={`desktop-sidebar ${isMobileMenuOpen ? 'open' : ''}`} id="sidebar">
          <div style={{ textAlign: 'left', background: '#f8f9fa', padding: '12px', borderRadius: '12px', border: '1px solid #eee', marginTop: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'bold' }}>📅 目前學期</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '0.9rem' }} title="重新命名">✏️</button>
                <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '0.9rem' }} title="刪除學期">🗑️</button>
                <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '0.9rem' }} title="新增學期">➕</button>
              </div>
            </div>
            <select id="semester-select" className="semester-select" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontWeight: 'bold', color: 'var(--primary)', fontSize: '1rem', background: 'white', outline: 'none', cursor: 'pointer' }}>
              <option value="test">112學年度下學期</option>
            </select>
            <div id="semester-status-text" style={{ fontSize: '0.8rem', marginTop: '8px', color: '#666', textAlign: 'center' }}>運行中</div>
          </div>

          <nav className="sidebar-nav">
            <div style={{ fontSize: '0.75rem', color: '#999', margin: '10px 0 5px 10px', fontWeight: 'bold' }}>主選單</div>
            <button className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => switchTab('schedule')}>📅 智慧課表</button>
            <button className={`nav-item ${activeTab === 'accounting' ? 'active' : ''}`} onClick={() => switchTab('accounting')}>💰 學期記帳</button>
            <button className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => switchTab('calendar')}>🗓️ 行事曆</button>

            <div style={{ fontSize: '0.75rem', color: '#999', margin: '15px 0 5px 10px', fontWeight: 'bold' }}>小工具</div>
            <button className={`nav-item ${activeTab === 'lottery' ? 'active' : ''}`} onClick={() => switchTab('lottery')}>🎰 幸運籤筒</button>
            <button className={`nav-item ${activeTab === 'self-study' ? 'active' : ''}`} onClick={() => switchTab('self-study')}>🏃 自主學習活動</button>
            <button className={`nav-item ${activeTab === 'grade-calc' ? 'active' : ''}`} onClick={() => switchTab('grade-calc')}>🧮 配分筆記</button>
            <button className={`nav-item ${activeTab === 'grade-manager' ? 'active' : ''}`} onClick={() => switchTab('grade-manager')}>💯 成績與學分</button>
            <button className={`nav-item ${activeTab === 'homework' ? 'active' : ''}`} onClick={() => switchTab('homework')}>🎒 作業與小考</button>
            <button className={`nav-item ${activeTab === 'anniversary' ? 'active' : ''}`} onClick={() => switchTab('anniversary')}>💝 紀念日倒數</button>

            <div style={{ fontSize: '0.75rem', color: '#999', margin: '15px 0 5px 10px', fontWeight: 'bold' }}>系統</div>
            <button onClick={() => setIsFeedbackOpen(true)}>回報問題</button>
            <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => switchTab('settings')}>⚙️ 個人設定</button>
          </nav>
        </aside>
        
        <main className="main-content" id="main-content-area">
          {renderContent()}
        </main>

        {isFeedbackOpen && (
          <div className="modal" style={{ display: 'flex' }}>
            <div className="modal-content">
              <span className="close-btn" onClick={() => setIsFeedbackOpen(false)} style={{ cursor: 'pointer', float: 'right', fontSize: '1.5rem', marginTop: '-10px' }}>&times;</span>
              <h2>💡 意見回饋 / 🐞 問題回報</h2>
              <div className="form-group" style={{ textAlign: 'left', marginBottom: '15px' }}>
                <label>類型：</label>
                <select value={feedbackType} onChange={e => setFeedbackType(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }}>
                  <option value="bug">🐞 系統 Bug 回報</option>
                  <option value="suggestion">💡 新功能建議</option>
                  <option value="other">💬 其他想說的話</option>
                </select>
              </div>
              <div className="form-group" style={{ textAlign: 'left', marginBottom: '15px' }}>
                <label>詳細內容：</label>
                <textarea 
                  rows="4" 
                  value={feedbackContent} 
                  onChange={e => setFeedbackContent(e.target.value)}
                  placeholder="請詳細描述您遇到的問題或建議..."
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px', resize: 'vertical' }}
                ></textarea>
              </div>
              <button 
                className="btn-primary" 
                onClick={handleSubmitFeedback} 
                disabled={isSubmitting}
                style={{ width: '100%', padding: '10px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? '送出中...' : '送出回饋'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
