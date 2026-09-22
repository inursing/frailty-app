/**
 * poseDetectionService.js
 * 
 * 整合 Google MediaPipe Pose 姿態追蹤與 5 次椅子坐起測試 (5XSTS) 運動學邏輯。
 * 100% 於前端瀏覽器端運行，保護長輩個資隱私，無需雲端伺服器運算負載。
 */

// 動態載入 MediaPipe 函式庫腳本
export async function loadMediaPipePoseScript() {
  if (window.Pose) {
    return window.Pose;
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById('mediapipe-pose-script');
    if (existingScript) {
      if (window.Pose) {
        resolve(window.Pose);
      } else {
        existingScript.addEventListener('load', () => resolve(window.Pose));
        existingScript.addEventListener('error', (e) => reject(e));
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'mediapipe-pose-script';
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (window.Pose) {
        resolve(window.Pose);
      } else {
        reject(new Error('MediaPipe Pose failed to initialize on window object.'));
      }
    };
    script.onerror = (err) => {
      reject(new Error('Failed to load MediaPipe Pose script from CDN.'));
    };
    document.head.appendChild(script);
  });
}

/**
 * 計算三點形成的夾角 (度數)
 * @param {Object} a - 點 A {x, y}
 * @param {Object} b - 頂點 B {x, y} (例如膝蓋)
 * @param {Object} c - 點 C {x, y}
 * @returns {number} 夾角 (0 ~ 180 度)
 */
export function calculateJointAngle(a, b, c) {
  if (!a || !b || !c) return 180;
  
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle);
}

/**
 * 簡易 Web Audio 嗶聲合成音
 */
export function playBeep(frequency = 600, durationMs = 120, type = 'sine') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
}

/**
 * 完成時的祝賀音效
 */
export function playCompletionFanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => {
      playBeep(freq, 250, 'triangle');
    }, i * 150);
  });
}

/**
 * 語音語意播報
 */
export function speakPrompt(text) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel(); // 取消前面的未播完語音
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis failed:', e);
  }
}

/**
 * 繪製姿態骨架連線與節點於 Canvas 上
 */
export function drawPoseSkeleton(ctx, landmarks, width, height, currentKneeAngle) {
  if (!ctx || !landmarks || landmarks.length === 0) return;

  ctx.clearRect(0, 0, width, height);

  // 關節連線定義
  const CONNECTIONS = [
    // 軀幹
    [11, 12], [11, 23], [12, 24], [23, 24],
    // 左腿
    [23, 25], [25, 27], [27, 31],
    // 右腿
    [24, 26], [26, 28], [28, 32],
    // 手臂 (供姿勢參考)
    [11, 13], [13, 15], [12, 14], [14, 16]
  ];

  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#10b981'; // 綠色霓虹

  // 繪製骨架線
  CONNECTIONS.forEach(([startIdx, endIdx]) => {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];
    if (start && end && (start.visibility || 1) > 0.4 && (end.visibility || 1) > 0.4) {
      ctx.beginPath();
      ctx.moveTo(start.x * width, start.y * height);
      ctx.lineTo(end.x * width, end.y * height);
      
      // 若是腿部關鍵關節，顏色加強
      if ([23, 24, 25, 26, 27, 28].includes(startIdx) && [23, 24, 25, 26, 27, 28].includes(endIdx)) {
        ctx.strokeStyle = '#06b6d4'; // 青色
        ctx.lineWidth = 6;
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 3;
      }
      ctx.stroke();
    }
  });

  // 繪製關節關鍵點
  const KEY_JOINTS = [11, 12, 23, 24, 25, 26, 27, 28];
  KEY_JOINTS.forEach((idx) => {
    const pt = landmarks[idx];
    if (pt && (pt.visibility || 1) > 0.4) {
      const cx = pt.x * width;
      const cy = pt.y * height;
      
      ctx.beginPath();
      ctx.arc(cx, cy, [25, 26].includes(idx) ? 8 : 5, 0, 2 * Math.PI);
      ctx.fillStyle = [25, 26].includes(idx) ? '#f59e0b' : '#38bdf8'; // 膝蓋標示橘黃色
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  // 在膝蓋旁繪製角度即時數值標籤
  const kneePt = landmarks[25] || landmarks[26];
  if (kneePt && currentKneeAngle) {
    const kx = kneePt.x * width + 15;
    const ky = kneePt.y * height;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(kx - 5, ky - 18, 70, 26);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`${currentKneeAngle}°`, kx, ky);
  }

  ctx.restore();
}

/**
 * 5 次起立坐下測試 (5XSTS) 臨床標準評估解讀
 * 參考 EWGSOP2 與 SPPB 指引
 */
export function interpretSitToStand(durationSeconds) {
  const sec = Number(durationSeconds);
  if (sec <= 0 || isNaN(sec)) {
    return {
      status: 'unknown',
      statusLabel: '資料未齊全',
      color: '#64748b',
      badgeClass: 'badge-secondary',
      frailtyRisk: '無法評估',
      recommendation: '請重新檢測以取得客觀下肢機能數據。'
    };
  }

  if (sec < 10.0) {
    return {
      status: 'robust',
      statusLabel: '健壯優良',
      color: '#059669',
      badgeClass: 'badge-success',
      frailtyRisk: '肌力健壯 (低風險)',
      recommendation: '下肢肌力與爆發力優良，具備良好的防跌穩定度。建議維持日常散步與規律阻力活動。'
    };
  } else if (sec <= 15.0) {
    return {
      status: 'prefrail',
      statusLabel: '輕度偏慢 (衰弱前期警示)',
      color: '#d97706',
      badgeClass: 'badge-warning',
      frailtyRisk: '肌少症與衰弱前期風險 (中度)',
      recommendation: '起立耗時略長，顯示大腿股四頭肌與核心肌群肌耐力輕度減退。建議每日進行漸進式坐站練習、扶椅半蹲與太極拳訓練。'
    };
  } else {
    return {
      status: 'frail',
      statusLabel: '顯著衰退 (衰弱高風險)',
      color: '#dc2626',
      badgeClass: 'badge-danger',
      frailtyRisk: '顯著肌力衰退 (高跌倒風險)',
      recommendation: '下肢肌力與平衡耐力顯著不足，起坐困難為典型衰弱與肌少症指標。強烈建議轉介物理治療師評估，並於日常走動時落實防跌輔助與照護陪同。'
    };
  }
}
