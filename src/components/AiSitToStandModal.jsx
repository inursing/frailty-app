import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video,
  VideoOff,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  Activity,
  Sparkles,
  Volume2,
  VolumeX,
  Timer,
  Dumbbell,
  ArrowRight,
  Info,
  HelpCircle
} from 'lucide-react';
import {
  loadMediaPipePoseScript,
  calculateJointAngle,
  playBeep,
  playCompletionFanfare,
  speakPrompt,
  drawPoseSkeleton,
  interpretSitToStand
} from '../services/poseDetectionService.js';

export default function AiSitToStandModal({
  isOpen,
  onClose,
  onApplyResult,
  patientName = '受試長者'
}) {
  // 檢測流程階段: 'guide' (安全指引) | 'loading' (載入模型) | 'countdown' (倒數) | 'testing' (進行中) | 'completed' (測驗完成) | 'error' (相機異常)
  const [stage, setStage] = useState('guide');
  
  // 計數與計時狀態
  const [repCount, setRepCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentKneeAngle, setCurrentKneeAngle] = useState(180);
  const [postureState, setPostureState] = useState('READY'); // 'READY' | 'SITTING' | 'ASCENDING' | 'STANDING' | 'DESCENDING'
  const [postureHint, setPostureHint] = useState('準備中...');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 完成成績
  const [finalResult, setFinalResult] = useState(null);

  // DOM Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const poseInstanceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // 狀態機內部追蹤變數 (Ref 避免閉包舊值)
  const stateRef = useRef({
    currentPosture: 'READY',
    repCount: 0,
    minSitAngle: 105,
    minStandAngle: 155,
    lastStateChangeTime: 0,
    startTime: 0
  });

  // 乾淨關閉視訊串流與清理資源
  const cleanupMedia = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (poseInstanceRef.current && typeof poseInstanceRef.current.close === 'function') {
      try {
        poseInstanceRef.current.close();
      } catch (e) {
        // ignore
      }
      poseInstanceRef.current = null;
    }
  }, []);

  // Modal 關閉時重設所有狀態
  useEffect(() => {
    if (!isOpen) {
      cleanupMedia();
      setStage('guide');
      setRepCount(0);
      setElapsedTime(0);
      setFinalResult(null);
      setErrorMessage('');
    }
  }, [isOpen, cleanupMedia]);

  // 元件卸載清理
  useEffect(() => {
    return () => {
      cleanupMedia();
    };
  }, [cleanupMedia]);

  // 聲音輔助函式
  const emitSound = useCallback((type, text = '') => {
    if (!soundEnabled) return;
    if (type === 'beep') playBeep(700, 100);
    if (type === 'rep') {
      playBeep(880, 180);
      if (text) speakPrompt(text);
    }
    if (type === 'fanfare') {
      playCompletionFanfare();
      if (text) speakPrompt(text);
    }
    if (type === 'speech' && text) {
      speakPrompt(text);
    }
  }, [soundEnabled]);

  // 啟動相機並載入 MediaPipe Pose
  const startCameraAndDetection = async () => {
    setStage('loading');
    setErrorMessage('');
    
    try {
      // 1. 取得使用者攝影機權限
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(resolve);
          };
        });
      }

      // 2. 載入 MediaPipe Pose 函式庫
      const Pose = await loadMediaPipePoseScript();
      const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`
      });

      pose.setOptions({
        modelComplexity: 0, // 0 = Lite (極速且適合低階與一般手機/筆電), 1 = Full
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      // 姿態結果回呼
      pose.onResults(handlePoseResults);
      poseInstanceRef.current = pose;

      // 3. 進入 3 秒倒數計時
      runCountdown();

    } catch (err) {
      console.error('Camera or Pose initialization failed:', err);
      let friendlyMsg = '無法開啟攝影機：';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        friendlyMsg += '您已拒絕瀏覽器的相機授權。請於網址列鎖頭處允許使用相機。';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        friendlyMsg += '未在此裝置上偵測到可用的視訊鏡頭。';
      } else {
        friendlyMsg += err.message || '初始化失敗，請檢查網路連線或使用模擬示範。';
      }
      setErrorMessage(friendlyMsg);
      setStage('error');
      cleanupMedia();
    }
  };

  // 3 秒語音倒數
  const runCountdown = () => {
    setStage('countdown');
    let count = 3;
    emitSound('speech', '準備開始，三');

    const countdownTimer = setInterval(() => {
      count -= 1;
      if (count === 2) emitSound('speech', '二');
      if (count === 1) emitSound('speech', '一');
      
      if (count <= 0) {
        clearInterval(countdownTimer);
        emitSound('speech', '開始！');
        beginActualTesting();
      }
    }, 1000);
  };

  // 正式開始計時與動作捕捉
  const beginActualTesting = () => {
    setStage('testing');
    setRepCount(0);
    setElapsedTime(0);

    stateRef.current = {
      currentPosture: 'READY',
      repCount: 0,
      minSitAngle: 105,
      minStandAngle: 155,
      lastStateChangeTime: Date.now(),
      startTime: Date.now()
    };
    startTimeRef.current = Date.now();

    // 啟動碼錶計時 (每 50ms 更新一次畫面秒數)
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const sec = ((Date.now() - startTimeRef.current) / 1000).toFixed(1);
        setElapsedTime(sec);
      }
    }, 50);

    // 啟動畫面即時偵測迴圈
    const processVideoFrame = async () => {
      if (videoRef.current && poseInstanceRef.current && videoRef.current.readyState >= 2) {
        try {
          await poseInstanceRef.current.send({ image: videoRef.current });
        } catch (e) {
          // ignore dropped frame
        }
      }
      animationFrameRef.current = requestAnimationFrame(processVideoFrame);
    };
    processVideoFrame();
  };

  // 處理 MediaPipe 傳回的即時骨架關節資料
  const handlePoseResults = (results) => {
    if (!canvasRef.current || !results || !results.poseLandmarks) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const landmarks = results.poseLandmarks;

    // 計算左腿與右腿關節角度
    // Landmark 23: Left Hip, 25: Left Knee, 27: Left Ankle
    // Landmark 24: Right Hip, 26: Right Knee, 28: Right Ankle
    const leftHip = landmarks[23];
    const leftKnee = landmarks[25];
    const leftAnkle = landmarks[27];

    const rightHip = landmarks[24];
    const rightKnee = landmarks[26];
    const rightAnkle = landmarks[28];

    let angle = 180;
    const leftVisible = (leftKnee?.visibility || 0) > 0.4;
    const rightVisible = (rightKnee?.visibility || 0) > 0.4;

    if (leftVisible && rightVisible) {
      const leftAngle = calculateJointAngle(leftHip, leftKnee, leftAnkle);
      const rightAngle = calculateJointAngle(rightHip, rightKnee, rightAnkle);
      angle = Math.round((leftAngle + rightAngle) / 2);
    } else if (leftVisible) {
      angle = calculateJointAngle(leftHip, leftKnee, leftAnkle);
    } else if (rightVisible) {
      angle = calculateJointAngle(rightHip, rightKnee, rightAnkle);
    }

    setCurrentKneeAngle(angle);

    // 繪製骨架覆蓋層
    drawPoseSkeleton(ctx, landmarks, canvas.width, canvas.height, angle);

    // 動作狀態機判定 (5 次起立坐下)
    updateSitToStandStateMachine(angle);
  };

  // 坐站判定狀態機
  const updateSitToStandStateMachine = (angle) => {
    const s = stateRef.current;
    const now = Date.now();
    
    // 限制狀態轉換最短間隔防抖動 (最少 0.3 秒)
    if (now - s.lastStateChangeTime < 300) return;

    // 1. 坐姿狀態判定 (膝角 <= 105°)
    if (s.currentPosture === 'READY' || s.currentPosture === 'DESCENDING') {
      if (angle <= s.minSitAngle) {
        s.currentPosture = 'SITTING';
        s.lastStateChangeTime = now;
        setPostureState('SITTING');
        setPostureHint('請起身站直！');
      }
    }

    // 2. 起身中狀態 (膝角從坐姿向上增加 > 120°)
    if (s.currentPosture === 'SITTING') {
      if (angle > 125) {
        s.currentPosture = 'ASCENDING';
        s.lastStateChangeTime = now;
        setPostureState('ASCENDING');
        setPostureHint('起立中，請完全站直...');
      }
    }

    // 3. 站直完成 (膝角 >= 155°)
    if (s.currentPosture === 'ASCENDING') {
      if (angle >= s.minStandAngle) {
        s.currentPosture = 'STANDING';
        s.lastStateChangeTime = now;
        setPostureState('STANDING');
        setPostureHint('已站直！請坐回椅子');
        playBeep(650, 80);
      }
    }

    // 4. 坐下中 (膝角從站直下降 < 135°)
    if (s.currentPosture === 'STANDING') {
      if (angle < 135) {
        s.currentPosture = 'DESCENDING';
        s.lastStateChangeTime = now;
        setPostureState('DESCENDING');
        setPostureHint('坐下中...');
      }
    }

    // 5. 完全坐定回原位 -> 完成 1 次計數！
    if (s.currentPosture === 'DESCENDING') {
      if (angle <= s.minSitAngle) {
        s.currentPosture = 'SITTING';
        s.lastStateChangeTime = now;
        s.repCount += 1;
        
        const newCount = s.repCount;
        setRepCount(newCount);
        setPostureState('SITTING');

        if (newCount < 5) {
          emitSound('rep', `第 ${newCount} 次`);
          setPostureHint(`太棒了！已完成第 ${newCount} 次，請繼續起立！`);
        } else {
          // 達到 5 次，測驗結束！
          completeAssessment();
        }
      }
    }
  };

  // 測驗完成結算
  const completeAssessment = (forcedSec = null) => {
    // 停止計時
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const finalSec = forcedSec !== null ? forcedSec : Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1));
    setElapsedTime(finalSec);
    setRepCount(5);

    const interpretation = interpretSitToStand(finalSec);
    const resultObj = {
      durationSeconds: finalSec,
      completedReps: 5,
      testDate: new Date().toLocaleDateString('zh-TW'),
      ...interpretation
    };

    setFinalResult(resultObj);
    setStage('completed');
    emitSound('fanfare', `太棒了！測驗完成，耗時 ${finalSec} 秒。`);
    
    // 關閉相機節省電力
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // 模擬示範功能 (供無法開啟相機或教學展示時使用)
  const runSimulationDemo = () => {
    setStage('testing');
    setRepCount(0);
    setElapsedTime(0);
    setPostureHint('【模擬示範進行中】長輩雙手抱胸，連續起立坐下...');
    
    let count = 0;
    let sec = 0.0;
    
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      sec = Number((sec + 0.1).toFixed(1));
      setElapsedTime(sec);
    }, 100);

    const simStep = (rep) => {
      if (rep >= 5) {
        completeAssessment(11.2);
        return;
      }
      
      // 坐到站
      setTimeout(() => {
        setCurrentKneeAngle(168);
        setPostureState('STANDING');
        setPostureHint(`第 ${rep + 1} 次：站直 (168°)`);
        playBeep(650, 80);
      }, 1000);

      // 站回坐
      setTimeout(() => {
        count += 1;
        setRepCount(count);
        setCurrentKneeAngle(92);
        setPostureState('SITTING');
        setPostureHint(`第 ${count} 次：完全坐下 (92°)`);
        emitSound('rep', `第 ${count} 次`);

        if (count < 5) {
          simStep(count);
        } else {
          completeAssessment(11.2);
        }
      }, 2200);
    };

    simStep(0);
  };

  // 將結果帶入臨床評估
  const handleApply = () => {
    if (finalResult && onApplyResult) {
      onApplyResult(finalResult);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-container"
        style={{
          maxWidth: '840px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '1.25rem'
        }}
      >
        {/* Modal 標題區 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0.875rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7'
            }}>
              <Video size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                  AI 視訊 5 次椅子坐起測試 (5XSTS)
                </h3>
                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                  Google MediaPipe 即時骨架分析
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.825rem', color: '#64748b' }}>
                高齡肌少症與下肢衰弱客觀檢測・100% 瀏覽器本地運算・醫療隱私零上傳
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? '關閉語音提示' : '開啟語音提示'}
              style={{ padding: '0.4rem 0.6rem' }}
            >
              {soundEnabled ? <Volume2 size={16} color="#0284c7" /> : <VolumeX size={16} color="#94a3b8" />}
            </button>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              title="關閉視窗"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* 主要互動區域 */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
          
          {/* 階段 1：安全須知與操作指引 */}
          {stage === 'guide' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.25rem'
              }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} color="#059669" />
                  長者安全守則與施測前準備
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0.875rem'
                  }}>
                    <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      🪑 1. 選擇穩固椅子
                    </div>
                    <div style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.5 }}>
                      請使用座面高度約 43-46 公分、<strong>無輪子且穩固不滑動</strong>的靠背平椅，靠牆擺放更安全。
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0.875rem'
                  }}>
                    <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      🙅‍♂️ 2. 雙手交叉抱胸
                    </div>
                    <div style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.5 }}>
                      請受試者將<strong>雙手交叉放於胸前</strong>，起身時請勿用雙手推大腿或支撐扶手借力。
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0.875rem'
                  }}>
                    <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      📹 3. 調整攝影機視野
                    </div>
                    <div style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.5 }}>
                      請退後約 2~2.5 公尺，斜側視角或正面皆可，確保畫面能<strong>完整看見長者坐下與站直的軀幹與膝蓋</strong>。
                    </div>
                  </div>
                </div>

                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  fontSize: '0.825rem',
                  color: '#92400e'
                }}>
                  <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>安全第一：</strong>施測過程中若長輩感到頭暈、關節劇烈疼痛或失去平衡，請照護者隨時攙扶並立即終止檢測。
                  </span>
                </div>
              </div>

              {/* 臨床切點說明 */}
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '0.875rem 1.25rem',
                fontSize: '0.825rem',
                color: '#1e3a8a',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <span style={{ fontWeight: 700 }}>🏆 臨床評估標準（EWGSOP2 指引）：</span>
                  <span style={{ marginLeft: '0.5rem' }}>
                    &lt; 10 秒（健壯良好） ｜ 10 ~ 15 秒（輕度偏慢，衰弱前期） ｜ &gt; 15 秒（顯著衰退，衰弱高風險）
                  </span>
                </div>
              </div>

              {/* 啟動按鈕區 */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={runSimulationDemo}
                  title="無鏡頭時快速預覽 5 次坐站流程與成績解讀"
                >
                  <Activity size={16} />
                  <span>模擬示範 (Demo Test)</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={startCameraAndDetection}
                  style={{
                    backgroundColor: '#0284c7',
                    borderColor: '#0284c7',
                    padding: '0.65rem 1.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 700
                  }}
                >
                  <Video size={18} />
                  <span>開啟鏡頭並準備檢測</span>
                </button>
              </div>
            </div>
          )}

          {/* 階段 2：載入模型中 */}
          {stage === 'loading' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4rem 1rem',
              textAlign: 'center'
            }}>
              <div className="spinner" style={{ width: '45px', height: '45px', borderWidth: '4px', marginBottom: '1.25rem' }} />
              <h4 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>正在啟動視訊鏡頭與 AI 骨架辨識模型...</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                首次載入可能需要 2~5 秒鐘，運算完全在您的瀏覽器端進行，不消耗外部流量。
              </p>
            </div>
          )}

          {/* 階段 3 & 4：倒數與進行中的視訊檢測畫面 */}
          {(stage === 'countdown' || stage === 'testing') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* 上方儀表板狀態條 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem',
                backgroundColor: '#0f172a',
                padding: '0.875rem',
                borderRadius: '12px',
                color: '#ffffff'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    已完成次數
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', lineHeight: 1.2 }}>
                    {repCount} <span style={{ fontSize: '1.1rem', color: '#94a3b8' }}>/ 5</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    計時秒數
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', lineHeight: 1.2, fontFamily: 'monospace' }}>
                    {elapsedTime} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>秒</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    膝關節角度
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1.2, fontFamily: 'monospace' }}>
                    {currentKneeAngle}°
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    即時動作辨識
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    marginTop: '6px',
                    color: postureState === 'STANDING' ? '#10b981' : postureState === 'SITTING' ? '#38bdf8' : '#e2e8f0'
                  }}>
                    {postureState === 'STANDING' && '🟢 已站直'}
                    {postureState === 'SITTING' && '🔵 坐姿定位'}
                    {postureState === 'ASCENDING' && '🟡 起立中'}
                    {postureState === 'DESCENDING' && '🟠 坐下中'}
                    {postureState === 'READY' && '⚪ 準備就緒'}
                  </div>
                </div>
              </div>

              {/* 視訊 + 骨架畫布容器 */}
              <div style={{
                position: 'relative',
                width: '100%',
                maxHeight: '440px',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#020617',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                aspectRatio: '4/3'
              }}>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)' // 鏡像翻轉長輩看自己更直覺
                  }}
                />
                
                {/* 骨架 Canvas 疊加層 */}
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={480}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)' // 與鏡像視頻一致
                  }}
                />

                {/* 倒數遮罩 */}
                {stage === 'countdown' && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    zIndex: 10
                  }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#38bdf8', marginBottom: '0.5rem' }}>
                      請長輩雙手抱胸，背靠椅背
                    </div>
                    <div style={{ fontSize: '6rem', fontWeight: 900, color: '#ffffff', textShadow: '0 0 20px #0284c7' }}>
                      準備
                    </div>
                  </div>
                )}

                {/* 動作提示浮條 */}
                {stage === 'testing' && (
                  <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '9999px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 5
                  }}>
                    {postureHint}
                  </div>
                )}
              </div>

              {/* 操作控制列 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
                  💡 建議全身入鏡並在光線充足處進行，可大幅提高關節追蹤精準度。
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      cleanupMedia();
                      setStage('guide');
                    }}
                  >
                    <RotateCcw size={15} />
                    <span>取消並返回</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => completeAssessment()}
                    title="若已完成 5 次但鏡頭偶發漏失，可直接手動結算"
                    style={{ backgroundColor: '#0284c7' }}
                  >
                    <CheckCircle2 size={15} />
                    <span>手動結束計時</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 階段 5：測驗完成成績摘要 */}
          {stage === 'completed' && finalResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s ease' }}>
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem'
                }}>
                  <CheckCircle2 size={32} />
                </div>
                <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.35rem', fontWeight: 800, color: '#166534' }}>
                  5 次起立坐下測試完成！
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563' }}>
                  受試長者：{patientName} ｜ 施測日期：{finalResult.testDate}
                </p>

                {/* 數據大卡片 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                  marginTop: '1.25rem'
                }}>
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '1rem'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>總耗時</div>
                    <div style={{ fontSize: '2.4rem', fontWeight: 900, color: finalResult.color, fontFamily: 'monospace' }}>
                      {finalResult.durationSeconds} <span style={{ fontSize: '1rem' }}>秒</span>
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '1rem'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>下肢肌力評級</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: finalResult.color, marginTop: '6px' }}>
                      {finalResult.statusLabel}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                      {finalResult.frailtyRisk}
                    </div>
                  </div>
                </div>

                {/* 臨床衛教處方建議 */}
                <div style={{
                  marginTop: '1.25rem',
                  backgroundColor: '#ffffff',
                  border: `1px solid ${finalResult.color}30`,
                  borderRadius: '10px',
                  padding: '1rem 1.25rem',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  color: '#334155',
                  lineHeight: 1.6
                }}>
                  <div style={{ fontWeight: 700, color: finalResult.color, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} />
                    臨床指引與長者處方建議：
                  </div>
                  <div>{finalResult.recommendation}</div>
                </div>
              </div>

              {/* 動作按鈕 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setStage('guide');
                    setRepCount(0);
                    setElapsedTime(0);
                    setFinalResult(null);
                  }}
                >
                  <RotateCcw size={16} />
                  <span>重新檢測</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApply}
                  style={{
                    backgroundColor: '#059669',
                    borderColor: '#059669',
                    padding: '0.65rem 1.5rem',
                    fontWeight: 700
                  }}
                >
                  <Sparkles size={16} />
                  <span>帶入臨床評估筆記與 AI 報告</span>
                </button>
              </div>
            </div>
          )}

          {/* 錯誤異常處理 */}
          {stage === 'error' && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem'
              }}>
                <VideoOff size={24} />
              </div>
              <h4 style={{ margin: '0 0 0.5rem', color: '#991b1b', fontSize: '1.1rem' }}>視訊相機啟動受阻</h4>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#b91c1c', maxWidth: '500px', marginInline: 'auto' }}>
                {errorMessage}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setStage('guide')}
                >
                  返回安全指引
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={runSimulationDemo}
                  style={{ backgroundColor: '#0284c7' }}
                >
                  <Activity size={16} />
                  <span>改用模擬示範體驗 (Demo)</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
