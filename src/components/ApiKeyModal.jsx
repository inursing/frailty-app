import React, { useState } from 'react';
import { Key, X, Check, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose, apiKey, onSaveApiKey }) {
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveApiKey(inputKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setInputKey('');
    onSaveApiKey('');
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Key size={20} />
            <span>AI 大語言模型設定 (Google Gemini)</span>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClose}
            aria-label="關閉"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              color: '#1e3a8a',
              lineHeight: '1.6'
            }}>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                <Sparkles size={16} />
                <span>雙軌 AI 機制說明：</span>
              </div>
              • <strong>若有 Gemini API Key</strong>：系統將直接呼叫 Google Gemini 1.5/2.0 Flash 進行深層臨床個案推理。
              <br />
              • <strong>若無 API Key 也完全沒問題</strong>：系統將自動啟動內建的「智慧臨床決策合成引擎」，嚴格根據您輸入之長者年齡、體重、五項數值與病史動態精算蛋白質與客製處方！
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="input-gemini-key" className="form-label">
                Google Gemini API Key：
              </label>
              <input
                id="input-gemini-key"
                type="password"
                className="form-input"
                placeholder="貼上 AI Studio 取得之 API Key (AIzaSy...)"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
              />
              <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                * Key 僅儲存於本機瀏覽器 localStorage，絕不上傳第三方伺服器。
              </span>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>尚未有 API Key？</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#1d4ed8', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <span>前往 Google AI Studio 免費申請</span>
                <ExternalLink size={14} />
              </a>
            </div>

            {savedSuccess && (
              <div style={{
                marginTop: '1rem',
                backgroundColor: '#ecfdf5',
                color: '#047857',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Check size={16} />
                <span>API Key 已成功儲存！</span>
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ gap: '0.75rem' }}>
            {apiKey && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleClear}
                style={{ marginRight: 'auto', color: '#e11d48' }}
              >
                清除儲存的 Key
              </button>
            )}
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              儲存設定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
