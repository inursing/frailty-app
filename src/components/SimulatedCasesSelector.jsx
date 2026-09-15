import React from 'react';
import { Users, CheckCircle2, Info } from 'lucide-react';
import { SIMULATED_CASES } from '../constants/simulatedCases.js';

export default function SimulatedCasesSelector({ selectedCaseId, onSelectCase }) {
  return (
    <div className="case-selector-bar">
      <div className="case-selector-header">
        <div className="case-selector-title">
          <Users size={18} />
          <span>臨床教學模擬案例庫（點擊一鍵填入標準範例）</span>
        </div>
        <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
          適合護理實作課堂演練與驗證判定結果
        </span>
      </div>

      <div className="case-cards-grid">
        {SIMULATED_CASES.map((item) => {
          const isSelected = selectedCaseId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`case-card-btn ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectCase(item)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span className={`case-tag ${item.tagColor}`}>
                  {item.tag}
                </span>
                {isSelected && <CheckCircle2 size={16} color="#1e3a8a" />}
              </div>

              <div className="case-card-name">{item.name}</div>
              <div className="case-card-summary">{item.description}</div>
            </button>
          );
        })}
      </div>

      {selectedCaseId && (
        <div style={{
          marginTop: '1rem',
          backgroundColor: '#eff6ff',
          borderLeft: '4px solid #1d4ed8',
          padding: '0.75rem 1rem',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
          fontSize: '0.875rem',
          color: '#1e3a8a'
        }}>
          <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            {SIMULATED_CASES.find(c => c.id === selectedCaseId)?.learningNotes}
          </div>
        </div>
      )}
    </div>
  );
}
