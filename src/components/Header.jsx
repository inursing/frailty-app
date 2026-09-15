import React from 'react';
import {
  Activity,
  BookOpen,
  RotateCcw,
  Printer,
  ShieldCheck,
  Key,
  TrendingUp,
  UserCheck,
  LogOut,
  Shield,
  IdCard,
  FileCheck2
} from 'lucide-react';

export default function Header({
  activeTab = 'assessment',
  onSelectTab,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onReset,
  onOpenLogicModal,
  onOpenApiKeyModal,
  hasApiKey
}) {
  return (
    <header className="app-header">
      <div className="teaching-notice-bar">
        <div className="app-container teaching-notice-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <ShieldCheck size={16} color="#059669" />
            <span><strong>臨床教學與長期追蹤專用：</strong>整合 Firebase 去識別化研究編號資料庫，保護長者隱私，不存姓名與身分證字號。</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
            {currentUser?.isFirebaseOnline ? (
              <span style={{ color: '#047857', fontWeight: 600 }}>🔥 Firebase 雲端同步中</span>
            ) : (
              <span style={{ color: '#0369a1', fontWeight: 600 }}>⚡ 本機展示安全模式</span>
            )}
          </div>
        </div>
      </div>

      <div className="app-container">
        <div className="header-content" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <a
              href="#"
              className="brand-wrapper"
              title="回到即時評估首頁"
              onClick={(e) => { e.preventDefault(); onSelectTab('assessment'); }}
            >
              <div className="brand-icon">
                <Activity size={24} />
              </div>
              <div>
                <div className="brand-title">AI 衰弱評估系統</div>
                <div className="brand-subtitle">臨床護理教學與長期健康追蹤</div>
              </div>
            </a>

            {/* 核心分頁導覽列 (Tabs) */}
            <nav style={{
              display: 'flex',
              backgroundColor: '#f1f5f9',
              borderRadius: '10px',
              padding: '3px',
              border: '1px solid #cbd5e1'
            }}>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'assessment' ? 'btn-primary' : 'btn-outline'}`}
                style={{ border: 'none', padding: '0.4rem 0.875rem', fontSize: '0.85rem' }}
                onClick={() => onSelectTab('assessment')}
              >
                <FileCheck2 size={15} />
                <span>單次評估</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'tracking' ? 'btn-primary' : 'btn-outline'}`}
                style={{ border: 'none', padding: '0.4rem 0.875rem', fontSize: '0.85rem' }}
                onClick={() => onSelectTab('tracking')}
              >
                <TrendingUp size={15} />
                <span>我的追蹤趨勢</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'admin' ? 'btn-primary' : 'btn-outline'}`}
                style={{ border: 'none', padding: '0.4rem 0.875rem', fontSize: '0.85rem' }}
                onClick={() => onSelectTab('admin')}
              >
                <Shield size={15} />
                <span>管理者檢索</span>
              </button>
            </nav>
          </div>

          <div className="header-actions" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            {/* 研究編號登入身分狀態 */}
            {currentUser ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: currentUser.role === 'admin' ? '#ede9fe' : '#e0f2fe',
                border: `1px solid ${currentUser.role === 'admin' ? '#c4b5fd' : '#bae6fd'}`,
                padding: '0.25rem 0.625rem',
                borderRadius: '8px'
              }}>
                <IdCard size={15} color={currentUser.role === 'admin' ? '#6d28d9' : '#0369a1'} />
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: currentUser.role === 'admin' ? '#5b21b6' : '#075985' }}>
                  {currentUser.role === 'admin' ? `管理者 (${currentUser.subjectId})` : `研究編號：${currentUser.subjectId}`}
                </span>
                <button
                  type="button"
                  onClick={onLogout}
                  title="登出 / 切換研究編號"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px 4px',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={onOpenAuthModal}
                title="登入您的去識別化受試者研究編號或管理者帳號"
              >
                <UserCheck size={15} />
                <span>登入研究編號</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onOpenApiKeyModal}
              title="設定 Google Gemini API Key"
              style={{ position: 'relative' }}
            >
              <Key size={15} />
              <span>AI 模型</span>
              {hasApiKey && (
                <span style={{
                  width: '7px',
                  height: '7px',
                  backgroundColor: '#10b981',
                  borderRadius: '50%',
                  display: 'inline-block',
                  marginLeft: '2px'
                }} title="已配置 Gemini Key" />
              )}
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onOpenLogicModal}
              title="查看 Fried 衰弱五大指標判定切點與學理依據"
            >
              <BookOpen size={15} />
              <span>邏輯說明</span>
            </button>

            {activeTab === 'assessment' && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={onReset}
                title="重設所有資料回到起始狀態"
              >
                <RotateCcw size={15} />
                <span>重設</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

