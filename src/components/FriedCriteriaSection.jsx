import React from 'react';
import {
  ClipboardCheck,
  TrendingDown,
  BatteryLow,
  Footprints,
  Gauge,
  Dumbbell,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Timer,
  Sliders,
  Scale,
  Ban,
  FileQuestion
} from 'lucide-react';
import {
  getGripCutoff,
  getWalkTimeCutoff,
  calculateBmi
} from '../constants/friedCriteria.js';

export default function FriedCriteriaSection({
  basicInfo,
  criteriaAnswers,
  onChangeCriteria,
  evaluationResults,
  onOpenLogicModal,
  unfilledItems = []
}) {
  const { gender, height, weight } = basicInfo;
  const { bmi } = calculateBmi(height, weight);
  const gripCutoff = getGripCutoff(gender || 'female', bmi);
  const walkCutoff = getWalkTimeCutoff(gender || 'female', height || 160);

  // 1. 體重減輕處理
  const wl = criteriaAnswers.weightLoss || { mode: 'direct', hasLoss: false };

  const handleWeightLossToggle = (hasLoss) => {
    onChangeCriteria('weightLoss', {
      ...wl,
      hasLoss,
      currentWeight: wl.currentWeight || weight || ''
    });
  };

  const handleWeightModeChange = (mode) => {
    onChangeCriteria('weightLoss', {
      ...wl,
      mode,
      currentWeight: wl.currentWeight || weight || ''
    });
  };

  const handleWeightDirectKg = (val) => {
    onChangeCriteria('weightLoss', {
      ...wl,
      hasLoss: true,
      lossKg: val ? Math.max(0, Number(val)) : ''
    });
  };

  const handleWeightPast = (val) => {
    onChangeCriteria('weightLoss', {
      ...wl,
      hasLoss: true,
      pastWeight: val ? Math.max(0, Number(val)) : ''
    });
  };

  const handleWeightCurrent = (val) => {
    onChangeCriteria('weightLoss', {
      ...wl,
      hasLoss: true,
      currentWeight: val ? Math.max(0, Number(val)) : ''
    });
  };

  // 2. 疲憊感處理
  const handleExhaustionChange = (freq) => {
    onChangeCriteria('exhaustion', { frequency: freq });
  };

  // 3. 活動量處理
  const handleActivityChange = (level) => {
    onChangeCriteria('physicalActivity', { level });
  };

  // 4. 步速處理
  const walkConf = criteriaAnswers.walkingSpeed || { method: 'measured' };

  const handleWalkMethodChange = (method) => {
    onChangeCriteria('walkingSpeed', {
      ...walkConf,
      method,
      selfReportStatus: method === 'self_report' ? (walkConf.selfReportStatus || 'difficult') : ''
    });
  };

  const handleWalkTimeChange = (val) => {
    onChangeCriteria('walkingSpeed', {
      ...walkConf,
      method: 'measured',
      walkTimeSeconds: val ? Math.max(0, Number(val)) : ''
    });
  };

  const handleWalkSelfReport = (status) => {
    onChangeCriteria('walkingSpeed', {
      ...walkConf,
      method: 'self_report',
      selfReportStatus: status
    });
  };

  // 5. 握力處理
  const gripConf = criteriaAnswers.gripStrength || { method: 'measured' };

  const handleGripMethodChange = (method) => {
    onChangeCriteria('gripStrength', {
      ...gripConf,
      method,
      selfReportStatus: method === 'self_report' ? (gripConf.selfReportStatus || 'difficult') : ''
    });
  };

  const handleGripKgChange = (val) => {
    onChangeCriteria('gripStrength', {
      ...gripConf,
      method: 'measured',
      gripKg: val ? Math.max(0, Number(val)) : ''
    });
  };

  const handleGripSelfReport = (status) => {
    onChangeCriteria('gripStrength', {
      ...gripConf,
      method: 'self_report',
      selfReportStatus: status
    });
  };

  const {
    weightLoss: resWL,
    exhaustion: resEx,
    physicalActivity: resAct,
    walkingSpeed: resWalk,
    gripStrength: resGrip
  } = evaluationResults.results;

  // 計算比較模式下的差額
  const pastWeightNum = Number(wl.pastWeight || 0);
  const currWeightNum = Number(wl.currentWeight || weight || 0);
  const diffKg = pastWeightNum > 0 && currWeightNum > 0 ? (pastWeightNum - currWeightNum).toFixed(1) : null;
  const diffPct = pastWeightNum > 0 && currWeightNum > 0 ? (((pastWeightNum - currWeightNum) / pastWeightNum) * 100).toFixed(1) : null;

  // 檢查個別項目是否未填完整
  const isWlUnfilled = unfilledItems.some(i => i.criterion === 'weightLoss');
  const isExUnfilled = unfilledItems.some(i => i.criterion === 'exhaustion');
  const isActUnfilled = unfilledItems.some(i => i.criterion === 'physicalActivity');
  const isWalkUnfilled = unfilledItems.some(i => i.criterion === 'walkingSpeed');
  const isGripUnfilled = unfilledItems.some(i => i.criterion === 'gripStrength');

  const scrollToField = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (el.focus) el.focus();
    }
  };

  return (
    <div className="section-card" id="criteria-section">
      <div className="section-header">
        <h2 className="section-title">
          <ClipboardCheck size={22} />
          <span>三、Fried Frailty Phenotype 衰弱五大表型評估</span>
        </h2>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={onOpenLogicModal}
        >
          <HelpCircle size={15} />
          <span>查看完整臨床切點標準</span>
        </button>
      </div>

      {/* 漏填提醒橫幅 */}
      {unfilledItems.length > 0 && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1.5px solid #f59e0b',
          borderRadius: '10px',
          padding: '0.875rem 1.25rem',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 4px rgba(245, 158, 11, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', fontWeight: 700, fontSize: '0.95rem' }}>
              <AlertCircle size={18} />
              <span>注意：尚有 {unfilledItems.length} 項評估資料待填寫或確認</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#92400e' }}>
              點擊下方標籤可快速跳轉至該輸入框
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {unfilledItems.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToField(item.id)}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #f59e0b',
                  color: '#92400e',
                  borderRadius: '9999px',
                  padding: '3px 10px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>⚠️ {item.label}</span>
                <span style={{ color: '#d97706', fontSize: '0.75rem' }}>↗</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="criteria-list">
        {/* ---------------- 1. 非預期性體重減輕 ---------------- */}
        <div className={`criterion-card ${resWL.isPositive ? 'positive' : ''}`} id="criterion-weight-loss">
          <div className="criterion-header">
            <div className="criterion-title-area">
              <span className="criterion-number">1</span>
              <div>
                <h3 className="criterion-title">非預期性體重減輕 (Shrinking / Weight Loss)</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  生理機轉：蛋白質異化消耗、營養不良或惡病質 (Cachexia)
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {isWlUnfilled ? (
                <span style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
                  ⚠️ 待填減輕數值
                </span>
              ) : (
                <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                  ✓ 已完成
                </span>
              )}
              <div className={`criterion-score-badge ${resWL.isPositive ? 'score-one' : 'score-zero'}`}>
                {resWL.isPositive ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
                <span>{resWL.isPositive ? '符合衰弱 (+1分)' : '正常 (0分)'}</span>
              </div>
            </div>
          </div>

          <div className="criterion-body">
            <div className="criterion-desc">
              <strong>評估標準：</strong>
              長者在<strong>無刻意節食或刻意減重</strong>情況下，過去一年內非自主體重減輕 ≥ 4.5 公斤或 ≥ 原體重 5.0%。
            </div>

            <div className="criterion-inputs">
              <div className="radio-group">
                <label className={`radio-card-label ${!wl.hasLoss ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="weight-loss-choice"
                    checked={!wl.hasLoss}
                    onChange={() => handleWeightLossToggle(false)}
                  />
                  <span>過去一年內<strong>無明顯非自主減輕</strong>（體重持平、增加，或屬自主健康減重）。</span>
                </label>

                <label className={`radio-card-label ${wl.hasLoss ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="weight-loss-choice"
                    checked={wl.hasLoss}
                    onChange={() => handleWeightLossToggle(true)}
                  />
                  <span>有<strong>非自主性體重減輕</strong>（胃口縮小、假牙鬆動或不明原因消瘦）。</span>
                </label>
              </div>

              {wl.hasLoss && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-800)' }}>
                      請選擇填寫方式：
                    </span>
                    <button
                      type="button"
                      className={`btn btn-sm ${wl.mode === 'direct' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => handleWeightModeChange('direct')}
                    >
                      方式一：直接輸入減輕公斤數
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${wl.mode === 'comparison' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => handleWeightModeChange('comparison')}
                    >
                      方式二：前一年 vs 目前體重比對
                    </button>
                  </div>

                  {wl.mode === 'direct' ? (
                    <div>
                      <label htmlFor="input-weight-loss-kg" className="form-label">
                        過去一年約減輕幾公斤：
                      </label>
                      <div className="input-suffix-wrapper" style={{ maxWidth: '240px' }}>
                        <input
                          id="input-weight-loss-kg"
                          type="number"
                          step="0.5"
                          min="0"
                          max="40"
                          className="form-input"
                          value={wl.lossKg || ''}
                          onChange={(e) => handleWeightDirectKg(e.target.value)}
                          placeholder="例如：5.0"
                        />
                        <span className="input-suffix">kg</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                          <label htmlFor="input-past-weight" className="form-label">
                            一年前體重 (Previous Weight)：
                          </label>
                          <div className="input-suffix-wrapper">
                            <input
                              id="input-past-weight"
                              type="number"
                              step="0.5"
                              min="20"
                              max="200"
                              className="form-input"
                              value={wl.pastWeight || ''}
                              onChange={(e) => handleWeightPast(e.target.value)}
                              placeholder="例如：60.0"
                            />
                            <span className="input-suffix">kg</span>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="input-curr-weight" className="form-label">
                            目前體重 (Current Weight)：
                          </label>
                          <div className="input-suffix-wrapper">
                            <input
                              id="input-curr-weight"
                              type="number"
                              step="0.5"
                              min="20"
                              max="200"
                              className="form-input"
                              value={wl.currentWeight || weight || ''}
                              onChange={(e) => handleWeightCurrent(e.target.value)}
                              placeholder="例如：54.5"
                            />
                            <span className="input-suffix">kg</span>
                          </div>
                        </div>
                      </div>

                      {diffKg !== null && (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: Number(diffKg) >= 4.5 || Number(diffPct) >= 5 ? '#b91c1c' : '#047857', fontWeight: 600 }}>
                          💡 體重變化試算：共減輕 <strong>{diffKg} kg</strong>（約 <strong>{diffPct}%</strong>）
                          {Number(diffKg) >= 4.5 || Number(diffPct) >= 5 ? ' —— 達衰弱切點 (≥4.5kg 或 ≥5%)！' : ' —— 尚未達衰弱門檻。'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="criterion-result-box">
              <div className="criterion-result-detail">
                <strong>判定依據：</strong> {resWL.detail}
              </div>
              <span className="criterion-cutoff-hint">切點：≥ 4.5kg 或 ≥ 5%</span>
            </div>
          </div>
        </div>

        {/* ---------------- 2. 自覺疲憊感 ---------------- */}
        <div className={`criterion-card ${resEx.isPositive ? 'positive' : ''}`} id="criterion-exhaustion">
          <div className="criterion-header">
            <div className="criterion-title-area">
              <span className="criterion-number">2</span>
              <div>
                <h3 className="criterion-title">自覺疲憊感 (Exhaustion)</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  生理機轉：自覺精力耗竭、慢性低度發炎、神經內分泌功能衰退
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {isExUnfilled ? (
                <span style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
                  ⚠️ 待選擇頻率
                </span>
              ) : (
                <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                  ✓ 已完成
                </span>
              )}
              <div className={`criterion-score-badge ${resEx.isPositive ? 'score-one' : 'score-zero'}`}>
                {resEx.isPositive ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
                <span>{resEx.isPositive ? '符合衰弱 (+1分)' : '正常 (0分)'}</span>
              </div>
            </div>
          </div>

          <div className="criterion-body">
            <div className="criterion-desc">
              <strong>評估標準 (CES-D 篩檢問卷)：</strong>
              詢問長者在過去一週中，「做任何事都覺得很費力」或「無法打起精神做事」出現的頻率：
            </div>

            <div className="criterion-inputs">
              <div className="radio-group">
                <label className={`radio-card-label ${criteriaAnswers.exhaustion?.frequency === 'rarely' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="exhaustion-choice"
                    checked={criteriaAnswers.exhaustion?.frequency === 'rarely'}
                    onChange={() => handleExhaustionChange('rarely')}
                  />
                  <span><strong>少於 1 天：</strong>幾乎沒有或無此感覺，精神活力良好。</span>
                </label>

                <label className={`radio-card-label ${criteriaAnswers.exhaustion?.frequency === 'sometimes' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="exhaustion-choice"
                    checked={criteriaAnswers.exhaustion?.frequency === 'sometimes'}
                    onChange={() => handleExhaustionChange('sometimes')}
                  />
                  <span><strong>1 至 2 天：</strong>偶爾感到微有負擔或疲憊，但可自行調適。</span>
                </label>

                <label className={`radio-card-label ${criteriaAnswers.exhaustion?.frequency === 'often' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="exhaustion-choice"
                    checked={criteriaAnswers.exhaustion?.frequency === 'often'}
                    onChange={() => handleExhaustionChange('often')}
                  />
                  <span><strong>3 天或以上：</strong>經常或大部分時間覺得做事很費力、提不起勁（符合疲憊表型）。</span>
                </label>
              </div>
            </div>

            <div className="criterion-result-box">
              <div className="criterion-result-detail">
                <strong>判定依據：</strong> {resEx.detail}
              </div>
              <span className="criterion-cutoff-hint">切點：過去一週 ≥ 3-4天</span>
            </div>
          </div>
        </div>

        {/* ---------------- 3. 身體活動量偏低 ---------------- */}
        <div className={`criterion-card ${resAct.isPositive ? 'positive' : ''}`} id="criterion-physical-activity">
          <div className="criterion-header">
            <div className="criterion-title-area">
              <span className="criterion-number">3</span>
              <div>
                <h3 className="criterion-title">身體活動量偏低 (Low Physical Activity)</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  生理機轉：長期臥床坐式生活、肌肉廢用性萎縮、心肺耐力流失
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {isActUnfilled ? (
                <span style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
                  ⚠️ 待選擇活動量
                </span>
              ) : (
                <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                  ✓ 已完成
                </span>
              )}
              <div className={`criterion-score-badge ${resAct.isPositive ? 'score-one' : 'score-zero'}`}>
                {resAct.isPositive ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
                <span>{resAct.isPositive ? '符合衰弱 (+1分)' : '正常 (0分)'}</span>
              </div>
            </div>
          </div>

          <div className="criterion-body">
            <div className="criterion-desc">
              <strong>評估標準 (Minnesota 休閒活動問卷標準)：</strong>
              長者每週休閒運動消耗熱量低於門檻（男性每週 &lt; 383 kcal、女性每週 &lt; 270 kcal；或相當於每週極少/無運動）。
            </div>

            <div className="criterion-inputs">
              <div className="radio-group">
                <label className={`radio-card-label ${criteriaAnswers.physicalActivity?.level === 'active' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="activity-choice"
                    checked={criteriaAnswers.physicalActivity?.level === 'active'}
                    onChange={() => handleActivityChange('active')}
                  />
                  <span><strong>規律運動 / 活躍：</strong>每週散步、慢跑、太極拳、體操或農作多於 2 小時。</span>
                </label>

                <label className={`radio-card-label ${criteriaAnswers.physicalActivity?.level === 'moderate' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="activity-choice"
                    checked={criteriaAnswers.physicalActivity?.level === 'moderate'}
                    onChange={() => handleActivityChange('moderate')}
                  />
                  <span><strong>中度活動：</strong>每週偶爾散步約 1 小時、操持日常家務，無規律體能鍛鍊。</span>
                </label>

                <label className={`radio-card-label ${criteriaAnswers.physicalActivity?.level === 'low' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="activity-choice"
                    checked={criteriaAnswers.physicalActivity?.level === 'low'}
                    onChange={() => handleActivityChange('low')}
                  />
                  <span><strong>活動量偏低 / 久坐：</strong>絕大多數時間坐著看電視或躺臥，幾乎無外出活動。</span>
                </label>
              </div>
            </div>

            <div className="criterion-result-box">
              <div className="criterion-result-detail">
                <strong>判定依據：</strong> {resAct.detail}
              </div>
              <span className="criterion-cutoff-hint">切點：男&lt;383 / 女&lt;270 kcal/週</span>
            </div>
          </div>
        </div>

        {/* ---------------- 4. 行走速度慢（支援實測 / 無法測量 / 自評問卷） ---------------- */}
        <div className={`criterion-card ${resWalk.isPositive ? 'positive' : ''}`} id="criterion-walking-speed">
          <div className="criterion-header">
            <div className="criterion-title-area">
              <span className="criterion-number">4</span>
              <div>
                <h3 className="criterion-title">行走速度慢 (Slowness / Walking Speed)</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  生理機轉：下肢肌力衰退、動態平衡減弱、跌倒風險指標
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {isWalkUnfilled ? (
                <span style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
                  ⚠️ 待測量或自評
                </span>
              ) : (
                <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                  ✓ 已完成
                </span>
              )}
              <div className={`criterion-score-badge ${resWalk.isPositive ? 'score-one' : 'score-zero'}`}>
                {resWalk.isPositive ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
                <span>{resWalk.isPositive ? '符合衰弱 (+1分)' : '正常 (0分)'}</span>
              </div>
            </div>
          </div>

          <div className="criterion-body">
            <div className="criterion-desc">
              <strong>評估標準：</strong>
              4公尺平地步行測試。依性別與身高門檻判定（男 ≤173cm: ≥5.76s；女 ≤159cm: ≥6.43s）。
              <br />
              💡 <strong>臨床實務指引：</strong>若長者因身體虛弱、臥床、雙腳癱瘓無法施測，依 <strong>Fried 原著標準視為符合衰弱表型 (計1分)</strong>；若無場地或碼錶，可改用日常步態自評。
            </div>

            <div className="criterion-inputs">
              {/* 測量狀態選擇 */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${walkConf.method === 'measured' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleWalkMethodChange('measured')}
                >
                  <Timer size={14} />
                  <span>模式一：4公尺實測計時</span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm ${walkConf.method === 'unable' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleWalkMethodChange('unable')}
                >
                  <Ban size={14} />
                  <span>模式二：因身體衰弱/臥床/需輪椅而「無法測量」</span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm ${walkConf.method === 'self_report' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleWalkMethodChange('self_report')}
                >
                  <FileQuestion size={14} />
                  <span>模式三：現場無空間碼錶，使用「臨床日常步態自評」</span>
                </button>
              </div>

              {/* 實測輸入 */}
              {walkConf.method === 'measured' && (
                <div style={{ padding: '0.875rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ maxWidth: '240px' }}>
                      <label htmlFor="input-walk-time" className="form-label">
                        <Timer size={16} />
                        <span>4公尺平地步行實測耗時：</span>
                      </label>
                      <div className="input-suffix-wrapper">
                        <input
                          id="input-walk-time"
                          type="number"
                          step="0.1"
                          min="1.0"
                          max="40.0"
                          className="form-input"
                          value={walkConf.walkTimeSeconds || ''}
                          onChange={(e) => handleWalkTimeChange(e.target.value)}
                          placeholder="例如：5.5"
                        />
                        <span className="input-suffix">秒 (sec)</span>
                      </div>
                    </div>

                    {Number(walkConf.walkTimeSeconds) > 0 && (
                      <div style={{ fontSize: '0.9rem', color: '#475569', alignSelf: 'flex-end', paddingBottom: '0.5rem' }}>
                        折合步速約：<strong>{(4 / Number(walkConf.walkTimeSeconds)).toFixed(2)} m/s</strong>
                        （AWGS 亞洲肌少症切點：步速 &lt; 1.0 或 &lt; 0.8 m/s 提示肌少與跌倒風險）
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 無法測量情況 */}
              {walkConf.method === 'unable' && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#fff1f2',
                  borderRadius: '8px',
                  border: '1.5px solid #fecdd3',
                  fontSize: '0.9rem',
                  color: '#9f1239',
                  lineHeight: '1.6'
                }}>
                  <strong>臨床判定依據 (Fried CHS 原著準則)：</strong>
                  <br />
                  長者若因嚴重生理衰弱 (Physical frailty)、下肢骨折剛術後、神經損傷偏癱、完全臥床或長期依賴輪椅而<strong>客觀上無法站立完成 4 公尺行走</strong>，在流行病學與周全評估中<strong>直接判定符合此項衰弱指標（計 1 分）</strong>，並需加強防跌與壓瘡照護。
                </div>
              )}

              {/* 自評問卷替代 */}
              {walkConf.method === 'self_report' && (
                <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '0.5rem' }}>
                    SARC-F / CHS 替代臨床問診（詢問長者或照顧者）：
                  </div>
                  <div className="radio-group">
                    <label className={`radio-card-label ${walkConf.selfReportStatus === 'normal' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="walk-self-report"
                        checked={walkConf.selfReportStatus === 'normal'}
                        onChange={() => handleWalkSelfReport('normal')}
                      />
                      <span><strong>行走正常獨立：</strong>在平地走一個街區或過斑馬線無特殊困難，不需他人扶持。</span>
                    </label>

                    <label className={`radio-card-label ${walkConf.selfReportStatus === 'difficult' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="walk-self-report"
                        checked={walkConf.selfReportStatus === 'difficult'}
                        onChange={() => handleWalkSelfReport('difficult')}
                      />
                      <span><strong>行走顯著緩慢或需攙扶：</strong>在室內走動非常費力緩慢、需雙人扶持/助行器，或無法在綠燈時間內過馬路（符合步態衰弱）。</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="criterion-result-box">
              <div className="criterion-result-detail">
                <strong>判定依據：</strong> {resWalk.detail}
              </div>
              <span className="criterion-cutoff-hint">{walkCutoff.ruleLabel}</span>
            </div>
          </div>
        </div>

        {/* ---------------- 5. 握力低（支援實測 / 無法測量 / 提重自評） ---------------- */}
        <div className={`criterion-card ${resGrip.isPositive ? 'positive' : ''}`} id="criterion-grip-strength">
          <div className="criterion-header">
            <div className="criterion-title-area">
              <span className="criterion-number">5</span>
              <div>
                <h3 className="criterion-title">握力偏低 (Weakness / Low Grip Strength)</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  生理機轉：全身骨骼肌肌肉量減少 (Sarcopenia)、上肢爆發力減退
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {isGripUnfilled ? (
                <span style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
                  ⚠️ 待測量或自評
                </span>
              ) : (
                <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                  ✓ 已完成
                </span>
              )}
              <div className={`criterion-score-badge ${resGrip.isPositive ? 'score-one' : 'score-zero'}`}>
                {resGrip.isPositive ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
                <span>{resGrip.isPositive ? '符合衰弱 (+1分)' : '正常 (0分)'}</span>
              </div>
            </div>
          </div>

          <div className="criterion-body">
            <div className="criterion-desc">
              <strong>評估標準：</strong>
              使用握力計測量慣用手最大握力 (kg)，依性別與個人 BMI 交叉切點判定（目前切點：<strong>≤ {gripCutoff.cutoff} kg</strong>）。
              <br />
              💡 <strong>臨床實務指引：</strong>若長者因手部關節變形、中風或無握力計，可依 <strong>Fried 原著無法操作直接計 1 分</strong>，或以 SARC-F「提拿 5 公斤重物」問診作為臨床替代依據。
            </div>

            <div className="criterion-inputs">
              {/* 測量狀態選擇 */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${gripConf.method === 'measured' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleGripMethodChange('measured')}
                >
                  <Dumbbell size={14} />
                  <span>模式一：握力計實測數值 (kg)</span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm ${gripConf.method === 'unable' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleGripMethodChange('unable')}
                >
                  <Ban size={14} />
                  <span>模式二：因中風偏癱/關節攣縮而「無法測量」</span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm ${gripConf.method === 'self_report' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleGripMethodChange('self_report')}
                >
                  <FileQuestion size={14} />
                  <span>模式三：現場無握力計，使用「提拿 5 公斤重物自評」</span>
                </button>
              </div>

              {/* 實測握力輸入 */}
              {gripConf.method === 'measured' && (
                <div style={{ padding: '0.875rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div className="form-group" style={{ maxWidth: '240px' }}>
                    <label htmlFor="input-grip-strength" className="form-label">
                      <Dumbbell size={16} />
                      <span>實測握力最大數值：</span>
                    </label>
                    <div className="input-suffix-wrapper">
                      <input
                        id="input-grip-strength"
                        type="number"
                        step="0.5"
                        min="0"
                        max="90"
                        className="form-input"
                        value={gripConf.gripKg || ''}
                        onChange={(e) => handleGripKgChange(e.target.value)}
                        placeholder="例如：24.0"
                      />
                      <span className="input-suffix">kg</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 無法測量情況 */}
              {gripConf.method === 'unable' && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#fff1f2',
                  borderRadius: '8px',
                  border: '1.5px solid #fecdd3',
                  fontSize: '0.9rem',
                  color: '#9f1239',
                  lineHeight: '1.6'
                }}>
                  <strong>臨床判定依據 (Fried CHS 原著準則)：</strong>
                  <br />
                  長者若因中風後偏癱、類風濕性關節炎嚴重手部變形攣縮、或因極度衰弱無力而<strong>客觀上無法握緊握力計施力</strong>，依原著標準<strong>直接判定符合握力偏低表型（計 1 分）</strong>。
                </div>
              )}

              {/* 提重自評替代 */}
              {gripConf.method === 'self_report' && (
                <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '0.5rem' }}>
                    SARC-F 肌少症提重功能問卷替代：
                  </div>
                  <div className="radio-group">
                    <label className={`radio-card-label ${gripConf.selfReportStatus === 'normal' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="grip-self-report"
                        checked={gripConf.selfReportStatus === 'normal'}
                        onChange={() => handleGripSelfReport('normal')}
                      />
                      <span><strong>沒有困難：</strong>提拿或搬運 5 公斤重物（如一整包大米、裝滿的水壺或菜籃）感到輕鬆。</span>
                    </label>

                    <label className={`radio-card-label ${gripConf.selfReportStatus === 'difficult' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="grip-self-report"
                        checked={gripConf.selfReportStatus === 'difficult'}
                        onChange={() => handleGripSelfReport('difficult')}
                      />
                      <span><strong>有困難或完全無法提拿：</strong>雙手無力，提拿 5 公斤重物感到非常吃力或根本拿不起來（符合低肌力表型）。</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="criterion-result-box">
              <div className="criterion-result-detail">
                <strong>判定依據：</strong> {resGrip.detail}
              </div>
              <span className="criterion-cutoff-hint">目前門檻：≤ {gripCutoff.cutoff} kg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
