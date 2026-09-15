import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  FileCheck,
  Lock,
  EyeOff,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function ConsentModal({
  isOpen,
  onClose,
  onConfirmConsent,
  subjectId
}) {
  const [isChecked, setIsChecked] = useState(true);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!isChecked) {
      alert('請先勾選同意書確認條款，以繼續保存評估紀錄。');
      return;
    }
    onConfirmConsent();
    onClose();
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
        maxWidth: '540px',
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
          backgroundColor: '#f0fdf4',
          borderBottom: '1px solid #bbf7d0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '8px',
              backgroundColor: '#10b981',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#065f46', margin: 0 }}>
                健康資料保存知情同意書
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#047857', margin: '2px 0 0 0' }}>
                受試者研究編號：<strong>{subjectId || '未指定'}</strong>
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

        {/* 條款內容 */}
        <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.25rem',
            fontSize: '0.875rem',
            color: '#334155',
            lineHeight: '1.7'
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: 0, marginBottom: '0.5rem' }}>
              一、資料收集目的與去識別化保障
            </h4>
            <p style={{ margin: '0 0 0.75rem 0' }}>
              本系統由學術教學與高齡健康照護團隊建置，旨在協助長者進行衰弱與肌力之長期縱向趨勢追蹤。
            </p>

            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '0.75rem',
              display: 'flex',
              gap: '0.5rem',
              fontSize: '0.825rem',
              color: '#1e40af'
            }}>
              <EyeOff size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>嚴格隱私去識別化保護：</strong>
                系統<strong>絕不收集、亦不儲存任何真實姓名、身分證字號或出生年月日</strong>。所有數據僅與您的專屬「研究編號」配對。
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '1rem', marginBottom: '0.5rem' }}>
              二、本次即將保存之項目
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.825rem' }}>
              <li>評估日期與時間戳記</li>
              <li>Fried 總分 (0-5分) 與衰弱等級判定</li>
              <li>體重 (kg)、身高 (cm) 與 BMI 指數</li>
              <li>實測 4 公尺步行時間與握力測量數值</li>
              <li>自覺疲憊頻率與每週身體活動量等級</li>
            </ul>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '1rem', marginBottom: '0.5rem' }}>
              三、受試者自主權益
            </h4>
            <p style={{ margin: 0, fontSize: '0.825rem' }}>
              您可隨時在「我的追蹤趨勢」頁面中檢視全部歷史折線圖，並可一鍵匯出個人 CSV 資料備份。
            </p>
          </div>

          {/* 同意確認勾選 */}
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.625rem',
            cursor: 'pointer',
            padding: '0.75rem',
            backgroundColor: '#f0fdf4',
            border: '1.5px solid #86efac',
            borderRadius: '8px'
          }}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#065f46', lineHeight: '1.5' }}>
              我已詳閱上述說明，同意在去識別化原則下，將本次衰弱評估結果保存至長期追蹤健康資料庫中。
            </span>
          </label>
        </div>

        {/* 頁尾按鈕 */}
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem'
        }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
          >
            暫不保存
          </button>
          <button
            type="button"
            className="btn btn-emerald"
            onClick={handleConfirm}
            disabled={!isChecked}
          >
            <CheckCircle2 size={16} />
            <span>同意並保存評估紀錄</span>
          </button>
        </div>
      </div>
    </div>
  );
}
