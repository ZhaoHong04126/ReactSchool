import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import { supabase } from './supabase';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // 新增 state 來儲存登入的使用者
  
  useEffect(() => {
    // Add page data attribute to match old body[data-page="home"]
    if (!user) {
      document.body.setAttribute('data-page', 'home');
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        window.location.hash = '#/app';
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        window.location.hash = '#/app';
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.hash = ''; // 清除 hash
    } catch (error) {
      alert("登出失敗：" + error.message);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert("請輸入 Email 和密碼");
      return;
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      alert("登入失敗：" + error.message);
    }
  };

  const registerAccount = async () => {
    const regEmail = prompt("請輸入要註冊的 Email 信箱：");
    if (regEmail) {
      const regPassword = prompt("請設定密碼 (至少6個字元)：");
      if (regPassword) {
        try {
          const { error } = await supabase.auth.signUp({
            email: regEmail,
            password: regPassword,
          });
          if (error) throw error;
          alert("🎉 註冊成功！系統將自動登入。");
        } catch (error) {
          alert("註冊失敗：" + error.message);
        }
      }
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (error) {
      alert("Google 登入錯誤：" + error.message);
    }
  };

  const loginAnonymously = async () => {
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
    } catch (error) {
      alert("匿名登入錯誤：" + error.message);
    }
  };

  const forgotPassword = async () => {
    if (!email) {
      alert("請先在上方輸入您的 Email 信箱，系統才能寄送重設信給您！");
      return;
    }
    if (window.confirm(`確定要寄送重設密碼信件至 ${email} 嗎？`)) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        alert("📧 重設信已寄出！請檢查信箱。");
      } catch (error) {
        alert("發送失敗：" + error.message);
      }
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-main)' }}>載入中...</div>;
  }

  // --- 如果已經登入，顯示系統雛形或是回到原版 App ---
  if (user) {
    return <Dashboard user={user} handleLogout={handleLogout} />;
  }

  return (
    <div className="split-layout" id="landing-page" style={{ opacity: 1, transition: 'opacity 0.3s' }}>
        <div className="mobile-header">
            <div className="brand-logo">
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png" width="28" height="28" alt="Logo" />
                大學神隊友
            </div>
            <button className="btn-login-trigger" onClick={() => setShowModal(true)}>登 入</button>
        </div>
        <div className="left-panel">
            <div className="brand-logo desktop-logo">
                <img src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png" width="32" height="32" alt="Logo" />
                大學神隊友
            </div>
            <div className="hero-text">
                <h1>你的專屬校園導航系統</h1>
                <p className="hero-subtitle" style={{ fontSize: '1.15rem', marginTop: '15px', fontWeight: 500 }}>
                    你的課表、社團、校園生活，一站搞定
                </p>
            </div>
            <div className="feature-highlights">
                <div className="feature-item">
                    <span className="feature-icon">📅</span>
                    <div className="feature-text">
                        <strong>學生活動行事曆</strong>
                        <small>校園大小事與社團活動，一手掌握不錯過</small>
                    </div>
                </div>
                <div className="feature-item">
                    <span className="feature-icon">💰</span>
                    <div className="feature-text">
                        <strong>學生專屬記帳</strong>
                        <small>輕鬆管理生活費與各項開銷，月底不再吃土</small>
                    </div>
                </div>
            </div>
            <div
                style={{ position: 'absolute', bottom: '20px', left: 0, width: '100%', textAlign: 'center', fontSize: '0.85rem', opacity: 0.6, pointerEvents: 'none' }}>
                &copy; 2026 大學神隊友 All rights reserved.
            </div>
        </div>
        <div className={`right-panel ${showModal ? 'show-modal' : ''}`}>
            <div className="login-wrapper">
                <button className="btn-close-modal" onClick={() => setShowModal(false)}>✖</button>
                <h2>你的神隊友已上線</h2>
                <p className="subtitle">一鍵登入，全面掌握你的校園生活</p>
                <div className="primary-actions">
                    <button className="btn-massive btn-google-massive" onClick={loginWithGoogle}>
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="24" alt="Google" />
                        使用 Google 一鍵登入
                    </button>
                    <button className="btn-massive btn-guest-massive" onClick={loginAnonymously}>
                        👻 免裝備新手試用體驗
                    </button>
                </div>
                <div className="divider">或使用 Email 登入</div>
                <div className="secondary-login">
                    <div className="input-group">
                        <input type="email" placeholder="電子信箱" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="input-group" style={{ marginBottom: '10px' }}>
                        <input type="password" placeholder="密碼 (至少6位數)" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div className="login-options">
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input type="checkbox"
                                style={{ marginRight: '8px', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)} /> 保持登入
                        </label>
                        <a onClick={forgotPassword}>忘記密碼？</a>
                    </div>
                    <button className="btn-main-outline" onClick={handleLogin}>信箱登入</button>
                </div>
                <div className="toggle-mode">
                    <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>還不是校園王？</span>
                    <span onClick={registerAccount} style={{ marginLeft: '4px', cursor: 'pointer', color: 'var(--primary)', fontWeight: 'bold' }}>立即加入行列</span>
                </div>
            </div>
        </div>
    </div>
  );
}

export default App;
