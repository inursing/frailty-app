import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  Download,
  AlertTriangle,
  Info,
  ShieldCheck,
  Scale,
  Dumbbell,
  Timer,
  Activity,
  BatteryCharging,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  FileSpreadsheet,
  User,
  PlusCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ReferenceLine
} from 'recharts';
import {
  fetchSubjectRecords,
  calculateTrendAnalytics,
  exportRecordsToCsv,
  generateMockTrackingData,
  EXHAUSTION_LABEL_MAP,
  ACTIVITY_LABEL_MAP
} from '../services/trackingService.js';

export default function LongitudinalTrackingView({
  currentUser,
  onOpenAuthModal,
  onSwitchToAssessment
}) {
  const [timeRange, setTimeRange] = useState('all'); // '3m' | '6m' | '1y' | 'all'
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const subjectId = currentUser?.subjectId || 'SUBJ-2026-001';

  // 載入評估紀錄
  const loadRecords = async (currentRange = timeRange) => {
    setIsLoading(true);
    try {
      const data = await fetchSubjectRecords(subjectId, currentUser?.uid, currentRange);
      setRecords(data);
    } catch (err) {
      console.error('載入追蹤資料失敗：', err);
      showToast('⚠️ 載入追蹤資料失敗，請確認網路連線。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords(timeRange);
  }, [subjectId, currentUser?.uid, timeRange]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 趨勢與差異統計
  const analytics = useMemo(() => {
    return calculateTrendAnalytics(records);
  }, [records]);

  // 圖表格式化資料
  const chartData = useMemo(() => {
    return records.map(r => ({
      date: r.date || r.evaluatedAt?.slice(0, 10),
      evaluatedAt: r.evaluatedAt,
      totalScore: r.totalScore,
      frailtyStatus: r.frailtyStatus,
      weight: r.rawValues?.weight,
      bmi: r.rawValues?.bmi,
      gripKg: r.rawValues?.gripKg,
      walkTime: r.rawValues?.walkTimeSeconds,
      walkSpeed: r.rawValues?.walkSpeedMps,
      exhaustionScore: r.rawValues?.exhaustionNumeric,
      exhaustionLabel: EXHAUSTION_LABEL_MAP[r.rawValues?.exhaustionFrequency] || '正常',
      activityScore: r.rawValues?.activityNumeric,
      activityLabel: ACTIVITY_LABEL_MAP[r.rawValues?.activityLevel] || '中度活動'
    }));
  }, [records]);

  // 快速注入模擬資料
  const handleLoadMockData = () => {
    const mock = generateMockTrackingData(subjectId);
    showToast('✨ 已為您注入過去 1 年 4 次評估的模擬縱向追蹤資料！');
    loadRecords(timeRange);
  };

  // 匯出 CSV
  const handleExportCsv = () => {
    try {
      exportRecordsToCsv(records, subjectId);
      showToast('📥 歷史追蹤紀錄 CSV 檔案已成功下載！');
    } catch (err) {
      showToast('⚠️ ' + err.message);
    }
  };

  return (
    <div className="section-card" style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Toast 提示訊息 */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#0f172a',
          color: 'white',
          padding: '0.75rem 1.5rem',
          borderRadius: '9999px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
          zIndex: 9999,
          fontSize: '0.95rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 標頭與工具列 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        paddingBottom: '1.25rem',
        borderBottom: '1.5px solid #e2e8f0',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2.75rem',
            height: '2.75rem',
            borderRadius: '10px',
            backgroundColor: '#0284c7',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                受試者長期追蹤趨勢 (Longitudinal Monitoring)
              </h2>
              <span className="case-tag bg-sky-100 text-sky-800 border-sky-300">
                研究編號：{subjectId}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
              去識別化追蹤資料庫：監測總分、體重、肌力與步速隨時間之微幅變化
            </p>
          </div>
        </div>

        {/* 頂部操作按鈕 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          {/* 時間區間篩選按鈕 */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            padding: '2px',
            border: '1px solid #cbd5e1'
          }}>
            <button
              type="button"
              className={`btn btn-sm ${timeRange === '3m' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', padding: '0.25rem 0.625rem', fontSize: '0.8rem' }}
              onClick={() => setTimeRange('3m')}
            >
              近 3 個月
            </button>
            <button
              type="button"
              className={`btn btn-sm ${timeRange === '6m' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', padding: '0.25rem 0.625rem', fontSize: '0.8rem' }}
              onClick={() => setTimeRange('6m')}
            >
              近 6 個月
            </button>
            <button
              type="button"
              className={`btn btn-sm ${timeRange === '1y' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', padding: '0.25rem 0.625rem', fontSize: '0.8rem' }}
              onClick={() => setTimeRange('1y')}
            >
              近 1 年
            </button>
            <button
              type="button"
              className={`btn btn-sm ${timeRange === 'all' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', padding: '0.25rem 0.625rem', fontSize: '0.8rem' }}
              onClick={() => setTimeRange('all')}
            >
              全部紀錄
            </button>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleExportCsv}
            disabled={records.length === 0}
            title="將此研究編號的所有評估歷史紀錄匯出為 CSV 試算表檔案"
          >
            <FileSpreadsheet size={15} />
            <span>匯出 CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleLoadMockData}
            title="一鍵注入過去 1 年跨越 4 個時間點的模擬追蹤資料，展示趨勢折線圖"
          >
            <Sparkles size={15} color="#d97706" />
            <span>注入 1 年模擬資料</span>
          </button>
        </div>
      </div>

      {/* 無資料或初始提示 */}
      {records.length === 0 && !isLoading && (
        <div style={{
          backgroundColor: '#f8fafc',
          border: '2px dashed #cbd5e1',
          borderRadius: '12px',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          color: '#475569',
          marginBottom: '1.5rem'
        }}>
          <Calendar size={40} style={{ margin: '0 auto 0.75rem auto', color: '#94a3b8' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', margin: '0 0 0.5rem 0' }}>
            目前研究編號「{subjectId}」尚無長期追蹤評估紀錄
          </h3>
          <p style={{ fontSize: '0.875rem', maxWidth: '520px', margin: '0 auto 1.25rem auto', lineHeight: '1.6' }}>
            您可以切換至「單次評估」完成一次評估並點擊<strong>「💾 保存本次評估至追蹤紀錄」</strong>；或點擊下方按鈕直接載入<strong>多筆跨期模擬數據</strong>體驗圖表與風險趨勢分析！
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleLoadMockData}
            >
              <Sparkles size={16} />
              <span>載入 1 年模擬追蹤資料（展示用）</span>
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onSwitchToAssessment}
            >
              <PlusCircle size={16} />
              <span>前往進行即時評估</span>
            </button>
          </div>
        </div>
      )}

      {/* 第一次 vs 最近一次差異統計卡片 */}
      {analytics.hasData && (
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e3a8a', margin: 0 }}>
              📊 基準線 vs 最新現況差異比較統計 (共 {analytics.count} 次評估紀錄)：
            </h4>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              首次：{analytics.firstRecord.evaluatedAt || analytics.firstRecord.date} | 最近：{analytics.latestRecord.evaluatedAt || analytics.latestRecord.date}
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.875rem'
          }}>
            {/* 總分差異 */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              padding: '0.875rem 1rem'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                Fried 衰弱總分 (0-5)
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                  {analytics.latestRecord.totalScore}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  (首次: {analytics.firstRecord.totalScore}分)
                </span>
              </div>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                marginTop: '0.25rem',
                color: analytics.deltas.scoreDelta > 0 ? '#b91c1c' : analytics.deltas.scoreDelta < 0 ? '#15803d' : '#475569'
              }}>
                {analytics.deltas.scoreDelta > 0 ? `▲ 累計增加 +${analytics.deltas.scoreDelta} 分` :
                 analytics.deltas.scoreDelta < 0 ? `▼ 累計減少 ${analytics.deltas.scoreDelta} 分` : '● 總分維持持平'}
              </div>
            </div>

            {/* 體重差異 */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              padding: '0.875rem 1rem'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                體重變化 (Weight)
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                  {analytics.latestRecord.rawValues?.weight || '--'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  kg (首次: {analytics.firstRecord.rawValues?.weight || '--'}kg)
                </span>
              </div>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                marginTop: '0.25rem',
                color: analytics.deltas.weightDelta < -3 ? '#b91c1c' : '#475569'
              }}>
                {analytics.deltas.weightDelta > 0 ? `+${analytics.deltas.weightDelta} kg` :
                 analytics.deltas.weightDelta < 0 ? `${analytics.deltas.weightDelta} kg` : '持平 (0 kg)'}
                {analytics.deltas.weightDelta <= -3 && ' (需注意非自願消瘦)'}
              </div>
            </div>

            {/* 握力差異 */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              padding: '0.875rem 1rem'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                手部握力 (Grip Strength)
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                  {analytics.latestRecord.rawValues?.gripKg || '--'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  kg (首次: {analytics.firstRecord.rawValues?.gripKg || '--'}kg)
                </span>
              </div>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                marginTop: '0.25rem',
                color: analytics.deltas.gripDelta < 0 ? '#b91c1c' : '#15803d'
              }}>
                {analytics.deltas.gripDelta > 0 ? `▲ 肌力提升 +${analytics.deltas.gripDelta} kg` :
                 analytics.deltas.gripDelta < 0 ? `▼ 肌力下降 ${analytics.deltas.gripDelta} kg` : '持平'}
              </div>
            </div>

            {/* 4公尺步行時間差異 */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              padding: '0.875rem 1rem'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                4公尺平地步行耗時
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                  {analytics.latestRecord.rawValues?.walkTimeSeconds || '--'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  秒 (首次: {analytics.firstRecord.rawValues?.walkTimeSeconds || '--'}s)
                </span>
              </div>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                marginTop: '0.25rem',
                color: analytics.deltas.walkTimeDelta > 0 ? '#b91c1c' : '#15803d'
              }}>
                {analytics.deltas.walkTimeDelta > 0 ? `▼ 耗時拉長 +${analytics.deltas.walkTimeDelta} 秒 (步速變慢)` :
                 analytics.deltas.walkTimeDelta < 0 ? `▲ 耗時縮短 ${analytics.deltas.walkTimeDelta} 秒 (步速變快)` : '持平'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 風險與趨勢提醒橫幅 */}
      {analytics.alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.75rem' }}>
          {analytics.alerts.map((alert, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: alert.severity === 'warning' ? '#fff1f2' : alert.severity === 'amber' ? '#fffbeb' : '#f0fdf4',
                border: `1.5px solid ${alert.severity === 'warning' ? '#fecdd3' : alert.severity === 'amber' ? '#fde68a' : '#bbf7d0'}`,
                borderRadius: '10px',
                padding: '0.875rem 1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}
            >
              <AlertTriangle
                size={20}
                color={alert.severity === 'warning' ? '#be123c' : alert.severity === 'amber' ? '#b45309' : '#15803d'}
                style={{ flexShrink: 0, marginTop: '2px' }}
              />
              <div>
                <strong style={{
                  color: alert.severity === 'warning' ? '#9f1239' : alert.severity === 'amber' ? '#92400e' : '#166534',
                  fontSize: '0.925rem'
                }}>
                  {alert.title}
                </strong>
                <p style={{
                  color: alert.severity === 'warning' ? '#881337' : alert.severity === 'amber' ? '#78350f' : '#14532d',
                  fontSize: '0.85rem',
                  margin: '3px 0 0 0',
                  lineHeight: '1.5'
                }}>
                  {alert.message}
                </p>
              </div>
            </div>
          ))}

          {/* 法律與教學警語 (只描述變化，不提供直接診斷) */}
          <div style={{
            fontSize: '0.775rem',
            color: '#64748b',
            padding: '0.25rem 0.5rem',
            lineHeight: '1.5',
            fontStyle: 'italic'
          }}>
            ℹ️ <strong>臨床追蹤聲明：</strong>
            趨勢結果僅供健康追蹤與教學參考，若有明顯變化，請諮詢醫療專業人員。
          </div>
        </div>
      )}

      {/* 五大圖表區 (Recharts 響應式圖表) */}
      {records.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* 圖表 1：Fried 總分隨時間變化（標註健壯、衰弱前期、衰弱三大色塊區間） */}
          <div style={{
            backgroundColor: 'white',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  一、Fried 衰弱總分趨勢圖 (0 ~ 5 分)
                </h4>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  背景色塊代表健康分級區間：綠色 (健壯 0分) ➔ 黃色 (衰弱前期 1-2分) ➔ 紅色 (衰弱 3-5分)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
                <span style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                  ● 健壯 (0分)
                </span>
                <span style={{ backgroundColor: '#fffbeb', color: '#92400e', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                  ▲ 衰弱前期 (1-2分)
                </span>
                <span style={{ backgroundColor: '#fff1f2', color: '#9f1239', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fecdd3' }}>
                  ■ 衰弱 (3-5分)
                </span>
              </div>
            </div>

            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div style={{ backgroundColor: 'white', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                          <p style={{ fontWeight: 700, margin: '0 0 4px 0', fontSize: '0.85rem' }}>{d.evaluatedAt || label}</p>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#0284c7', fontWeight: 800 }}>
                            總分：{d.totalScore} / 5 分
                          </p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569' }}>
                            等級：{d.frailtyStatus}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }} />

                  {/* 色塊區間：健壯 0 分 */}
                  <ReferenceArea y1={0} y2={0.5} fill="#ecfdf5" fillOpacity={0.7} />
                  {/* 色塊區間：衰弱前期 1-2 分 */}
                  <ReferenceArea y1={0.5} y2={2.5} fill="#fffbeb" fillOpacity={0.6} />
                  {/* 色塊區間：衰弱 3-5 分 */}
                  <ReferenceArea y1={2.5} y2={5} fill="#fff1f2" fillOpacity={0.5} />

                  <Line
                    type="monotone"
                    dataKey="totalScore"
                    name="Fried 衰弱總分"
                    stroke="#0284c7"
                    strokeWidth={3}
                    dot={{ r: 6, fill: '#0284c7', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 圖表 2 與 圖表 3 雙欄併排 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* 圖表 2：體重與身體質量指數 (BMI) */}
            <div style={{
              backgroundColor: 'white',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                二、體重 (Weight) 變化趨勢
              </h4>
              <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.875rem' }}>
                監測非自主性體重減輕（1年內減少 ≥ 4.5kg 達衰弱表型切點）
              </span>
              <div style={{ width: '100%', height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 11 }} unit="kg" />
                    <Tooltip formatter={(value) => [`${value} kg`, '目前體重']} />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="體重 (kg)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#10b981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 圖表 3：手部握力變化 (Grip Strength) */}
            <div style={{
              backgroundColor: 'white',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                三、手部握力 (Grip Strength) 變化趨勢
              </h4>
              <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.875rem' }}>
                實測最大握力數值 (kg)，監測骨骼肌肌少衰減跡象
              </span>
              <div style={{ width: '100%', height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[10, 45]} tick={{ fontSize: 11 }} unit="kg" />
                    <Tooltip formatter={(value) => [`${value} kg`, '實測握力']} />
                    {/* 亞洲女性標準常態切點 18kg 參考線 */}
                    <ReferenceLine y={18} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: '女性切點 (18kg)', fill: '#f43f5e', fontSize: 10 }} />
                    <Line
                      type="monotone"
                      dataKey="gripKg"
                      name="握力 (kg)"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#8b5cf6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 圖表 4 與 圖表 5 雙欄併排 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* 圖表 4：步行時間 / 步行速度變化 */}
            <div style={{
              backgroundColor: 'white',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                四、4公尺平地步行時間 (Walking Speed)
              </h4>
              <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.875rem' }}>
                4公尺平地步行實測秒數（秒數越長代表步行越慢、跌倒風險越高）
              </span>
              <div style={{ width: '100%', height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[2, 12]} tick={{ fontSize: 11 }} unit="s" />
                    <Tooltip formatter={(value) => [`${value} 秒`, '4公尺耗時']} />
                    {/* 步速切點約 5.7 秒參考線 */}
                    <ReferenceLine y={5.7} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '步速慢切點 (約5.7s)', fill: '#b45309', fontSize: 10 }} />
                    <Line
                      type="monotone"
                      dataKey="walkTime"
                      name="步行時間 (秒)"
                      stroke="#f97316"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#f97316' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 圖表 5：身體活動量與自覺疲憊程度變化 */}
            <div style={{
              backgroundColor: 'white',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                五、活動量與疲憊感主觀狀態變化
              </h4>
              <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.875rem' }}>
                活動量 (2=活躍, 1=中度, 0=久坐) vs 疲憊感 (2=頻繁, 1=偶爾, 0=極少)
              </span>
              <div style={{ width: '100%', height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 2]} ticks={[0, 1, 2]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value, name, item) => {
                      if (name === '活動量等級') {
                        return [item.payload.activityLabel, name];
                      }
                      return [item.payload.exhaustionLabel, name];
                    }} />
                    <Legend />
                    <Line
                      type="stepAfter"
                      dataKey="activityScore"
                      name="活動量等級"
                      stroke="#0284c7"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="stepAfter"
                      dataKey="exhaustionScore"
                      name="疲憊程度"
                      stroke="#e11d48"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
