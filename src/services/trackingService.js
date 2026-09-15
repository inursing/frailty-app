import {
  db,
  isFirebaseConfigured
} from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

const LOCAL_ASSESSMENTS_KEY = 'frailty_longitudinal_assessments_store';

// 疲憊頻率數值對照 (供圖表量化)
export const EXHAUSTION_NUMERIC_MAP = {
  rarely: 0,     // < 1 天 (正常)
  sometimes: 1,  // 1-2 天 (輕微)
  often: 2       // ≥ 3 天 (疲憊)
};

export const EXHAUSTION_LABEL_MAP = {
  rarely: '少於 1 天 (精力充沛)',
  sometimes: '1 至 2 天 (微感費力)',
  often: '3 天或以上 (經常疲憊)'
};

// 活動量數值對照 (供圖表量化)
export const ACTIVITY_NUMERIC_MAP = {
  low: 0,       // 久坐 (低)
  moderate: 1,  // 中度 (一般)
  active: 2     // 活躍 (充沛)
};

export const ACTIVITY_LABEL_MAP = {
  low: '活動量偏低 / 久坐',
  moderate: '中度日常活動',
  active: '規律運動 / 活躍'
};

/**
 * 取得本機展示模式下的所有紀錄
 */
function getLocalRecords() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_ASSESSMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('讀取本機評估紀錄失敗：', e);
    return [];
  }
}

/**
 * 儲存本機展示模式紀錄
 */
function saveLocalRecords(records) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_ASSESSMENTS_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('寫入本機評估紀錄失敗：', e);
  }
}

/**
 * 保存單次評估紀錄至 Firestore / 本機資料庫
 * 嚴格去識別化：絕不包含姓名、身分證字號或生日
 */
export async function saveAssessmentRecord({
  subjectId,
  userId,
  basicInfo,
  evaluationResults,
  criteriaAnswers,
  clinicalNotes = '',
  consentGiven = true
}) {
  if (!subjectId) {
    throw new Error('請先輸入或登入研究編號，以保存歷史紀錄！');
  }
  if (!consentGiven) {
    throw new Error('未取得受試者健康資料保存知情同意，無法保存。');
  }

  const cleanSubjectId = subjectId.trim().toUpperCase();
  const now = new Date();
  const dateStr = basicInfo.assessmentDate || now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5);

  // 計算時間戳記：若為填寫過去日期，精確對齊過去時間戳記以保證圖表嚴格按歷史時序排序
  let recordTimestamp = Date.now();
  if (basicInfo.assessmentDate) {
    const parsed = new Date(`${basicInfo.assessmentDate}T${timeStr}:00`).getTime();
    if (!isNaN(parsed)) {
      recordTimestamp = parsed;
    }
  }

  const weightNum = Number(basicInfo.weight || 0);
  const heightNum = Number(basicInfo.height || 0);
  const bmiVal = weightNum > 0 && heightNum > 0
    ? Number((weightNum / Math.pow(heightNum / 100, 2)).toFixed(1))
    : 0;

  const walkConf = criteriaAnswers.walkingSpeed || {};
  const walkTimeNum = Number(walkConf.walkTimeSeconds || 0);
  const walkSpeedMps = walkTimeNum > 0 ? Number((4 / walkTimeNum).toFixed(2)) : null;

  const gripConf = criteriaAnswers.gripStrength || {};
  const gripKgNum = Number(gripConf.gripKg || 0);

  const exhaustFreq = criteriaAnswers.exhaustion?.frequency || 'rarely';
  const actLevel = criteriaAnswers.physicalActivity?.level || 'moderate';

  const recordPayload = {
    subjectId: cleanSubjectId,
    userId: userId || `local-${cleanSubjectId.toLowerCase()}`,
    evaluatedAt: `${dateStr} ${timeStr}`,
    date: dateStr,
    timestamp: recordTimestamp,
    assessmentDate: dateStr,
    totalScore: evaluationResults.totalScore,
    frailtyStatus: evaluationResults.frailtyStatus,
    results: {
      weightLoss: {
        score: evaluationResults.results.weightLoss.score,
        isPositive: evaluationResults.results.weightLoss.isPositive,
        detail: evaluationResults.results.weightLoss.detail
      },
      exhaustion: {
        score: evaluationResults.results.exhaustion.score,
        isPositive: evaluationResults.results.exhaustion.isPositive,
        detail: evaluationResults.results.exhaustion.detail
      },
      physicalActivity: {
        score: evaluationResults.results.physicalActivity.score,
        isPositive: evaluationResults.results.physicalActivity.isPositive,
        detail: evaluationResults.results.physicalActivity.detail
      },
      walkingSpeed: {
        score: evaluationResults.results.walkingSpeed.score,
        isPositive: evaluationResults.results.walkingSpeed.isPositive,
        detail: evaluationResults.results.walkingSpeed.detail
      },
      gripStrength: {
        score: evaluationResults.results.gripStrength.score,
        isPositive: evaluationResults.results.gripStrength.isPositive,
        detail: evaluationResults.results.gripStrength.detail
      }
    },
    rawValues: {
      weight: weightNum,
      height: heightNum,
      bmi: bmiVal,
      age: Number(basicInfo.age || 0),
      gender: basicInfo.gender || '',
      exhaustionFrequency: exhaustFreq,
      exhaustionNumeric: EXHAUSTION_NUMERIC_MAP[exhaustFreq] ?? 0,
      activityLevel: actLevel,
      activityNumeric: ACTIVITY_NUMERIC_MAP[actLevel] ?? 1,
      walkTimeSeconds: walkTimeNum,
      walkSpeedMps: walkSpeedMps,
      walkMethod: walkConf.method || 'measured',
      walkSelfReport: walkConf.selfReportStatus || '',
      gripKg: gripKgNum,
      gripMethod: gripConf.method || 'measured',
      gripSelfReport: gripConf.selfReportStatus || ''
    },
    clinicalNotesSummary: clinicalNotes ? clinicalNotes.slice(0, 150) : '',
    consentGiven: true
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'assessments'), {
        ...recordPayload,
        serverCreatedAt: serverTimestamp()
      });
      return { id: docRef.id, ...recordPayload };
    } catch (err) {
      console.warn('寫入 Firestore 失敗，備援寫入本機：', err);
    }
  }

  // 本機展示模式保存
  const existing = getLocalRecords();
  const newDoc = {
    id: `local-rec-${Date.now()}`,
    ...recordPayload
  };
  existing.push(newDoc);
  saveLocalRecords(existing);
  return newDoc;
}

/**
 * 查詢特定受試者的歷史追蹤評估紀錄
 * 支援時間過濾 (3M, 6M, 1Y, all)，並確保依日期嚴格由舊至新昇冪排序 (供折線圖呈現)
 */
export async function fetchSubjectRecords(subjectId, userId, timeRange = 'all') {
  if (!subjectId) return [];
  const cleanSubjectId = subjectId.trim().toUpperCase();

  let records = [];

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'assessments'),
        where('subjectId', '==', cleanSubjectId)
      );
      const snapshot = await getDocs(q);
      snapshot.forEach(docSnap => {
        records.push({ id: docSnap.id, ...docSnap.data() });
      });
    } catch (err) {
      console.warn('Firestore 查詢失敗，切換自本機讀取：', err);
      const allLocal = getLocalRecords();
      records = allLocal.filter(r => r.subjectId === cleanSubjectId);
    }
  } else {
    const allLocal = getLocalRecords();
    records = allLocal.filter(r => r.subjectId === cleanSubjectId);
  }

  // 依時間戳記嚴格昇冪排序 (舊 -> 新)
  records.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  // 時間範圍篩選
  if (timeRange !== 'all') {
    const now = Date.now();
    let cutoffMs = 0;
    if (timeRange === '3m') {
      cutoffMs = now - (90 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '6m') {
      cutoffMs = now - (180 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '1y') {
      cutoffMs = now - (365 * 24 * 60 * 60 * 1000);
    }
    records = records.filter(r => (r.timestamp || 0) >= cutoffMs);
  }

  return records;
}

/**
 * 管理者查詢全體受試者清單與個案統計
 */
export async function fetchAllCohortCases(searchQuery = '') {
  let allRecords = [];

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'assessments'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      snapshot.forEach(docSnap => {
        allRecords.push({ id: docSnap.id, ...docSnap.data() });
      });
    } catch (err) {
      console.warn('Firestore 管理者查詢失敗，改讀本機：', err);
      allRecords = getLocalRecords();
    }
  } else {
    allRecords = getLocalRecords();
  }

  // 按受試者研究編號分組
  const subjectMap = new Map();

  allRecords.forEach(rec => {
    const sId = (rec.subjectId || 'UNKNOWN').toUpperCase();
    if (!subjectMap.has(sId)) {
      subjectMap.set(sId, []);
    }
    subjectMap.get(sId).push(rec);
  });

  let caseSummaries = [];
  subjectMap.forEach((recList, sId) => {
    // 依時間排序
    recList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const latest = recList[0];
    const earliest = recList[recList.length - 1];

    caseSummaries.push({
      subjectId: sId,
      recordCount: recList.length,
      latestDate: latest.evaluatedAt || latest.date,
      earliestDate: earliest.evaluatedAt || earliest.date,
      latestScore: latest.totalScore,
      latestStatus: latest.frailtyStatus,
      latestBmi: latest.rawValues?.bmi,
      latestWeight: latest.rawValues?.weight,
      records: recList.reverse() // 轉為正序
    });
  });

  // 搜尋過濾
  if (searchQuery && searchQuery.trim() !== '') {
    const queryUpper = searchQuery.trim().toUpperCase();
    caseSummaries = caseSummaries.filter(c => c.subjectId.includes(queryUpper));
  }

  return caseSummaries;
}

/**
 * 縱向趨勢分析與客觀風險提醒計算
 */
export function calculateTrendAnalytics(records) {
  if (!records || records.length === 0) {
    return {
      hasData: false,
      count: 0,
      firstRecord: null,
      latestRecord: null,
      deltas: null,
      alerts: []
    };
  }

  const sorted = [...records].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  const previous = sorted.length >= 2 ? sorted[sorted.length - 2] : null;

  // 計算第一次與最近一次差異 (Baseline vs Latest)
  const scoreDelta = latest.totalScore - first.totalScore;
  const weightDelta = Number(((latest.rawValues?.weight || 0) - (first.rawValues?.weight || 0)).toFixed(1));
  const gripDelta = Number(((latest.rawValues?.gripKg || 0) - (first.rawValues?.gripKg || 0)).toFixed(1));
  const walkTimeDelta = Number(((latest.rawValues?.walkTimeSeconds || 0) - (first.rawValues?.walkTimeSeconds || 0)).toFixed(1));

  // 計算與上一次差異 (Previous vs Latest)
  const lastScoreDelta = previous ? (latest.totalScore - previous.totalScore) : 0;

  const alerts = [];

  // 1. 若 Fried 總分比上次增加 -> 顯示「衰弱風險上升」
  if (previous && latest.totalScore > previous.totalScore) {
    alerts.push({
      type: 'risk_increase',
      severity: 'warning',
      title: '⚠️ 衰弱風險上升提醒',
      message: `本次評估 Fried 總分 (${latest.totalScore} 分) 較前次 (${previous.totalScore} 分) 增加 ${lastScoreDelta} 分，顯示生理儲備量有退化趨勢。`
    });
  } else if (previous && latest.totalScore < previous.totalScore) {
    alerts.push({
      type: 'health_improved',
      severity: 'success',
      title: '🎉 生理機能改善良好',
      message: `本次評估 Fried 總分 (${latest.totalScore} 分) 較前次減少 ${Math.abs(lastScoreDelta)} 分，顯示體能有所進步與復能！`
    });
  }

  // 2. 若連續兩次握力下降或步行表現變差 -> 顯示趨勢提醒
  if (sorted.length >= 3) {
    const len = sorted.length;
    const rCurrent = sorted[len - 1];
    const rPrev = sorted[len - 2];
    const rPrevPrev = sorted[len - 3];

    const gripCurr = rCurrent.rawValues?.gripKg || 0;
    const gripPrev = rPrev.rawValues?.gripKg || 0;
    const gripPrevPrev = rPrevPrev.rawValues?.gripKg || 0;

    const isConsecutiveGripDrop = gripCurr > 0 && gripPrev > 0 && gripPrevPrev > 0 &&
      gripCurr < gripPrev && gripPrev < gripPrevPrev;

    const walkCurr = rCurrent.rawValues?.walkTimeSeconds || 0;
    const walkPrev = rPrev.rawValues?.walkTimeSeconds || 0;
    const walkPrevPrev = rPrevPrev.rawValues?.walkTimeSeconds || 0;

    const isConsecutiveWalkSlow = walkCurr > 0 && walkPrev > 0 && walkPrevPrev > 0 &&
      walkCurr > walkPrev && walkPrev > walkPrevPrev;

    if (isConsecutiveGripDrop) {
      alerts.push({
        type: 'grip_decline_trend',
        severity: 'amber',
        title: '📉 握力連續下降趨勢提醒',
        message: `最近連續兩次評估之握力測量值呈現下滑趨勢 (${gripPrevPrev}kg ➔ ${gripPrev}kg ➔ ${gripCurr}kg)，提示上肢肌肉力量正在流失，建議加強握力器或抓力鍛鍊。`
      });
    }

    if (isConsecutiveWalkSlow) {
      alerts.push({
        type: 'walk_decline_trend',
        severity: 'amber',
        title: '📉 步行耗時連續增加提醒',
        message: `最近連續兩次評估之 4 公尺步行時間持續拉長 (${walkPrevPrev}s ➔ ${walkPrev}s ➔ ${walkCurr}s)，提示下肢肌耐力與動態平衡正在退化，請留意跌倒風險。`
      });
    }
  }

  return {
    hasData: true,
    count: sorted.length,
    firstRecord: first,
    latestRecord: latest,
    previousRecord: previous,
    deltas: {
      scoreDelta,
      weightDelta,
      gripDelta,
      walkTimeDelta,
      lastScoreDelta
    },
    alerts
  };
}

/**
 * 匯出個人歷史紀錄為 UTF-8 CSV 檔案 (附 BOM 確保 Excel 繁體中文不亂碼)
 */
export function exportRecordsToCsv(records, subjectId) {
  if (!records || records.length === 0) {
    throw new Error('目前尚無歷史紀錄可供匯出。');
  }

  const headers = [
    '評估日期時間',
    '受試者研究編號',
    '年齡(歲)',
    '性別',
    '體重(kg)',
    '身高(cm)',
    'BMI',
    'Fried總分(0-5)',
    '衰弱分級',
    '指標1-體重減輕得分',
    '指標2-自覺疲憊得分',
    '指標3-活動量得分',
    '指標4-步速得分',
    '指標5-握力得分',
    '實測步行時間(秒)',
    '實測握力(kg)',
    '疲憊頻率',
    '身體活動等級'
  ];

  const rows = records.map(r => {
    const raw = r.rawValues || {};
    const res = r.results || {};
    return [
      `"${r.evaluatedAt || r.date || ''}"`,
      `"${r.subjectId || subjectId}"`,
      raw.age || '',
      raw.gender === 'male' ? '男' : raw.gender === 'female' ? '女' : '',
      raw.weight || '',
      raw.height || '',
      raw.bmi || '',
      r.totalScore ?? '',
      `"${r.frailtyStatus || ''}"`,
      res.weightLoss?.score ?? '',
      res.exhaustion?.score ?? '',
      res.physicalActivity?.score ?? '',
      res.walkingSpeed?.score ?? '',
      res.gripStrength?.score ?? '',
      raw.walkTimeSeconds || '',
      raw.gripKg || '',
      `"${EXHAUSTION_LABEL_MAP[raw.exhaustionFrequency] || raw.exhaustionFrequency || ''}"`,
      `"${ACTIVITY_LABEL_MAP[raw.activityLevel] || raw.activityLevel || ''}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
  
  if (typeof document === 'undefined') {
    return csvContent;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `衰弱評估歷史紀錄_${subjectId || '受試者'}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return csvContent;
}

/**
 * 快速生成多期縱向追蹤模擬資料 (供展示跨越 1 年的 4 次追蹤趨勢)
 */
export function generateMockTrackingData(subjectId = 'SUBJ-2026-001') {
  const cleanId = subjectId.trim().toUpperCase();
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  // 4 筆跨度 1 年的模擬追蹤：11個月前、7個月前、3個月前、當前
  const mockSeries = [
    {
      daysAgo: 330,
      totalScore: 0,
      frailtyStatus: '健壯 (Robust / Non-frail)',
      weight: 62.5,
      bmi: 23.8,
      walkTimeSeconds: 4.6,
      gripKg: 28.5,
      exhaustionFrequency: 'rarely',
      activityLevel: 'active',
      positiveList: []
    },
    {
      daysAgo: 210,
      totalScore: 1,
      frailtyStatus: '衰弱前期 (Pre-frail)',
      weight: 61.2,
      bmi: 23.3,
      walkTimeSeconds: 5.3,
      gripKg: 25.0,
      exhaustionFrequency: 'sometimes',
      activityLevel: 'moderate',
      positiveList: ['exhaustion']
    },
    {
      daysAgo: 90,
      totalScore: 2,
      frailtyStatus: '衰弱前期 (Pre-frail)',
      weight: 59.8,
      bmi: 22.8,
      walkTimeSeconds: 6.2,
      gripKg: 22.0,
      exhaustionFrequency: 'often',
      activityLevel: 'low',
      positiveList: ['exhaustion', 'walkingSpeed']
    },
    {
      daysAgo: 0,
      totalScore: 3,
      frailtyStatus: '衰弱 (Frail)',
      weight: 57.5,
      bmi: 21.9,
      walkTimeSeconds: 6.8,
      gripKg: 19.5,
      exhaustionFrequency: 'often',
      activityLevel: 'low',
      positiveList: ['weightLoss', 'exhaustion', 'walkingSpeed']
    }
  ];

  const generatedRecords = mockSeries.map((m, idx) => {
    const t = now - (m.daysAgo * DAY_MS);
    const d = new Date(t);
    const dateStr = d.toISOString().slice(0, 10);
    const timeStr = '10:30';

    return {
      id: `mock-rec-${cleanId.toLowerCase()}-${idx + 1}`,
      subjectId: cleanId,
      userId: `demo-uid-${cleanId.toLowerCase()}`,
      evaluatedAt: `${dateStr} ${timeStr}`,
      date: dateStr,
      timestamp: t,
      totalScore: m.totalScore,
      frailtyStatus: m.frailtyStatus,
      results: {
        weightLoss: {
          score: m.positiveList.includes('weightLoss') ? 1 : 0,
          isPositive: m.positiveList.includes('weightLoss'),
          detail: m.positiveList.includes('weightLoss') ? '一年非自願體重減輕達 5.0kg (符合)' : '體重無顯著非自主減輕'
        },
        exhaustion: {
          score: m.positiveList.includes('exhaustion') ? 1 : 0,
          isPositive: m.positiveList.includes('exhaustion'),
          detail: m.positiveList.includes('exhaustion') ? '過去一週做任何事經常感到費力 (≥3天)' : '精神狀況尚佳'
        },
        physicalActivity: {
          score: m.positiveList.includes('physicalActivity') ? 1 : 0,
          isPositive: m.positiveList.includes('physicalActivity'),
          detail: m.positiveList.includes('physicalActivity') ? '活動量偏低 / 多坐臥' : '維持中等程度日常活動'
        },
        walkingSpeed: {
          score: m.positiveList.includes('walkingSpeed') ? 1 : 0,
          isPositive: m.positiveList.includes('walkingSpeed'),
          detail: `4公尺步行實測 ${m.walkTimeSeconds} 秒 (步速 ${(4 / m.walkTimeSeconds).toFixed(2)} m/s)`
        },
        gripStrength: {
          score: m.positiveList.includes('gripStrength') ? 1 : 0,
          isPositive: m.positiveList.includes('gripStrength'),
          detail: `實測最大握力 ${m.gripKg} kg`
        }
      },
      rawValues: {
        weight: m.weight,
        height: 162,
        bmi: m.bmi,
        age: 74,
        gender: 'female',
        exhaustionFrequency: m.exhaustionFrequency,
        exhaustionNumeric: EXHAUSTION_NUMERIC_MAP[m.exhaustionFrequency],
        activityLevel: m.activityLevel,
        activityNumeric: ACTIVITY_NUMERIC_MAP[m.activityLevel],
        walkTimeSeconds: m.walkTimeSeconds,
        walkSpeedMps: Number((4 / m.walkTimeSeconds).toFixed(2)),
        walkMethod: 'measured',
        gripKg: m.gripKg,
        gripMethod: 'measured'
      },
      consentGiven: true
    };
  });

  // 寫入本機存儲
  const existing = getLocalRecords().filter(r => r.subjectId !== cleanId);
  saveLocalRecords([...existing, ...generatedRecords]);

  return generatedRecords;
}
