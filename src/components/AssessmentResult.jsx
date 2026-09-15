import React, { useState } from 'react';
import {
  Award,
  AlertTriangle,
  HeartPulse,
  RotateCcw,
  BookOpen,
  Printer,
  Sparkles,
  Bot,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Download,
  Share2,
  Check,
  Eye,
  FileText,
  Image as ImageIcon,
  X,
  FileDown,
  Copy,
  ExternalLink,
  Send,
  ChevronDown,
  BookmarkPlus,
  Lock
} from 'lucide-react';
import VisualSeniorReport from './VisualSeniorReport.jsx';
import ClinicalReportViewer from './ClinicalReportViewer.jsx';
import {
  downloadSeniorPdf,
  downloadClinicalPdf,
  downloadSummaryPdf,
  openPrintPdfWindow
} from '../utils/pdfExport.js';
import {
  formatLineShareMessage,
  copySummaryTextToClipboard,
  openLineDirectShare
} from '../utils/reportExport.js';

export default function AssessmentResult({
  basicInfo,
  evaluationResults,
  criteriaAnswers,
  clinicalNotes,
  onReset,
  onOpenLogicModal,
  onGenerateAiReport,
  isGeneratingAi,
  aiReport,
  unfilledItems = [],
  onSaveRecord,
  isSavingRecord = false,
  currentUser = null
}) {
  const [reportViewMode, setReportViewMode] = useState('visual'); // 'visual' | 'clinical'
  const [toastMessage, setToastMessage] = useState(null);
  const [isDownloadingSeniorPdf, setIsDownloadingSeniorPdf] = useState(false);
  const [isDownloadingClinicalPdf, setIsDownloadingClinicalPdf] = useState(false);
  const [isDownloadingSummaryPdf, setIsDownloadingSummaryPdf] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showLinePreview, setShowLinePreview] = useState(false);

  const {
    totalScore,
    frailtyStatus,
    results,
    evaluatedAt
  } = evaluationResults;

  const resultClass = totalScore === 0
    ? 'result-robust'
    : totalScore <= 2
    ? 'result-prefrail'
    : 'result-frail';

  const scoreTextColor = totalScore === 0
    ? 'var(--emerald-600)'
    : totalScore <= 2
    ? 'var(--amber-600)'
    : 'var(--rose-600)';

  // 嚴格阻擋：若有未填寫之資料，禁止下載資料或產生建議
  const ensureAllDataFilled = (actionName = '下載資料') => {
    if (unfilledItems && unfilledItems.length > 0) {
      showToast(`⚠️ 尚有 ${unfilledItems.length} 項資料未填寫完整，系統已鎖定無法${actionName}！請先補齊資料。`);
      const firstUnfilled = document.getElementById(unfilledItems[0]?.id || 'basic-info-section');
      if (firstUnfilled) {
        firstUnfilled.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (firstUnfilled.focus) firstUnfilled.focus();
      }
      return false;
    }
    return true;
  };

  // 列印視窗呼叫
  const handlePrint = (type = 'senior') => {
    if (!ensureAllDataFilled('列印或另存 PDF')) return;
    openPrintPdfWindow({
      basicInfo,
      evaluationResults,
      aiReport,
      clinicalNotes,
      type
    });
  };

  // 下載「長者圖文版」A4 一頁式 PDF
  const handleDownloadSeniorPdf = async () => {
    if (!ensureAllDataFilled('下載長者版 PDF')) return;
    setIsDownloadingSeniorPdf(true);
    showToast('🌸 正在為您生成 A4 一頁式「長者圖文版」PDF 報告...');
    try {
      await downloadSeniorPdf({
        basicInfo,
        evaluationResults,
        criteriaAnswers,
        aiReport,
        clinicalNotes
      });
      showToast('✅「長者圖文版」PDF 報告已下載完成！');
    } catch (err) {
      console.error(err);
      showToast('⚠️ 下載時遇到問題，已為您喚起高清晰列印視窗。');
    } finally {
      setIsDownloadingSeniorPdf(false);
    }
  };

  // 下載「醫護專業版」A4 一頁式 PDF
  const handleDownloadClinicalPdf = async () => {
    if (!ensureAllDataFilled('下載醫護版 PDF')) return;
    setIsDownloadingClinicalPdf(true);
    showToast('📋 正在為您生成 A4 一頁式「醫護臨床專業版」PDF 報告...');
    try {
      await downloadClinicalPdf({
        basicInfo,
        evaluationResults,
        criteriaAnswers,
        aiReport,
        clinicalNotes
      });
      showToast('✅「醫護臨床專業版」PDF 報告已下載完成！');
    } catch (err) {
      console.error(err);
      showToast('⚠️ 下載時遇到問題，已為您喚起高清晰列印視窗。');
    } finally {
      setIsDownloadingClinicalPdf(false);
    }
  };

  // 下載一頁式 PDF 摘要
  const handleDownloadSummaryPdf = async () => {
    if (!ensureAllDataFilled('下載 PDF 摘要')) return;
    setIsDownloadingSummaryPdf(true);
    showToast('📄 正在生成 A4 一頁式 PDF 隨身摘要檔案...');
    try {
      await downloadSummaryPdf({
        basicInfo,
        evaluationResults,
        criteriaAnswers,
        clinicalNotes
      });
      showToast('✅ A4 一頁式 PDF 摘要已下載完成！');
    } catch (err) {
      console.error(err);
      showToast('⚠️ 下載時遇到問題，已為您喚起高清晰列印視窗。');
    } finally {
      setIsDownloadingSummaryPdf(false);
    }
  };

  // LINE 純文字訊息格式化
  const lineShareText = formatLineShareMessage({
    basicInfo,
    evaluationResults,
    aiReport,
    clinicalNotes
  });

  // 複製純文字訊息至剪貼簿（保證不夾帶網址）
  const handleCopyLineText = async () => {
    if (!ensureAllDataFilled('複製 LINE 摘要')) return;
    const success = await copySummaryTextToClipboard(lineShareText);
    if (success) {
      setCopiedText(true);
      showToast('📋 已複製純文字摘要至剪貼簿（純文字、不含網址），可直接於 LINE 貼上！');
      setTimeout(() => setCopiedText(false), 3500);
    } else {
      showToast('⚠️ 複製失敗，請手動複製下方文字預覽。');
    }
  };

  // 開啟 LINE 直接發送純文字訊息
  const handleOpenLineDirect = () => {
    if (!ensureAllDataFilled('開啟 LINE 分享')) return;
    openLineDirectShare(lineShareText);
    showToast('📲 正在開啟 LINE 準備傳送文字訊息...');
  };

  // 開啟分享視窗
  const handleOpenShare = () => {
    if (!ensureAllDataFilled('分享報告摘要')) return;
    setIsShareModalOpen(true);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const itemKeys = [
    { key: 'weightLoss', num: 1 },
    { key: 'exhaustion', num: 2 },
    { key: 'physicalActivity', num: 3 },
    { key: 'walkingSpeed', num: 4 },
    { key: 'gripStrength', num: 5 }
  ];

  return (
    <div className="result-container" id="assessment-result-section" style={{ position: 'relative' }}>
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

      {/* 列印專用紙本標頭 */}
      <div className="print-only-header">
        <h1 style={{ fontSize: '1.5rem', color: '#1e3a8a', marginBottom: '0.25rem' }}>
          AI 衰弱評估系統 - 客製化周全性護理報告
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          評估時間：{evaluatedAt} | 受試長者：性別 {basicInfo.gender === 'male' ? '男' : basicInfo.gender === 'female' ? '女' : '未填'}、年齡 {basicInfo.age || '--'} 歲、身高 {basicInfo.height || '--'} cm、體重 {basicInfo.weight || '--'} kg
        </p>
      </div>

      {/* 漏填提醒與功能鎖定橫幅 */}
      {unfilledItems.length > 0 && (
        <div style={{
          backgroundColor: '#fff1f2',
          border: '2px solid #f43f5e',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          boxShadow: '0 4px 6px -1px rgba(244, 63, 94, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', flex: '1 1 320px' }}>
            <div style={{
              backgroundColor: '#ffe4e6',
              borderRadius: '50%',
              padding: '0.5rem',
              color: '#e11d48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Lock size={24} />
            </div>
            <div>
              <strong style={{ color: '#9f1239', fontSize: '1.05rem', display: 'block' }}>
                ⚠️ 尚有 {unfilledItems.length} 項資料未填寫完整，系統已鎖定「下載資料」與「產生建議」功能
              </strong>
              <p style={{ color: '#be123c', fontSize: '0.875rem', margin: '4px 0 0 0', lineHeight: '1.5' }}>
                待補齊項目：<strong>{unfilledItems.map(i => i.label).join('、')}</strong>。<br />
                為確保臨床決策之精準性與長者照護安全，<strong>必須填齊上方所有基本資料與五項指標後，方能解鎖 AI 客製化建議與 PDF 報告下載</strong>。
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              const el = document.getElementById(unfilledItems[0]?.id || 'basic-info-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (el.focus) el.focus();
              }
            }}
            style={{
              backgroundColor: '#e11d48',
              color: 'white',
              border: 'none',
              flexShrink: 0,
              fontWeight: 700,
              padding: '0.6rem 1.25rem',
              boxShadow: '0 2px 4px rgba(225, 29, 72, 0.3)'
            }}
          >
            前往補齊未填資料 ({unfilledItems.length}) ↗
          </button>
        </div>
      )}

      <div className="section-header">
        <h2 className="section-title">
          <Award size={24} />
          <span>四、衰弱綜合評估成果與分級建議</span>
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* 下載長者圖文版 PDF 按鈕 */}
          <button
            type="button"
            className="btn btn-emerald btn-sm"
            onClick={handleDownloadSeniorPdf}
            disabled={isDownloadingSeniorPdf || unfilledItems.length > 0}
            style={{
              opacity: unfilledItems.length > 0 ? 0.55 : 1,
              cursor: unfilledItems.length > 0 ? 'not-allowed' : 'pointer'
            }}
            title={unfilledItems.length > 0 ? `尚有 ${unfilledItems.length} 項資料未填寫，無法下載資料` : '下載標準 A4 一頁式「長者圖文版」PDF 報告'}
          >
            {isDownloadingSeniorPdf ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>長者版生成中...</span>
              </>
            ) : unfilledItems.length > 0 ? (
              <>
                <Lock size={15} />
                <span>🌸 長者版 PDF (鎖定)</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>🌸 下載長者圖文版 PDF</span>
              </>
            )}
          </button>

          {/* 下載醫護專業版 PDF 按鈕 */}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleDownloadClinicalPdf}
            disabled={isDownloadingClinicalPdf || unfilledItems.length > 0}
            style={{
              opacity: unfilledItems.length > 0 ? 0.55 : 1,
              cursor: unfilledItems.length > 0 ? 'not-allowed' : 'pointer'
            }}
            title={unfilledItems.length > 0 ? `尚有 ${unfilledItems.length} 項資料未填寫，無法下載資料` : '下載標準 A4 一頁式「醫護臨床專業版」PDF 報告'}
          >
            {isDownloadingClinicalPdf ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>醫護版生成中...</span>
              </>
            ) : unfilledItems.length > 0 ? (
              <>
                <Lock size={15} />
                <span>📋 醫護版 PDF (鎖定)</span>
              </>
            ) : (
              <>
                <FileText size={15} />
                <span>📋 下載醫護專業版 PDF</span>
              </>
            )}
          </button>

          {/* 分享報告按鈕 */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleOpenShare}
            disabled={unfilledItems.length > 0}
            style={{
              opacity: unfilledItems.length > 0 ? 0.55 : 1,
              cursor: unfilledItems.length > 0 ? 'not-allowed' : 'pointer'
            }}
            title={unfilledItems.length > 0 ? `尚有 ${unfilledItems.length} 項資料未填寫，無法分享報告` : '分享報告摘要 (PDF / LINE)'}
          >
            {unfilledItems.length > 0 ? <Lock size={15} /> : <Share2 size={15} />}
            <span>分享報告摘要 {unfilledItems.length > 0 ? '(鎖定)' : '(PDF / LINE)'}</span>
          </button>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => handlePrint('senior')}
            disabled={unfilledItems.length > 0}
            style={{
              opacity: unfilledItems.length > 0 ? 0.55 : 1,
              cursor: unfilledItems.length > 0 ? 'not-allowed' : 'pointer'
            }}
            title={unfilledItems.length > 0 ? `尚有 ${unfilledItems.length} 項資料未填寫，無法列印或另存` : '以高清晰度列印視窗預覽或另存 PDF'}
          >
            {unfilledItems.length > 0 ? <Lock size={15} /> : <Printer size={15} />}
            <span>列印 / 另存 PDF</span>
          </button>
        </div>
      </div>

      {/* 總分與等級摘要卡片 */}
      <div className={`result-summary-card ${resultClass}`}>
        <div className="score-circle-wrapper">
          <div className="score-circle" style={{ color: scoreTextColor }}>
            <span className="score-number">{totalScore}</span>
            <span className="score-max">滿分 5 分</span>
          </div>
          <div style={{ marginTop: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: scoreTextColor }}>
            {totalScore === 0 && '● 健壯等級 (Robust)'}
            {totalScore >= 1 && totalScore <= 2 && '▲ 衰弱前期 (Pre-frail)'}
            {totalScore >= 3 && '■ 衰弱等級 (Frail)'}
          </div>
        </div>

        <div>
          <h3 className="result-level-title" style={{ color: scoreTextColor }}>
            綜合判定：{frailtyStatus}
          </h3>
          <p className="result-meaning-text">
            {evaluationResults.clinicalMeaning}
          </p>
        </div>
      </div>

      {/* 五項個別明細檢視清單 */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-800)', marginBottom: '0.75rem' }}>
          五項表型指標個別實測與給分依據：
        </h4>

        <div className="result-items-grid">
          {itemKeys.map(({ key, num }) => {
            const item = results[key];
            return (
              <div
                key={key}
                className={`result-item-card ${item.isPositive ? 'item-positive' : ''}`}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                      指標 {num}. {item.title.split('(')[0]}
                    </span>
                    <span className={`case-tag ${item.isPositive ? 'score-one' : 'score-zero'}`}>
                      {item.isPositive ? '+1 分 (符合)' : '0 分 (正常)'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                    {item.detail}
                  </p>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', borderTop: '1px dotted #cbd5e1', paddingTop: '0.35rem' }}>
                  標準：{item.standardSummary}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 核心功能：LLM 客製化深度評估專區 */}
      <div style={{
        backgroundColor: '#f0fdf4',
        border: '2px solid #86efac',
        borderRadius: '16px',
        padding: '1.75rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.75rem',
              height: '2.75rem',
              borderRadius: '10px',
              backgroundColor: '#10b981',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#065f46' }}>
                AI 客製化圖文並茂護理處方（大語言模型生成）
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#047857' }}>
                專為長者與家屬設計：圖文並茂大字體指南，精算蛋白質熱量與居家安全保命操！
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-emerald btn-lg"
              onClick={onGenerateAiReport}
              disabled={isGeneratingAi || unfilledItems.length > 0}
              style={{
                boxShadow: unfilledItems.length > 0 ? 'none' : '0 2px 4px rgba(5, 150, 105, 0.3)',
                opacity: unfilledItems.length > 0 ? 0.6 : 1,
                cursor: unfilledItems.length > 0 ? 'not-allowed' : 'pointer',
                backgroundColor: unfilledItems.length > 0 ? '#94a3b8' : undefined
              }}
              title={unfilledItems.length > 0 ? `尚有 ${unfilledItems.length} 項資料未填寫完整，無法產生客製化建議` : '生成 AI 客製化圖文報告'}
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>AI 正在精算圖文處方...</span>
                </>
              ) : unfilledItems.length > 0 ? (
                <>
                  <Lock size={18} />
                  <span>未填完整（鎖定產生建議）</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>{aiReport ? '重新生成 AI 客製化處方' : '生成 AI 客製化圖文報告'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI 報告產出展示區 */}
        {aiReport && (
          <div>
            {/* 切換檢視模式工具列 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginTop: '1rem',
              border: '1px solid #a7f3d0',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="case-tag bg-emerald-100 text-emerald-800 border-emerald-300">
                  {aiReport.source === 'gemini-api' ? '🤖 Google Gemini 1.5 Flash 深度推理' : '⚡ 智慧臨床決策合成引擎（實測動態精算）'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  生成時間：{aiReport.generatedAt}
                </span>
              </div>

              {/* 檢視模式切換 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${reportViewMode === 'visual' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setReportViewMode('visual')}
                >
                  <ImageIcon size={14} />
                  <span>🌸 長者友善圖文指南</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${reportViewMode === 'clinical' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setReportViewMode('clinical')}
                >
                  <FileText size={14} />
                  <span>📋 完整醫護文字報告</span>
                </button>
              </div>
            </div>

            {/* 模式一：圖文並茂長者友善模式 */}
            {reportViewMode === 'visual' ? (
              <VisualSeniorReport
                basicInfo={basicInfo}
                evaluationResults={evaluationResults}
                criteriaAnswers={criteriaAnswers}
                clinicalNotes={clinicalNotes}
                aiReport={aiReport}
              />
            ) : (
              /* 模式二：完整醫護專業報告（徹底清除 ###、**、• 等雜訊符號，呈現乾淨專業臨床卡片） */
              <ClinicalReportViewer content={aiReport.content} />
            )}
          </div>
        )}

        {!aiReport && !isGeneratingAi && (
          unfilledItems.length > 0 ? (
            <div style={{
              backgroundColor: '#fff1f2',
              borderRadius: '12px',
              padding: '1.25rem 1.5rem',
              textAlign: 'center',
              color: '#be123c',
              fontSize: '0.95rem',
              lineHeight: '1.7',
              border: '1.5px dashed #f43f5e'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 800, fontSize: '1.05rem', color: '#9f1239' }}>
                <Lock size={20} />
                <span>【功能已鎖定】尚有未填寫的資料，不可產生建議與下載報告</span>
              </div>
              <p style={{ margin: '0 0 0.75rem 0', color: '#be123c' }}>
                目前尚有 <strong>{unfilledItems.length}</strong> 項資料待填寫：<strong>{unfilledItems.map(i => i.label).join('、')}</strong>。<br />
                依據臨床規範，必須填寫完整基本資料與五大表型指標，系統才能為長者精算客製化飲食熱量、肌力處方並開放下載。
              </p>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  const el = document.getElementById(unfilledItems[0]?.id || 'basic-info-section');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    if (el.focus) el.focus();
                  }
                }}
                style={{
                  backgroundColor: '#e11d48',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700,
                  padding: '0.5rem 1.25rem',
                  boxShadow: '0 2px 6px rgba(225, 29, 72, 0.3)'
                }}
              >
                立即前往補齊未填項目 ➔
              </button>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.75)',
              borderRadius: '10px',
              padding: '1.25rem',
              textAlign: 'center',
              color: '#047857',
              fontSize: '0.95rem',
              lineHeight: '1.7'
            }}>
              👉 點擊上方綠色按鈕「<strong>生成 AI 客製化圖文報告</strong>」，系統將針對長者體重與肌力狀態，產出<strong>圖文並茂的蛋白質吃法、居家防跌運動圖解與下載分享報告</strong>！
            </div>
          )
        )}
      </div>

      {/* 必須展示的免責聲明 */}
      <div className="result-disclaimer" role="alert">
        <ShieldAlert size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.375rem' }} />
        <strong>教學篩檢聲明：</strong>
        此結果與 AI 生成內容僅供教學及初步篩檢，不構成醫療診斷。若受試長者出現急性功能減退、頻繁跌倒或意識障礙，請儘速就醫接受專業老年醫學評估。
      </div>

      {/* 操作按鈕群 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* 下載長者圖文版 PDF */}
        <button
          type="button"
          className="btn btn-emerald"
          onClick={handleDownloadSeniorPdf}
          disabled={isDownloadingSeniorPdf || unfilledItems.length > 0}
          style={{
            opacity: unfilledItems.length > 0 ? 0.55 : 1,
            cursor: unfilledItems.length > 0 ? 'not-allowed' : 'pointer'
          }}
          title={unfilledItems.length > 0 ? `尚有 ${unfilledItems.length} 項資料未填寫，無法下載資料` : '下載標準 A4 一頁式「長者圖文版」PDF 報告'}
        >
          {isDownloadingSeniorPdf ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>長者版 PDF 生成中...</span>
            </>
          ) : unfilledItems.length > 0 ? (
            <>
              <Lock size={18} />
              <span>🌸 長者版 PDF (鎖定)</span>
            </>
          ) : (
            <>
              <Download size={18} />
              <span>🌸 下載長者圖文版 PDF</span>
            </>
          )}
        </button>

        {/* 下載醫護專業版 PDF */}
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleDownloadClinicalPdf}
          disabled={isDownloadingClinicalPdf || unfilledItems.length > 0}
          style={{
            opacity: unfilledItems.length > 0 ? 0.55 : 1,
            cursor: unfilledItems.length > 0 ? 'not-allowed' : 'pointer'
          }}
          title={unfilledItems.length > 0 ? `尚有 ${unfilledItems.length} 項資料未填寫，無法下載資料` : '下載標準 A4 一頁式「醫護臨床專業版」PDF 報告'}
        >
          {isDownloadingClinicalPdf ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>醫護版 PDF 生成中...</span>
            </>
          ) : unfilledItems.length > 0 ? (
            <>
              <Lock size={18} />
              <span>📋 醫護版 PDF (鎖定)</span>
            </>
          ) : (
            <>
              <FileText size={18} />
              <span>📋 下載醫護專業版 PDF</span>
            </>
          )}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleOpenShare}
          disabled={unfilledItems.length > 0}
          style={{
            opacity: unfilledItems.length > 0 ? 0.55 : 1,
            cursor: unfilledItems.length > 0 ? 'not-allowed' : 'pointer'
          }}
          title={unfilledItems.length > 0 ? `尚有 ${unfilledItems.length} 項資料未填寫，無法分享報告` : '分享報告摘要（提供 PDF 摘要、LINE 純文字訊息複製與社群分享）'}
        >
          {unfilledItems.length > 0 ? <Lock size={18} /> : <Share2 size={18} />}
          <span>分享報告摘要 {unfilledItems.length > 0 ? '(鎖定)' : '(PDF / LINE)'}</span>
        </button>

        {/* 保存至受試者長期追蹤紀錄 */}
        {onSaveRecord && (
          <button
            type="button"
            className="btn"
            onClick={onSaveRecord}
            disabled={isSavingRecord || unfilledItems.length > 0}
            style={{
              backgroundColor: unfilledItems.length > 0 ? '#94a3b8' : '#0284c7',
              color: 'white',
              boxShadow: unfilledItems.length > 0 ? 'none' : '0 4px 12px rgba(2, 132, 199, 0.25)',
              fontWeight: 700,
              opacity: unfilledItems.length > 0 ? 0.55 : 1,
              cursor: unfilledItems.length > 0 ? 'not-allowed' : 'pointer'
            }}
            title={unfilledItems.length > 0 ? `尚有 ${unfilledItems.length} 項資料未填寫，無法保存紀錄` : '將本次評估之各項指標原始值與 Fried 總分保存至受試者長期追蹤紀錄'}
          >
            {isSavingRecord ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>保存紀錄中...</span>
              </>
            ) : unfilledItems.length > 0 ? (
              <>
                <Lock size={18} />
                <span>💾 保存至長期追蹤 (鎖定)</span>
              </>
            ) : (
              <>
                <BookmarkPlus size={18} />
                <span>💾 保存至長期追蹤 {currentUser?.subjectId ? `(${currentUser.subjectId})` : ''}</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          className="btn btn-outline"
          onClick={onOpenLogicModal}
        >
          <BookOpen size={18} />
          <span>評估邏輯與切點</span>
        </button>

        <button
          type="button"
          className="btn btn-outline"
          onClick={onReset}
        >
          <RotateCcw size={18} />
          <span>重新評估（清空資料）</span>
        </button>
      </div>

      {/* 分享報告摘要 Modal（提供兩種 A4 PDF 版本與 LINE 純文字複製） */}
      {isShareModalOpen && (
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
            maxWidth: '620px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            {/* 彈窗標頭 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: '8px',
                  backgroundColor: '#0284c7',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Share2 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    分享衰弱評估成果與下載報告
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    請選擇符合對象之版本（長者圖文版 / 醫護專業版 / LINE 純文字）
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
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

            {/* 彈窗選項卡片列表（可滾動） */}
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1 }}>
              {/* 選項一：下載長者圖文版 PDF */}
              <div style={{
                border: '1.5px solid #86efac',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                backgroundColor: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: '1 1 240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ backgroundColor: '#10b981', color: 'white', fontSize: '0.75rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                      長者首選
                    </span>
                    <strong style={{ fontSize: '1rem', color: '#065f46' }}>
                      🌸 下載「長者圖文版」A4 一頁式 PDF
                    </strong>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#166534', margin: 0, lineHeight: '1.45' }}>
                    特大清晰字體、高蛋白質食材餐盤圖鑑、4 招居家防跌運動圖解卡、衛福部長照 1966 專線。最適合長者與家屬閱覽張貼！
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-emerald btn-sm"
                  onClick={handleDownloadSeniorPdf}
                  disabled={isDownloadingSeniorPdf}
                  style={{ flexShrink: 0 }}
                >
                  {isDownloadingSeniorPdf ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>PDF 生成中...</span>
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      <span>下載長者版 PDF</span>
                    </>
                  )}
                </button>
              </div>

              {/* 選項二：下載醫護專業版 PDF */}
              <div style={{
                border: '1.5px solid #93c5fd',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: '1 1 240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ backgroundColor: '#2563eb', color: 'white', fontSize: '0.75rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                      醫療首選
                    </span>
                    <strong style={{ fontSize: '1rem', color: '#1e40af' }}>
                      📋 下載「醫護專業版」A4 一頁式 PDF
                    </strong>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#1e3a8a', margin: 0, lineHeight: '1.45' }}>
                    Linda Fried CHS 2001 臨床切點對照表、病理機轉剖析、住院/跌倒風險預測、Beers 潛在不適當多重用藥檢視、跨團隊照會與醫師簽章欄。
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleDownloadClinicalPdf}
                  disabled={isDownloadingClinicalPdf}
                  style={{ flexShrink: 0 }}
                >
                  {isDownloadingClinicalPdf ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>PDF 生成中...</span>
                    </>
                  ) : (
                    <>
                      <FileText size={15} />
                      <span>下載醫護版 PDF</span>
                    </>
                  )}
                </button>
              </div>

              {/* 選項三：複製純文字摘要至 LINE（已修正為純中文文字訊息，絕不夾帶任何本機網址） */}
              <div style={{
                border: '1.5px solid #bbf7d0',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                backgroundColor: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ backgroundColor: '#065f46', color: 'white', fontSize: '0.75rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                        純文字訊息
                      </span>
                      <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                        💬 複製純文字摘要至 LINE / 訊息
                      </strong>
                    </div>
                    <p style={{ fontSize: '0.825rem', color: '#475569', margin: 0, lineHeight: '1.4' }}>
                      ✅ <strong>已修復為純文字訊息</strong>：絕不夾帶任何本機網址 (localhost)！直接複製完整衰弱分數、等級判定、每日蛋白質熱量與居家防跌三部曲。
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-emerald btn-sm"
                      onClick={handleCopyLineText}
                    >
                      {copiedText ? (
                        <>
                          <Check size={15} />
                          <span>已複製純文字！</span>
                        </>
                      ) : (
                        <>
                          <Copy size={15} />
                          <span>複製純文字訊息</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleOpenLineDirect}
                      title="直接開啟 LINE 應用程式發送文字訊息"
                    >
                      <Send size={15} />
                      <span>開啟 LINE 直接傳送</span>
                    </button>
                  </div>
                </div>

                {/* 展開預覽按鈕 */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowLinePreview(!showLinePreview)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{showLinePreview ? '收合文字預覽' : '點此預覽即將複製的 LINE 純文字內容'}</span>
                    <ChevronDown size={14} style={{ transform: showLinePreview ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>

                  {showLinePreview && (
                    <div style={{
                      marginTop: '0.5rem',
                      backgroundColor: 'white',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      fontSize: '0.8rem',
                      color: '#334155',
                      lineHeight: '1.6',
                      maxHeight: '160px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace'
                    }}>
                      {lineShareText}
                    </div>
                  )}
                </div>
              </div>

              {/* 選項四：下載隨身摘要版 PDF */}
              <div style={{
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '0.875rem 1.25rem',
                backgroundColor: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: '1 1 240px' }}>
                  <strong style={{ fontSize: '0.95rem', color: '#334155', display: 'block', marginBottom: '0.2rem' }}>
                    📄 下載一頁式隨身摘要 PDF
                  </strong>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                    標準 A4 單頁版面、精簡摘要長者指標給分與衛教重點。
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleDownloadSummaryPdf}
                  disabled={isDownloadingSummaryPdf}
                  style={{ flexShrink: 0 }}
                >
                  {isDownloadingSummaryPdf ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>PDF 生成中...</span>
                    </>
                  ) : (
                    <>
                      <FileDown size={15} />
                      <span>下載 PDF 摘要</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 彈窗頁尾 */}
            <div style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                💡 所有 PDF 均保證 A4 單頁高畫質無變形
              </span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setIsShareModalOpen(false)}
              >
                關閉視窗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
