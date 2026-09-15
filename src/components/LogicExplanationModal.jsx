import React from 'react';
import { X, BookOpen, ExternalLink, HelpCircle, Check, AlertCircle } from 'lucide-react';
import { GRIP_STRENGTH_CUTOFFS, WALKING_TIME_CUTOFFS } from '../constants/friedCriteria.js';

export default function LogicExplanationModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <BookOpen size={22} />
            <span>為什麼這樣判定？—— Fried 衰弱表型臨床判定邏輯教學</span>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClose}
            aria-label="關閉彈出視窗"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ marginBottom: '1rem', color: '#334155' }}>
            本系統依據 Linda P. Fried 教授於 2001 年在美國心血管健康研究（Cardiovascular Health Study, CHS）所發表的經典衰弱表型（Fried Frailty Phenotype）。
            衰弱並非正常老化的必然結果，而是一種<strong>生理儲備量下降、對外在壓力脆弱性升高</strong>的多重系統生理衰退狀態。
          </p>

          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-800)', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
            一、總分分級標準 (Score Grading)
          </h4>
          <table className="modal-table">
            <thead>
              <tr>
                <th>符合項目總數</th>
                <th>衰弱風險等級</th>
                <th>臨床意義與處置方向</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: '#ecfdf5' }}>
                <td><strong>0 分</strong></td>
                <td><strong style={{ color: '#059669' }}>健壯 (Robust)</strong></td>
                <td>生理儲備良好。重點在於常規維護、健康飲食與維持規律肌力運動。</td>
              </tr>
              <tr style={{ backgroundColor: '#fffbeb' }}>
                <td><strong>1 – 2 分</strong></td>
                <td><strong style={{ color: '#d97706' }}>衰弱前期 (Pre-frail)</strong></td>
                <td><strong>可逆轉關鍵黃金期！</strong>功能已有早期耗損，若及早針對衰弱項目（如阻力運動、蛋白質營養補充）介入，極具恢復健壯之可能。</td>
              </tr>
              <tr style={{ backgroundColor: '#fff1f2' }}>
                <td><strong>3 – 5 分</strong></td>
                <td><strong style={{ color: '#e11d48' }}>衰弱 (Frail)</strong></td>
                <td>多系統功能衰竭，極高跌倒、住院與依賴風險。需啟動周全性老年評估 (CGA)、跨專業醫療照顧及長照資源介入。</td>
              </tr>
            </tbody>
          </table>

          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-800)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
            二、五大指標判定切點 (Diagnostic Cutoffs)
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* 1. 體重 */}
            <div style={{ backgroundColor: '#f8fafc', padding: '0.875rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <strong>1. 非預期性體重減輕 (Shrinking / Weight Loss)</strong>
              <div style={{ fontSize: '0.875rem', color: '#475569', marginTop: '0.25rem' }}>
                • 切點：過去一年在<strong>無刻意節食、無刻意減肥</strong>情況下，非預期體重減少 ≥ 4.5 公斤 (10 lbs) 或 ≥ 原體重 5.0%。
                <br />
                • 臨床計算方式：支援「直接填寫減輕公斤數」或填寫「一年前體重 vs 目前體重」，由系統自動計算減輕差值與百分比。
                <br />
                • 學理背景：長者非刻意消瘦往往意味著蛋白質能量消耗 (Cachexia)、慢性隱性感染、惡性腫瘤或嚴重的消化道/吞嚥功能減損。
              </div>
            </div>

            {/* 2. 疲憊感 */}
            <div style={{ backgroundColor: '#f8fafc', padding: '0.875rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <strong>2. 自覺疲憊感 (Exhaustion)</strong>
              <div style={{ fontSize: '0.875rem', color: '#475569', marginTop: '0.25rem' }}>
                • 切點：使用流行病學研究中心憂鬱量表 (CES-D) 兩題篩檢：「我覺得做任何事都很費力」或「我無法打起精神做事」，若過去一週出現 ≥ 3-4 天即計 1 分。
                <br />
                • 學理背景：反映長者自覺全身能量代謝枯竭、自主神經或神經內分泌軸失調。
              </div>
            </div>

            {/* 3. 身體活動量 */}
            <div style={{ backgroundColor: '#f8fafc', padding: '0.875rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <strong>3. 身體活動量偏低 (Low Physical Activity)</strong>
              <div style={{ fontSize: '0.875rem', color: '#475569', marginTop: '0.25rem' }}>
                • 切點：依據 Minnesota 休閒活動問卷加權計算，消耗卡路里為群體最低 20%（男性每週 &lt; 383 kcal；女性每週 &lt; 270 kcal；或長者日常每週幾無運動/多呈臥床坐式生活）。
              </div>
            </div>

            {/* 4. 步行速度 */}
            <div style={{ backgroundColor: '#f8fafc', padding: '0.875rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <strong>4. 行走速度慢 (Slowness)</strong>
              <div style={{ fontSize: '0.875rem', color: '#475569', marginTop: '0.25rem' }}>
                • 4公尺步行時間 Fried 標準切點（最低五分位數）：
                <br />
                - 男性身高 ≤ 173 cm：≥ 5.76 秒 (約步速 ≤ 0.69 m/s)；男性身高 &gt; 173 cm：≥ 5.21 秒 (約步速 ≤ 0.77 m/s)
                <br />
                - 女性身高 ≤ 159 cm：≥ 6.43 秒 (約步速 ≤ 0.62 m/s)；女性身高 &gt; 159 cm：≥ 5.90 秒 (約步速 ≤ 0.68 m/s)
                <br />
                • <strong>無法測量時之判定 (Fried 原著原則)</strong>：若長者因嚴重虛弱、完全臥床、下肢癱瘓或長期依賴輪椅而無法完成測試，原著標準直接判定為「符合衰弱 (計 1 分)」；無計時空間者亦可改採 SARC-F 步態自評。
              </div>
            </div>

            {/* 5. 握力 */}
            <div style={{ backgroundColor: '#f8fafc', padding: '0.875rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <strong>5. 握力偏低 (Weakness) —— 依性別與 BMI 動態調整</strong>
              <div style={{ fontSize: '0.875rem', color: '#475569', marginTop: '0.25rem' }}>
                • <strong>無法測量時之判定 (Fried 原著原則)</strong>：若長者因中風偏癱、嚴重關節攣縮或極度虛弱無法操作握力計，原著標準直接判定為「符合衰弱 (計 1 分)」；現場無儀器時可使用 SARC-F 提拿 5 公斤重物問卷替代。
                <br />
                • Fried 握力標準考量到體重較重者本應具有較高肌力，故依據 BMI 四分位設立階梯式門檻：
              </div>
              <table className="modal-table" style={{ marginTop: '0.5rem', fontSize: '0.825rem' }}>
                <thead>
                  <tr>
                    <th>生理性別</th>
                    <th>BMI 級距 (kg/m²)</th>
                    <th>低握力判定切點 (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowSpan="4">男性 (Male)</td>
                    <td>BMI ≤ 24.0</td>
                    <td><strong>≤ 29.0 kg</strong></td>
                  </tr>
                  <tr>
                    <td>BMI 24.1 – 26.0</td>
                    <td><strong>≤ 30.0 kg</strong></td>
                  </tr>
                  <tr>
                    <td>BMI 26.1 – 28.0</td>
                    <td><strong>≤ 30.0 kg</strong></td>
                  </tr>
                  <tr>
                    <td>BMI &gt; 28.0</td>
                    <td><strong>≤ 32.0 kg</strong></td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #cbd5e1' }}>
                    <td rowSpan="4">女性 (Female)</td>
                    <td>BMI ≤ 23.0</td>
                    <td><strong>≤ 17.0 kg</strong></td>
                  </tr>
                  <tr>
                    <td>BMI 23.1 – 26.0</td>
                    <td><strong>≤ 17.3 kg</strong></td>
                  </tr>
                  <tr>
                    <td>BMI 26.1 – 29.0</td>
                    <td><strong>≤ 18.0 kg</strong></td>
                  </tr>
                  <tr>
                    <td>BMI &gt; 29.0</td>
                    <td><strong>≤ 21.0 kg</strong></td>
                  </tr>
                </tbody>
              </table>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                * 亞洲肌少症工作小組 (AWGS 2019) 通用標準：男性握力 &lt; 28 kg、女性 &lt; 18 kg 作為亞洲長者肌力低下切點。
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
            <strong>文獻引用：</strong>
            Fried LP, Tangen CM, Walston J, Newman AB, Hirsch C, Gottdiener J, Seeman T, Tracy R, Kop WJ, Burke G, McBurnie MA. <em>Frailty in Older Adults: Evidence for a Phenotype</em>. The Journals of Gerontology Series A: Biological Sciences and Medical Sciences, Volume 56, Issue 3, 1 March 2001, Pages M146–M157.
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            我瞭解了 (關閉視窗)
          </button>
        </div>
      </div>
    </div>
  );
}
