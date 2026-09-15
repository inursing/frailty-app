import React from 'react';
import { Stethoscope, Plus, Check } from 'lucide-react';

const COMMON_CONDITIONS = [
  '高血壓 (Hypertension)',
  '第二型糖尿病 (Type 2 DM)',
  '骨質疏鬆症 (Osteoporosis)',
  '退化性膝關節炎 (Knee OA)',
  '慢性心臟衰竭 (CHF)',
  '近半年曾有跌倒經驗',
  '假牙不合 / 咀嚼吞嚥稍有困難',
  '獨居長者 / 社交互動較少',
  '多重用藥 (正在服用 ≥ 5 種藥物)',
  '睡眠障礙 / 經常夜醒'
];

export default function ClinicalNotesInput({ clinicalNotes, onChange }) {
  const handleToggleTag = (tag) => {
    let current = clinicalNotes.trim();
    if (current.includes(tag)) {
      // 移除
      const updated = current
        .split('\n')
        .filter(line => !line.includes(tag))
        .join('\n')
        .replace(tag, '')
        .trim();
      onChange(updated);
    } else {
      // 加入
      const separator = current.length > 0 ? '、' : '';
      onChange(`${current}${separator}${tag}`);
    }
  };

  return (
    <div className="section-card" id="clinical-notes-section">
      <div className="section-header">
        <h2 className="section-title">
          <Stethoscope size={22} />
          <span>選填：臨床病史與生活情境補充（供 AI 生成客製化專屬處方）</span>
        </h2>
        <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
          * 讓大語言模型 (LLM) 深入考量長者共病與照護情境
        </span>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          常見長者共病與臨床情境（點擊可快速加入或移除）：
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {COMMON_CONDITIONS.map((cond) => {
            const isSelected = clinicalNotes.includes(cond);
            return (
              <button
                key={cond}
                type="button"
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                style={{ borderRadius: '9999px', fontSize: '0.825rem', padding: '0.3rem 0.75rem' }}
                onClick={() => handleToggleTag(cond)}
              >
                {isSelected ? <Check size={14} /> : <Plus size={14} />}
                <span>{cond}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="clinical-notes-textarea" className="form-label">
          補充備註說明（可自由輸入長者主訴、進食胃口、步態特徵或照顧者反應）：
        </label>
        <textarea
          id="clinical-notes-textarea"
          className="form-input"
          rows={3}
          value={clinicalNotes}
          onChange={(e) => onChange(e.target.value)}
          placeholder="例如：長者自述近兩個月容易在下午感到雙腳無力，下樓梯需緊握扶手；胃口偏小，平時早餐多吃白稀飯配醬瓜..."
          style={{ resize: 'vertical', width: '100%', lineHeight: '1.6' }}
        />
      </div>
    </div>
  );
}
