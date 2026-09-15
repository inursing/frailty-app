import React from 'react';
import { ShieldCheck, Heart, GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-container footer-content">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--primary-800)', marginBottom: '0.25rem' }}>
            <GraduationCap size={18} />
            <span>AI 衰弱評估系統 (教學與研究專用版本)</span>
          </div>
          <p style={{ fontSize: '0.825rem' }}>
            標準依據：Cardiovascular Health Study (CHS) - Fried Frailty Phenotype (2001)
          </p>
        </div>

        <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', justifyContent: 'flex-end', color: '#16a34a', fontWeight: 600 }}>
            <ShieldCheck size={16} />
            <span>純本機運算 • 無個資雲端儲存</span>
          </div>
          <p style={{ color: '#94a3b8', marginTop: '0.2rem' }}>
            護理專業教學實務輔助工具 • 評估結果不構成臨床醫療處方
          </p>
        </div>
      </div>
    </footer>
  );
}
