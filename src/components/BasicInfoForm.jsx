import React from 'react';
import { User, Scale, Shield, AlertCircle, Calendar } from 'lucide-react';
import { calculateBmi } from '../constants/friedCriteria.js';

export default function BasicInfoForm({ basicInfo, onChange, unfilledItems = [] }) {
  const { assessmentDate, age, gender, height, weight } = basicInfo;
  const { bmi, label: bmiLabel, badgeColor } = calculateBmi(height, weight);

  const isAssessmentDateMissing = unfilledItems.some(i => i.id === 'input-assessment-date');
  const isAgeMissing = unfilledItems.some(i => i.id === 'input-age');
  const isGenderMissing = unfilledItems.some(i => i.id === 'select-gender');
  const isHeightMissing = unfilledItems.some(i => i.id === 'input-height');
  const isWeightMissing = unfilledItems.some(i => i.id === 'input-weight');

  const handleFieldChange = (field, val) => {
    onChange({
      ...basicInfo,
      [field]: val
    });
  };

  return (
    <div className="section-card" id="basic-info-section">
      <div className="section-header">
        <h2 className="section-title">
          <User size={22} />
          <span>二、受試長者基本資料</span>
        </h2>
        <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
          * 支援自訂評估日期（可補登歷史紀錄），身高體重性別連動計算切點與處方
        </span>
      </div>

      {(isAssessmentDateMissing || isAgeMissing || isGenderMissing || isHeightMissing || isWeightMissing) && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          padding: '0.625rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.85rem',
          color: '#92400e'
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>
            <strong>請先完善基本資料：</strong>
            填寫評估日期、性別、身高與體重，才能精準匹配 Linda Fried 臨床切點與每日蛋白質熱量需求。
          </span>
        </div>
      )}

      <div className="form-grid">
        {/* 評估日期 */}
        <div className="form-group">
          <label htmlFor="input-assessment-date" className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={15} color="#0284c7" />
              <span>評估日期 (Assessment Date)</span>
            </span>
            {isAssessmentDateMissing ? (
              <span style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: 700 }}>
                ⚠️ 待選擇
              </span>
            ) : (
              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                可填今日或過去日期
              </span>
            )}
          </label>
          <input
            id="input-assessment-date"
            type="date"
            className="form-input"
            style={isAssessmentDateMissing ? { borderColor: '#f59e0b', backgroundColor: '#fffdfa' } : {}}
            value={assessmentDate || new Date().toISOString().slice(0, 10)}
            onChange={(e) => handleFieldChange('assessmentDate', e.target.value)}
            title="可自由選擇今日或過去實際施測之日期（允許補登過去歷史評估）"
          />
        </div>
        {/* 年齡 */}
        <div className="form-group">
          <label htmlFor="input-age" className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>年齡 (Age)</span>
            {isAgeMissing && (
              <span style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: 700 }}>
                ⚠️ 待填寫
              </span>
            )}
          </label>
          <div className="input-suffix-wrapper">
            <input
              id="input-age"
              type="number"
              min="50"
              max="115"
              step="1"
              className="form-input"
              style={isAgeMissing ? { borderColor: '#f59e0b', backgroundColor: '#fffdfa' } : {}}
              value={age || ''}
              onChange={(e) => handleFieldChange('age', e.target.value ? Number(e.target.value) : '')}
              placeholder="例如：75"
            />
            <span className="input-suffix">歲</span>
          </div>
        </div>

        {/* 生理性別 */}
        <div className="form-group">
          <label htmlFor="select-gender" className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>生理性別 (Sex)</span>
            {isGenderMissing && (
              <span style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: 700 }}>
                ⚠️ 待選擇
              </span>
            )}
          </label>
          <select
            id="select-gender"
            className="form-select"
            style={isGenderMissing ? { borderColor: '#f59e0b', backgroundColor: '#fffdfa' } : {}}
            value={gender}
            onChange={(e) => handleFieldChange('gender', e.target.value)}
          >
            <option value="">請選擇性別 (Sex)</option>
            <option value="male">男性 (Male)</option>
            <option value="female">女性 (Female)</option>
          </select>
        </div>

        {/* 身高 */}
        <div className="form-group">
          <label htmlFor="input-height" className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>身高 (Height)</span>
            {isHeightMissing && (
              <span style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: 700 }}>
                ⚠️ 待填寫
              </span>
            )}
          </label>
          <div className="input-suffix-wrapper">
            <input
              id="input-height"
              type="number"
              min="100"
              max="220"
              step="0.5"
              className="form-input"
              style={isHeightMissing ? { borderColor: '#f59e0b', backgroundColor: '#fffdfa' } : {}}
              value={height || ''}
              onChange={(e) => handleFieldChange('height', e.target.value ? Number(e.target.value) : '')}
              placeholder="例如：165"
            />
            <span className="input-suffix">cm</span>
          </div>
        </div>

        {/* 體重 */}
        <div className="form-group">
          <label htmlFor="input-weight" className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>目前體重 (Weight)</span>
            {isWeightMissing && (
              <span style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: 700 }}>
                ⚠️ 待填寫
              </span>
            )}
          </label>
          <div className="input-suffix-wrapper">
            <input
              id="input-weight"
              type="number"
              min="25"
              max="200"
              step="0.5"
              className="form-input"
              style={isWeightMissing ? { borderColor: '#f59e0b', backgroundColor: '#fffdfa' } : {}}
              value={weight || ''}
              onChange={(e) => handleFieldChange('weight', e.target.value ? Number(e.target.value) : '')}
              placeholder="例如：60"
            />
            <span className="input-suffix">kg</span>
          </div>
        </div>
      </div>

      {/* 自動計算 BMI 成果展示 */}
      <div className="bmi-display-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '8px',
            backgroundColor: '#d1fae5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Scale size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
              自動計算身體質量指數 (BMI)：
            </div>
            <div className="bmi-val-group">
              <span className="bmi-val-number">{bmi > 0 ? bmi : '--'}</span>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>kg/m²</span>
              {bmi > 0 && (
                <span className={`bmi-badge ${badgeColor}`} style={{ marginLeft: '0.5rem' }}>
                  {bmiLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.825rem', color: '#475569', maxWidth: '380px' }}>
          💡 <strong>護理教學備註：</strong>
          Fried 握力切點標準會根據性別與 BMI 等級動態調整（例如女性 BMI&gt;29.0 之握力門檻需達 21kg）。
        </div>
      </div>

      <div className="privacy-notice">
        <Shield size={16} color="#16a34a" />
        <span>本系統尊重隱私：所有填寫之基本資料僅保存在目前瀏覽器記憶體中，絕不上傳任何外部伺服器。</span>
      </div>
    </div>
  );
}
