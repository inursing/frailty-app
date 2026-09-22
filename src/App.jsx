import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header.jsx';
import HeroSection from './components/HeroSection.jsx';
import BasicInfoForm from './components/BasicInfoForm.jsx';
import ClinicalNotesInput from './components/ClinicalNotesInput.jsx';
import FriedCriteriaSection from './components/FriedCriteriaSection.jsx';
import AssessmentResult from './components/AssessmentResult.jsx';
import LogicExplanationModal from './components/LogicExplanationModal.jsx';
import ApiKeyModal from './components/ApiKeyModal.jsx';
import AuthModal from './components/AuthModal.jsx';
import ConsentModal from './components/ConsentModal.jsx';
import LongitudinalTrackingView from './components/LongitudinalTrackingView.jsx';
import AdminCohortView from './components/AdminCohortView.jsx';
import AiSitToStandModal from './components/AiSitToStandModal.jsx';
import Footer from './components/Footer.jsx';
import { evaluateCriteria, checkUnfilledItems } from './constants/friedCriteria.js';
import { generateCustomAssessment } from './services/llmService.js';
import { onAuthStatusChange, logoutUser } from './services/firebase.js';
import { saveAssessmentRecord } from './services/trackingService.js';
import { CheckCircle2, TrendingUp, ArrowRight } from 'lucide-react';

const INITIAL_BASIC_INFO = {
  assessmentDate: new Date().toISOString().slice(0, 10),
  age: '',
  gender: '',
  height: '',
  weight: ''
};

const INITIAL_CRITERIA_ANSWERS = {
  weightLoss: {
    hasLoss: false,
    mode: 'direct',
    lossKg: '',
    pastWeight: '',
    currentWeight: ''
  },
  exhaustion: {
    frequency: ''
  },
  physicalActivity: {
    level: ''
  },
  walkingSpeed: {
    method: 'measured',
    walkTimeSeconds: '',
    selfReportStatus: ''
  },
  gripStrength: {
    method: 'measured',
    gripKg: '',
    selfReportStatus: ''
  }
};

export default function App() {
  // 分頁狀態：'assessment' (單次評估) | 'tracking' (長期追蹤趨勢) | 'admin' (管理者檢索)
  const [activeTab, setActiveTab] = useState('assessment');

  // 受試者 / 管理者登入狀態
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [hasConsentedSession, setHasConsentedSession] = useState(false);
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState(null);

  // 表單資料狀態
  const [basicInfo, setBasicInfo] = useState(INITIAL_BASIC_INFO);
  const [criteriaAnswers, setCriteriaAnswers] = useState(INITIAL_CRITERIA_ANSWERS);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isLogicModalOpen, setIsLogicModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isAiCameraModalOpen, setIsAiCameraModalOpen] = useState(false);
  const [sitToStandResult, setSitToStandResult] = useState(null);

  // API Key 本機儲存管理
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('frailty_gemini_api_key') || '';
  });

  // AI 客製化報告生成狀態
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiReport, setAiReport] = useState(null);

  // 監聽 Firebase / 本機展示帳號登入狀態
  useEffect(() => {
    const unsubscribe = onAuthStatusChange((user) => {
      setCurrentUser(user);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // 即時計算傳統 Fried 評估結果
  const evaluationResults = useMemo(() => {
    return evaluateCriteria({ basicInfo, criteriaAnswers });
  }, [basicInfo, criteriaAnswers]);

  // 即時偵測是否有漏填之評估項目
  const unfilledItems = useMemo(() => {
    return checkUnfilledItems(basicInfo, criteriaAnswers);
  }, [basicInfo, criteriaAnswers]);

  // 切換個別評估指標答案
  const handleCriteriaChange = (criterionKey, newAnswer) => {
    setCriteriaAnswers((prev) => ({
      ...prev,
      [criterionKey]: {
        ...prev[criterionKey],
        ...newAnswer
      }
    }));
  };

  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    if (newKey) {
      localStorage.setItem('frailty_gemini_api_key', newKey);
    } else {
      localStorage.removeItem('frailty_gemini_api_key');
    }
  };

  // 登出
  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setSaveSuccessToast(null);
  };

  // 觸發 AI 客製化深度評估生成
  const handleGenerateAiReport = async () => {
    if (unfilledItems && unfilledItems.length > 0) {
      alert(
        `【無法產生建議：尚有 ${unfilledItems.length} 項評估資料未填寫完整】\n\n` +
        unfilledItems.map((item, idx) => `${idx + 1}. ${item.label}：${item.hint}`).join('\n') +
        '\n\n為確保長者安全與客製化照護處方之準確性，必須填寫完整所有項目後，方能產生建議。系統已為您跳轉至未填項目。'
      );
      const firstUnfilled = document.getElementById(unfilledItems[0]?.id || 'basic-info-section');
      if (firstUnfilled) {
        firstUnfilled.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (firstUnfilled.focus) firstUnfilled.focus();
      }
      return;
    }

    setIsGeneratingAi(true);
    try {
      const report = await generateCustomAssessment({
        basicInfo,
        criteriaAnswers,
        evaluationResults,
        clinicalNotes,
        apiKey
      });
      setAiReport(report);

      // 生成完成後平滑滾動至報告區域
      const el = document.getElementById('assessment-result-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('AI 報告生成失敗：', error);
      alert('AI 報告生成發生問題，請檢查網路或 API Key 設定。');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // 執行儲存評估紀錄至 Firestore / 本機資料庫
  const executeSaveRecord = async (userToSave = currentUser) => {
    if (!userToSave?.subjectId) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsSavingRecord(true);
    try {
      await saveAssessmentRecord({
        subjectId: userToSave.subjectId,
        userId: userToSave.uid,
        basicInfo,
        evaluationResults,
        criteriaAnswers,
        clinicalNotes,
        consentGiven: true
      });

      setSaveSuccessToast(`✅ 成功保存評估紀錄至受試者【${userToSave.subjectId}】長期追蹤資料庫！`);
      setTimeout(() => {
        setSaveSuccessToast(null);
      }, 7000);
    } catch (err) {
      console.error('儲存紀錄失敗：', err);
      alert('儲存紀錄時發生問題：' + err.message);
    } finally {
      setIsSavingRecord(false);
    }
  };

  // 點擊「保存至長期追蹤紀錄」按鈕
  const handleSaveRecord = () => {
    // 嚴格檢查：若有未填寫完整之資料，禁止保存紀錄
    if (unfilledItems && unfilledItems.length > 0) {
      alert(
        `【無法保存追蹤紀錄：尚有 ${unfilledItems.length} 項資料未填寫完整】\n\n` +
        unfilledItems.map((item, idx) => `${idx + 1}. ${item.label}：${item.hint}`).join('\n') +
        '\n\n長期追蹤資料庫僅儲存完整評估數據，請補齊資料後再行保存。系統已為您跳轉至未填項目。'
      );
      const firstUnfilled = document.getElementById(unfilledItems[0]?.id || 'basic-info-section');
      if (firstUnfilled) {
        firstUnfilled.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (firstUnfilled.focus) firstUnfilled.focus();
      }
      return;
    }

    // 檢查是否有登入或指定受試者編號
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    // 檢查是否已取得知情同意
    if (!hasConsentedSession) {
      setIsConsentModalOpen(true);
      return;
    }

    executeSaveRecord(currentUser);
  };

  // 同意書確認回呼
  const handleConsentConfirmed = () => {
    setHasConsentedSession(true);
    executeSaveRecord(currentUser);
  };

  // 登入成功回呼
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (!hasConsentedSession && user.role !== 'admin') {
      setIsConsentModalOpen(true);
    } else {
      executeSaveRecord(user);
    }
  };

  // 重設所有資料
  const handleReset = () => {
    if (window.confirm('確定要清除所有自訂資料與 AI 報告，重新開始嗎？')) {
      setBasicInfo({
        assessmentDate: new Date().toISOString().slice(0, 10),
        age: '',
        gender: '',
        height: '',
        weight: ''
      });
      setCriteriaAnswers({
        weightLoss: { hasLoss: false, mode: 'direct', lossKg: '', pastWeight: '', currentWeight: '' },
        exhaustion: { frequency: '' },
        physicalActivity: { level: '' },
        walkingSpeed: { method: 'measured', walkTimeSeconds: '', selfReportStatus: '' },
        gripStrength: { method: 'measured', gripKg: '', selfReportStatus: '' }
      });
      setClinicalNotes('');
      setAiReport(null);
      setSitToStandResult(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 套用 AI 視訊 5 次坐站測試成績至評估筆記與狀態
  const handleApplySitToStandResult = (result) => {
    setSitToStandResult(result);
    
    // 自動將 5XSTS 測量結果格式化追加至臨床筆記 (Clinical Notes)
    const assessmentNote = `【AI 鏡頭 5次起立坐下測試(5XSTS)】完成耗時 ${result.durationSeconds} 秒，評級為【${result.statusLabel}】(${result.frailtyRisk})。建議指引：${result.recommendation}`;
    
    setClinicalNotes((prevNotes) => {
      const trimmed = (prevNotes || '').trim();
      if (!trimmed) {
        return assessmentNote;
      }
      // 避免重複加入，若已存在則替換最新成績
      if (trimmed.includes('【AI 鏡頭 5次起立坐下測試(5XSTS)】')) {
        return trimmed.replace(/【AI 鏡頭 5次起立坐下測試\(5XSTS\)】[\s\S]*?(?=\n\n|$)/, assessmentNote);
      }
      return `${trimmed}\n\n${assessmentNote}`;
    });

    setSaveSuccessToast(`已成功套用 AI 坐站實測成績 (${result.durationSeconds}秒，${result.statusLabel})`);
    setTimeout(() => setSaveSuccessToast(null), 4000);
  };

  // 開始評估捲動
  const handleStartAssessment = () => {
    setActiveTab('assessment');
    setTimeout(() => {
      const el = document.getElementById('basic-info-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <div className="app-layout">
      {/* 浮動儲存成功提示 Toast */}
      {saveSuccessToast && (
        <div style={{
          position: 'fixed',
          top: '4.75rem',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#064e3b',
          color: '#ecfdf5',
          padding: '0.875rem 1.5rem',
          borderRadius: '9999px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          animation: 'fadeIn 0.2s ease-in-out',
          border: '1.5px solid #10b981'
        }}>
          <CheckCircle2 size={20} color="#34d399" />
          <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{saveSuccessToast}</span>
          <button
            type="button"
            onClick={() => {
              setActiveTab('tracking');
              setSaveSuccessToast(null);
            }}
            style={{
              backgroundColor: '#10b981',
              color: '#064e3b',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.35rem 0.875rem',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginLeft: '0.5rem'
            }}
          >
            <span>立即查看追蹤趨勢</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 導覽列 */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onReset={handleReset}
        onOpenLogicModal={() => setIsLogicModalOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasApiKey={Boolean(apiKey && apiKey.length > 5)}
        onOpenAiCameraModal={() => setIsAiCameraModalOpen(true)}
      />

      <main className="app-container" style={{ flex: '1 0 auto', paddingBottom: '3rem' }}>
        {/* 模式一：單次評估模式 */}
        {activeTab === 'assessment' && (
          <>
            {/* 首頁 Hero 區域 */}
            <HeroSection
              onStartAssessment={handleStartAssessment}
              onOpenLogicModal={() => setIsLogicModalOpen(true)}
              onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
            />

            {/* 基本資料表單 */}
            <BasicInfoForm
              basicInfo={basicInfo}
              onChange={(newInfo) => setBasicInfo(newInfo)}
              unfilledItems={unfilledItems}
            />

            {/* 選填：臨床病史與生活情境補充（供 LLM 客製化） */}
            <ClinicalNotesInput
              clinicalNotes={clinicalNotes}
              onChange={(notes) => setClinicalNotes(notes)}
            />

            {/* Fried 五大項目評估 */}
            <FriedCriteriaSection
              basicInfo={basicInfo}
              criteriaAnswers={criteriaAnswers}
              onChangeCriteria={handleCriteriaChange}
              evaluationResults={evaluationResults}
              onOpenLogicModal={() => setIsLogicModalOpen(true)}
              unfilledItems={unfilledItems}
              onOpenAiCameraModal={() => setIsAiCameraModalOpen(true)}
              sitToStandResult={sitToStandResult}
            />

            {/* 評估結果與 LLM 客製化報告 */}
            <AssessmentResult
              basicInfo={basicInfo}
              evaluationResults={evaluationResults}
              criteriaAnswers={criteriaAnswers}
              clinicalNotes={clinicalNotes}
              onReset={handleReset}
              onOpenLogicModal={() => setIsLogicModalOpen(true)}
              onGenerateAiReport={handleGenerateAiReport}
              isGeneratingAi={isGeneratingAi}
              aiReport={aiReport}
              unfilledItems={unfilledItems}
              onSaveRecord={handleSaveRecord}
              isSavingRecord={isSavingRecord}
              currentUser={currentUser}
            />
          </>
        )}

        {/* 模式二：我的追蹤趨勢 (Recharts 多指標趨勢圖表) */}
        {activeTab === 'tracking' && (
          <LongitudinalTrackingView
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onSwitchToAssessment={() => setActiveTab('assessment')}
          />
        )}

        {/* 模式三：管理者檢索 (多個案佇列與檢索) */}
        {activeTab === 'admin' && (
          <AdminCohortView
            onSelectSubject={(sId) => {
              setCurrentUser(prev => ({
                ...(prev || {}),
                subjectId: sId,
                role: 'subject'
              }));
              setActiveTab('tracking');
            }}
            onSwitchToTracking={() => setActiveTab('tracking')}
          />
        )}
      </main>

      {/* 登入 / 受試者編號認證 Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialSubjectId={currentUser?.subjectId || 'SUBJ-2026-001'}
      />

      {/* 知情同意書 Modal */}
      <ConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        onConfirmConsent={handleConsentConfirmed}
        subjectId={currentUser?.subjectId || 'SUBJ-2026-001'}
      />

      {/* 教學邏輯 Modal */}
      <LogicExplanationModal
        isOpen={isLogicModalOpen}
        onClose={() => setIsLogicModalOpen(false)}
      />

      {/* API Key 設定 Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      {/* AI 視訊 5次椅子坐起檢測 Modal */}
      <AiSitToStandModal
        isOpen={isAiCameraModalOpen}
        onClose={() => setIsAiCameraModalOpen(false)}
        onApplyResult={handleApplySitToStandResult}
        patientName={currentUser?.subjectId ? `個案 ${currentUser.subjectId}` : '受試長者'}
      />

      {/* 頁尾 */}
      <Footer />
    </div>
  );
}
