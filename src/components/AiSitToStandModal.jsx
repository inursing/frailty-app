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
  Check,
  RefreshCw
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
  // 檢測流程階段:
  // 'guide' (安全須知)
  // 'preview' (鏡頭已開，調整坐姿與預覽骨架)
  // 'countdown' (3秒倒數)
  // 'testing' (正式計時測驗)
  // 'completed' (測驗完成成績)
  // 'error' (相機異常)
  const [stage, setStage] = useState('guide');
  
  // 狀態與數值
  const [repCount, setRepCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState('0.0');
  const [currentKneeAngle, setCurrentKneeAngle] = useState(180);
  const [postureState, setPostureState] = useState('READY'); // 'READY' | 'SITTING' | 'ASCENDING' | 'STANDING' | 'DESCENDING'
  const [postureHint, setPostureHint] = useState('請雙手抱胸，背靠椅背坐好');
  const [hasDetectedBody, setHasDetectedBody] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdownNum, setCountdownNum] = useState(3);
  
  // 完成成績物件
  const [finalResult, setFinalResult] = useState(null);

  // DOM & 執行緒 Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const poseInstanceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const isActiveRef = useRef(false);
  const stageRef = useRef('guide');

  // 狀態機內部追蹤變數 (避免閉包舊值)
  const stateRef = useRef({
    currentPosture: 'READY',
    repCount: 0,
    minSitAngle: 110,    // 膝角 <= 110° 判定為坐姿
    minStandAngle: 152,  // 膝角 >= 152° 判定為站姿 (考量長者膝關節退化不一定能完全伸直180°)
    lastStateChangeTime: 0,
    startTime: 0
  });

  // 同步 stageRef
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  // 乾淨釋放攝影機與 MediaPipe 資源
  const cleanupMedia = useCallback(() => {
    isActiveRef.current = false;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
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

  // Modal 關閉或卸載時清理
  useEffect(() => {
    if (!isOpen) {
      cleanupMedia();
      setStage('guide');
      setRepCount(0);
      setElapsedTime('0.0');
      setFinalResult(null);
      setErrorMessage('');
      setHasDetectedBody(false);
    }
  }, [isOpen, cleanupMedia]);

  useEffect(() => {
    return () => {
      cleanupMedia();
    };
  }, [cleanupMedia]);

  // 聲音發送輔助
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

  // 1. 開啟鏡頭並進入預覽與骨架載入階段
  const startCameraAndDetection = async () => {
    setErrorMessage('');
    setIsModelLoading(true);
    // 切換至預覽模式，此時 DOM 中的 video/canvas 一定會掛載
    setStage('preview');
    setPostureHint('正在啟動攝影機畫面...');

    try {
      // 取得攝影機串流
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      mediaStreamRef.current = stream;

      // 綁定視訊串流至 video 標籤
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(e => console.warn('Video play warning:', e));
        };
      }

      setPostureHint('正在載入 AI 骨架辨識模型，請稍候...');

      // 載入 MediaPipe Pose
      const Pose = await loadMediaPipePoseScript();
      const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`
      });

      pose.setOptions({
        modelComplexity: 0, // 0 = Lite (極速且對一般筆電/手機最平順)
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      pose.onResults(handlePoseResults);
      poseInstanceRef.current = pose;
      setIsModelLoading(false);
      setPostureHint('已就緒！請雙手抱胸坐在椅子上，確認骨架後點擊「開始測驗」');

      // 啟動視訊偵測循環
      isActiveRef.current = true;
      startDetectionLoop();

    } catch (err) {
      console.error('Camera or Pose initialization failed:', err);
      setIsModelLoading(false);
      let friendlyMsg = '無法開啟視訊鏡頭：';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        friendlyMsg += '瀏覽器相機存取已被拒絕。請至網址列左側點擊鎖頭圖示，將相機設定為「允許」。';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        friendlyMsg += '此電腦或裝置未偵測到可用的視訊鏡頭。';
      } else {
        friendlyMsg += err.message || '初始化失敗，請改用模擬示範模式體驗。';
      }
      setErrorMessage(friendlyMsg);
      setStage('error');
      cleanupMedia();
    }
  };

  // 畫面連續處理循環 (使用 isProcessing 防堵非同步請求堆積)
  const startDetectionLoop = () => {
    let isProcessing = false;

    const loop = async () => {
      if (!isActiveRef.current) return;

      const video = videoRef.current;
      const pose = poseInstanceRef.current;

      if (
        !isProcessing &&
        video &&
        pose &&
        video.readyState >= 2 &&
        !video.paused &&
        !video.ended
      ) {
        isProcessing = true;
        try {
          await pose.send({ image: video });
        } catch (e) {
          // ignore single frame drop
        } finally {
          isProcessing = false;
        }
      }

      if (isActiveRef.current) {
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  // 處理 MediaPipe 傳回的即時骨架關節資料
  const handlePoseResults = (results) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !results) return;

    // 動態同步 Canvas 與 Video 真實像素寬高
    if (video && video.videoWidth > 0) {
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    }

    const ctx = canvas.getContext('2d');
    const landmarks = results.poseLandmarks;

    // 檢查是否有捕捉到人體骨架
    if (!landmarks || landmarks.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDetectedBody(false);
      return;
    }

    setHasDetectedBody(true);

    // 計算左腿與右腿膝關節角度
    // Landmark 23: Left Hip, 25: Left Knee, 27: Left Ankle
    // Landmark 24: Right Hip, 26: Right Knee, 28: Right Ankle
    const leftHip = landmarks[23];
    const leftKnee = landmarks[25];
    const leftAnkle = landmarks[27];

    const rightHip = landmarks[24];
    const rightKnee = landmarks[26];
    const rightAnkle = landmarks[28];

    let angle = 180;
    const leftVis = (leftKnee?.visibility || 0) > 0.35;
    const rightVis = (rightKnee?.visibility || 0) > 0.35;

    if (leftVis && rightVis) {
      const aL = calculateJointAngle(leftHip, leftKnee, leftAnkle);
      const aR = calculateJointAngle(rightHip, rightKnee, rightAnkle);
      angle = Math.round((aL + aR) / 2);
    } else if (leftVis) {
      angle = calculateJointAngle(leftHip, leftKnee, leftAnkle);
    } else if (rightVis) {
      angle = calculateJointAngle(rightHip, rightKnee, rightAnkle);
    }

    setCurrentKneeAngle(angle);

    // 繪製骨架覆蓋線條
    drawPoseSkeleton(ctx, landmarks, canvas.width, canvas.height, angle);

    // 如果當前處於正式測驗中，推進坐站狀態機
    if (stageRef.current === 'testing') {
      updateSitToStandStateMachine(angle);
    }
  };

  // 2. 啟動 3 秒倒數計時
  const triggerCountdown = () => {
    setStage('countdown');
    setCountdownNum(3);
    emitSound('speech', '準備開始，三');

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      setCountdownNum(count);

      if (count === 2) emitSound('speech', '二');
      if (count === 1) emitSound('speech', '一');

      if (count <= 0) {
        clearInterval(interval);
        emitSound('speech', '開始！');
        beginTestingMode();
      }
    }, 1000);
  };

  // 3. 進入正式測驗階段
  const beginTestingMode = () => {
    setStage('testing');
    setRepCount(0);
    setElapsedTime('0.0');

    stateRef.current = {
      currentPosture: 'READY',
      repCount: 0,
      minSitAngle: 110,
      minStandAngle: 152,
      lastStateChangeTime: Date.now(),
      startTime: Date.now()
    };
    startTimeRef.current = Date.now();

    // 啟動碼錶 (每 50ms 更新一次)
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const sec = ((Date.now() - startTimeRef.current) / 1000).toFixed(1);
        setElapsedTime(sec);
      }
    }, 50);
  };

  // 坐站運動學狀態機
  const updateSitToStandStateMachine = (angle) => {
    const s = stateRef.current;
    const now = Date.now();

    // 防抖動：兩次狀態切換之間至少間隔 0.25 秒
    if (now - s.lastStateChangeTime < 250) return;

    // 階段 1：坐姿鎖定 (膝角 <= 110°)
    if (s.currentPosture === 'READY' || s.currentPosture === 'DESCENDING') {
      if (angle <= s.minSitAngle) {
        s.currentPosture = 'SITTING';
        s.lastStateChangeTime = now;
        setPostureState('SITTING');
        setPostureHint('坐定確認！請準備用力起身站直');
      }
    }

    // 階段 2：起身中 (膝角自坐姿向上伸展 > 125°)
    if (s.currentPosture === 'SITTING') {
      if (angle > 125) {
        s.currentPosture = 'ASCENDING';
        s.lastStateChangeTime = now;
        setPostureState('ASCENDING');
        setPostureHint('起立中... 請完全站直！');
      }
    }

    // 階段 3：站直完成 (膝角 >= 152°)
    if (s.currentPosture === 'ASCENDING') {
      if (angle >= s.minStandAngle) {
        s.currentPosture = 'STANDING';
        s.lastStateChangeTime = now;
        setPostureState('STANDING');
        setPostureHint('站直完成！請完全坐回椅子');
        playBeep(650, 80);
      }
    }

    // 階段 4：坐下中 (膝角從站直向下降 < 135°)
    if (s.currentPosture === 'STANDING') {
      if (angle < 135) {
        s.currentPosture = 'DESCENDING';
        s.lastStateChangeTime = now;
        setPostureState('DESCENDING');
        setPostureHint('坐下中...');
      }
    }

    // 階段 5：坐回原位 -> 完成 1 次計數！
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
          // 滿 5 次完成測驗！
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

    const finalSec = forcedSec !== null 
      ? forcedSec 
      : Number(((Date.now() - (startTimeRef.current || Date.now())) / 1000).toFixed(1));
    
    setElapsedTime(String(finalSec));
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
    emitSound('fanfare', `太棒了！測驗完成，總共耗時 ${finalSec} 秒。`);
  };

  // 模擬示範流程 (Demo)
  const runSimulationDemo = () => {
    setStage('testing');
    setRepCount(0);
    setElapsedTime('0.0');
    setPostureHint('【模擬示範】長輩雙手抱胸，連續起立坐下 5 次...');
    
    let count = 0;
    let sec = 0.0;
    
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      sec = Number((sec + 0.1).toFixed(1));
      setElapsedTime(sec.toFixed(1));
    }, 100);

    const step = (rep) => {
      if (rep >= 5) {
        completeAssessment(11.2);
        return;
      }
      
      // 模擬站直
      setTimeout(() => {
        setCurrentKneeAngle(168);
        setPostureState('STANDING');
        setPostureHint(`第 ${rep + 1} 次：站直 (168°)`);
        playBeep(650, 80);
      }, 1000);

      // 模擬坐下
      setTimeout(() => {
        count += 1;
        setRepCount(count);
        setCurrentKneeAngle(92);
        setPostureState('SITTING');
        setPostureHint(`第 ${count} 次：完全坐下 (92°)`);
        emitSound('rep', `第 ${count} 次`);

        if (count < 5) {
          step(count);
        } else {
          completeAssessment(11.2);
        }
      }, 2200);
    };

    step(0);
  };

  // 帶入評估表單
  const handleApply = () => {
    if (finalResult && onApplyResult) {
      onApplyResult(finalResult);
      onClose();
    }
  };

  if (!isOpen) return null;

  const isCameraActive = stage === 'preview' || stage === 'countdown' || stage === 'testing';

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-container"
        style={{
          maxWidth: '860px',
          width: '96%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '1.25rem'
        }}
      >
        {/* Header 區塊 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0.75rem',
          marginBottom: '0.875rem'
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  AI 視訊 5 次椅子坐起測試 (5XSTS)
                </h3>
                <span className="badge badge-success" style={{ fontSize: '0.725rem' }}>
                  Google MediaPipe 姿態追蹤
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                EWGSOP2 國際肌少症與下肢衰弱客觀檢測・100% 瀏覽器本地運算・醫療隱私零上傳
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? '關閉音效與語音' : '開啟音效與語音'}
              style={{ padding: '0.35rem 0.5rem' }}
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

        {/* 內容區塊 */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
          
          {/* 階段 1：安全須知與操作指引 */}
          {stage === 'guide' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.25rem'
              }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} color="#059669" />
                  施測前安全守則與環境確認
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.875rem' }}>
                    <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      🪑 1. 平穩無輪椅子
                    </div>
                    <div style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.5 }}>
                      請使用高約 43-46 公分、<strong>無輪子且穩固</strong>的靠背平椅，靠牆擺放以確保安全。
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.875rem' }}>
                    <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      🙅‍♂️ 2. 雙手交叉抱胸
                    </div>
                    <div style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.5 }}>
                      請長者<strong>雙手交叉於胸前</strong>，起身與坐下時請勿用手推大腿或扶手借力。
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.875rem' }}>
                    <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      📹 3. 視訊視野距離
                    </div>
                    <div style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.5 }}>
                      相機距離長輩約 2~2.5 公尺（斜側方或正面），確保<strong>頭部、軀幹與膝腳踝完整入鏡</strong>。
                    </div>
                  </div>
                </div>

                <div style={{
                  marginTop: '0.875rem',
                  padding: '0.625rem 0.875rem',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: '#92400e'
                }}>
                  <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />
                  <span><strong>安全第一：</strong>若長輩起立時感到頭暈或站立不穩，請照護者隨時在側攙扶並停止測驗。</span>
                </div>
              </div>

              {/* 臨床標準切點 */}
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.825rem',
                color: '#1e3a8a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  <strong>🏆 EWGSOP2 判讀標準：</strong>
                  <span style={{ marginLeft: '0.5rem' }}>
                    &lt; 10 秒（健壯良好） ｜ 10 ~ 15 秒（輕度偏慢） ｜ &gt; 15 秒（衰弱高風險）
                  </span>
                </div>
              </div>

              {/* 操作按鈕 */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={runSimulationDemo}
                  title="無相機時快速預覽 5 次起立坐下流程"
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
                    padding: '0.6rem 1.4rem',
                    fontSize: '0.925rem',
                    fontWeight: 700
                  }}
                >
                  <Video size={18} />
                  <span>開啟鏡頭並準備檢測</span>
                </button>
              </div>
            </div>
          )}

          {/* 階段 2、3、4：相機畫面掛載中（預覽 / 倒數 / 正式測驗） */}
          {isCameraActive && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              
              {/* 即時數據儀表條 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.625rem',
                backgroundColor: '#0f172a',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                color: '#ffffff'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.725rem', color: '#94a3b8', letterSpacing: '0.05em' }}>已完成次數</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#38bdf8', lineHeight: 1.2 }}>
                    {repCount} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ 5</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.725rem', color: '#94a3b8', letterSpacing: '0.05em' }}>計時秒數</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#10b981', lineHeight: 1.2, fontFamily: 'monospace' }}>
                    {elapsedTime} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>秒</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.725rem', color: '#94a3b8', letterSpacing: '0.05em' }}>膝關節角度</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1.2, fontFamily: 'monospace' }}>
                    {currentKneeAngle}°
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.725rem', color: '#94a3b8', letterSpacing: '0.05em' }}>骨架鎖定狀態</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, marginTop: '8px' }}>
                    {hasDetectedBody ? (
                      <span style={{ color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        🟢 骨架追蹤中
                      </span>
                    ) : (
                      <span style={{ color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        🟡 搜尋人體中
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 視訊 + 骨架畫布疊加容器 */}
              <div style={{
                position: 'relative',
                width: '100%',
                maxHeight: '440px',
                borderRadius: '10px',
                overflow: 'hidden',
                backgroundColor: '#020617',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                aspectRatio: '4/3',
                border: '2px solid #1e293b'
              }}>
                {/* 視訊影像標籤 */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)' // 鏡像翻轉長輩看自己更自然
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
                    transform: 'scaleX(-1)', // 與鏡像一致
                    pointerEvents: 'none'
                  }}
                />

                {/* 載入中覆蓋層 */}
                {isModelLoading && (
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
                    <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '0.875rem' }} />
                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>正在初始化 AI 姿態辨識模型...</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>鏡頭畫面即將顯示，請保持坐姿</div>
                  </div>
                )}

                {/* 倒數遮罩 */}
                {stage === 'countdown' && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
                    <div style={{ fontSize: '6.5rem', fontWeight: 900, color: '#ffffff', textShadow: '0 0 25px #0284c7' }}>
                      {countdownNum > 0 ? countdownNum : '開始！'}
                    </div>
                  </div>
                )}

                {/* 即時動作文字浮條 */}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(15, 23, 42, 0.88)',
                  backdropFilter: 'blur(4px)',
                  color: '#ffffff',
                  padding: '0.45rem 1.25rem',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  zIndex: 5,
                  whiteSpace: 'nowrap'
                }}>
                  {postureHint}
                </div>
              </div>

              {/* 控制列 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {stage === 'preview' && '💡 請調整椅子位置，確認鏡頭中出現完整的青色人體骨架線條。'}
                  {stage === 'testing' && '💡 長者連續站直 5 次並坐定，系統將自動停止計時。'}
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
                    <span>返回重選</span>
                  </button>

                  {stage === 'preview' && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={triggerCountdown}
                      disabled={isModelLoading}
                      style={{
                        backgroundColor: '#059669',
                        borderColor: '#059669',
                        fontWeight: 700,
                        padding: '0.4rem 1rem'
                      }}
                    >
                      <Play size={15} />
                      <span>坐姿就緒，開始 5 次測驗！</span>
                    </button>
                  )}

                  {stage === 'testing' && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => completeAssessment()}
                      title="若已手動完成 5 次，可直接點此手動結算"
                      style={{ backgroundColor: '#0284c7' }}
                    >
                      <CheckCircle2 size={15} />
                      <span>手動結算</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 階段 5：測驗完成成績卡片 */}
          {stage === 'completed' && finalResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.3s ease' }}>
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '1.25rem',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.5rem'
                }}>
                  <CheckCircle2 size={30} />
                </div>
                <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 800, color: '#166534' }}>
                  5 次起立坐下測試完成！
                </h4>
                <p style={{ margin: 0, fontSize: '0.825rem', color: '#4b5563' }}>
                  受試長者：{patientName} ｜ 施測日期：{finalResult.testDate}
                </p>

                {/* 數據卡片 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.875rem',
                  marginTop: '1rem'
                }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.875rem' }}>
                    <div style={{ fontSize: '0.775rem', color: '#64748b' }}>實測完成總時間</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 900, color: finalResult.color, fontFamily: 'monospace', lineHeight: 1.2, margin: '4px 0' }}>
                      {finalResult.durationSeconds} <span style={{ fontSize: '0.95rem' }}>秒</span>
                    </div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b' }}>平均每趟起坐約 {(finalResult.durationSeconds / 5).toFixed(1)} 秒</div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.875rem' }}>
                    <div style={{ fontSize: '0.775rem', color: '#64748b' }}>EWGSOP2 肌力評級</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: finalResult.color, marginTop: '6px' }}>
                      {finalResult.statusLabel}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                      {finalResult.frailtyRisk}
                    </div>
                  </div>
                </div>

                {/* 臨床建議 */}
                <div style={{
                  marginTop: '1rem',
                  backgroundColor: '#ffffff',
                  border: `1.5px solid ${finalResult.color}40`,
                  borderRadius: '8px',
                  padding: '0.875rem 1rem',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  color: '#334155',
                  lineHeight: 1.6
                }}>
                  <div style={{ fontWeight: 700, color: finalResult.color, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={16} />
                    臨床照護指引與長者處方建議：
                  </div>
                  <div>{finalResult.recommendation}</div>
                </div>
              </div>

              {/* 按鈕列 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setStage('guide');
                    setRepCount(0);
                    setElapsedTime('0.0');
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
                    padding: '0.6rem 1.4rem',
                    fontWeight: 700
                  }}
                >
                  <Sparkles size={16} />
                  <span>帶入臨床評估筆記與 AI 報告</span>
                </button>
              </div>
            </div>
          )}

          {/* 階段 6：相機啟動異常 */}
          {stage === 'error' && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{
                width: '46px',
                height: '46px',
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
              <h4 style={{ margin: '0 0 0.5rem', color: '#991b1b', fontSize: '1.05rem' }}>無法開啟視訊鏡頭</h4>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#b91c1c', maxWidth: '520px', marginInline: 'auto', lineHeight: 1.5 }}>
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
