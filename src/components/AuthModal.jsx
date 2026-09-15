import React, { useState } from 'react';
import {
  X,
  UserCheck,
  Shield,
  Lock,
  IdCard,
  KeyRound,
  Loader2,
  AlertCircle,
  Sparkles,
  Database
} from 'lucide-react';
import { loginWithSubjectId, loginAsAdmin, isFirebaseConfigured } from '../services/firebase.js';

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  initialSubjectId = ''
}) {
  const [authMode, setAuthMode] = useState('subject'); // 'subject' | 'admin'
  const [subjectId, setSubjectId] = useState(initialSubjectId || 'SUBJ-2026-001');
  const [pin, setPin] = useState('123456');
  const [adminId, setAdminId] = useState('ADMIN-001');
  const [adminPassword, setAdminPassword] = useState('admin123456');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (authMode === 'subject') {
        if (!subjectId.trim()) {
          throw new Error('請輸入有效的研究編號！');
        }
        const user = await loginWithSubjectId(subjectId.trim(), pin.trim() || 'password123');
        onLoginSuccess(user);
        onClose();
      } else {
        if (!adminId.trim()) {
          throw new Error('請輸入管理者代號！');
        }
        const adminUser = await loginAsAdmin(adminId.trim(), adminPassword.trim() || 'adminpassword');
        onLoginSuccess(adminUser);
        onClose();
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || '登入時發生問題，請確認輸入內容。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (sId) => {
    setSubjectId(sId);
    setPin('123456');
    setErrorMessage('');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-in-out'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* 標頭 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '8px',
              backgroundColor: authMode === 'subject' ? '#0284c7' : '#4f46e5',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {authMode === 'subject' ? <IdCard size={18} /> : <Shield size={18} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {authMode === 'subject' ? '受試者研究編號登入' : '研究管理者後台登入'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                {isFirebaseConfigured ? '🔥 Firebase 雲端認證模式' : '⚡ 本機展示與沙盒安全模式'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 模式切換分頁 */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f1f5f9' }}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              background: authMode === 'subject' ? 'white' : 'transparent',
              borderBottom: authMode === 'subject' ? '2px solid #0284c7' : 'none',
              fontWeight: authMode === 'subject' ? 700 : 500,
              color: authMode === 'subject' ? '#0284c7' : '#64748b',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
            onClick={() => { setAuthMode('subject'); setErrorMessage(''); }}
          >
            👤 受試者身分 (研究編號)
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              background: authMode === 'admin' ? 'white' : 'transparent',
              borderBottom: authMode === 'admin' ? '2px solid #4f46e5' : 'none',
              fontWeight: authMode === 'admin' ? 700 : 500,
              color: authMode === 'admin' ? '#4f46e5' : '#64748b',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
            onClick={() => { setAuthMode('admin'); setErrorMessage(''); }}
          >
            🛡️ 研究管理者身分
          </button>
        </div>

        {/* 表單內容 */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {errorMessage && (
            <div style={{
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              color: '#9f1239',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {authMode === 'subject' ? (
            <div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="auth-subject-id" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <IdCard size={15} />
                  <span>研究編號 (Subject ID)：</span>
                </label>
                <input
                  id="auth-subject-id"
                  type="text"
                  className="form-input"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value.toUpperCase())}
                  placeholder="例如：SUBJ-2026-001 或 A102"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  * 去識別化代號，請勿填寫身分證字號或姓名。
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="auth-subject-pin" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <KeyRound size={15} />
                  <span>專屬 PIN 碼 / 密碼：</span>
                </label>
                <input
                  id="auth-subject-pin"
                  type="password"
                  className="form-input"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="預設為 123456"
                  required
                />
              </div>

              {/* 快速填寫範例編號 (便利測試不同帳號之隔離性) */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1.25rem'
              }}>
                <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                  💡 快速切換測試個案（驗證資料隔離）：
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                    onClick={() => handleQuickFill('SUBJ-2026-001')}
                  >
                    個案一：SUBJ-2026-001
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                    onClick={() => handleQuickFill('SUBJ-2026-002')}
                  >
                    個案二：SUBJ-2026-002
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                    onClick={() => handleQuickFill('SUBJ-2026-003')}
                  >
                    個案三：SUBJ-2026-003
                  </button>
                </div>
              </div>

              {/* 隱私聲明 */}
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                fontSize: '0.8rem',
                color: '#166534',
                lineHeight: '1.5'
              }}>
                <Shield size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                <strong>隱私去識別化保護承諾：</strong>
                本系統嚴格遵循受試者個人資料保護規範，<strong>絕不採集亦不儲存真實姓名、身分證字號與出生日期</strong>。
              </div>
            </div>
          ) : (
            <div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="auth-admin-id" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Shield size={15} />
                  <span>管理者代號 (Admin ID)：</span>
                </label>
                <input
                  id="auth-admin-id"
                  type="text"
                  className="form-input"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="例如：ADMIN-001"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="auth-admin-password" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Lock size={15} />
                  <span>管理者授權密碼：</span>
                </label>
                <input
                  id="auth-admin-password"
                  type="password"
                  className="form-input"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="預設密碼 admin123456"
                  required
                />
              </div>

              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                fontSize: '0.8rem',
                color: '#1e40af',
                lineHeight: '1.5'
              }}>
                <strong>管理者職能：</strong>
                具備全院/研究計畫之跨個案檢索權限，可依受試者研究編號搜尋歷史數據並查看族群統計。
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className={`btn ${authMode === 'subject' ? 'btn-primary' : 'btn-secondary'}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>驗證中...</span>
                </>
              ) : (
                <>
                  <UserCheck size={16} />
                  <span>{authMode === 'subject' ? '確認登入 / 開始追蹤' : '管理者登入'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
