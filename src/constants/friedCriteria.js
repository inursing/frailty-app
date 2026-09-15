/**
 * Fried Frailty Phenotype 臨床評估切點與判讀依據
 * Reference: Fried LP, Tangen CM, Walston J, et al. Frailty in Older Adults:
 * Evidence for a Phenotype. J Gerontol A Biol Sci Med Sci. 2001;56(3):M146-M157.
 */

// 握力 Fried 2001 標準切點 (kg) 依性別與 BMI
export const GRIP_STRENGTH_CUTOFFS = {
  male: [
    { maxBmi: 24.0, cutoff: 29.0, label: 'BMI ≤ 24.0' },
    { maxBmi: 26.0, cutoff: 30.0, label: 'BMI 24.1 - 26.0' },
    { maxBmi: 28.0, cutoff: 30.0, label: 'BMI 26.1 - 28.0' },
    { maxBmi: Infinity, cutoff: 32.0, label: 'BMI > 28.0' }
  ],
  female: [
    { maxBmi: 23.0, cutoff: 17.0, label: 'BMI ≤ 23.0' },
    { maxBmi: 26.0, cutoff: 17.3, label: 'BMI 23.1 - 26.0' },
    { maxBmi: 29.0, cutoff: 18.0, label: 'BMI 26.1 - 29.0' },
    { maxBmi: Infinity, cutoff: 21.0, label: 'BMI > 29.0' }
  ]
};

// 4公尺行走時間 Fried 2001 標準切點 (秒) 依性別與身高
export const WALKING_TIME_CUTOFFS = {
  male: {
    shortCutoffHeight: 173,
    shortTime: 5.76, // 秒 (4公尺)
    tallTime: 5.21
  },
  female: {
    shortCutoffHeight: 159,
    shortTime: 6.43, // 秒 (4公尺)
    tallTime: 5.90
  }
};

/**
 * 計算 BMI 並返回數值與台灣衛福部成人體重分類
 */
export function calculateBmi(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return { bmi: 0, label: '資料未齊全', color: 'text-gray-500' };
  }
  const hMeter = heightCm / 100;
  const bmiVal = Number((weightKg / (hMeter * hMeter)).toFixed(1));

  let label = '';
  let badgeColor = 'bg-blue-100 text-blue-800';

  if (bmiVal < 18.5) {
    label = '體重過輕 (Underweight)';
    badgeColor = 'bg-amber-100 text-amber-800';
  } else if (bmiVal < 24.0) {
    label = '正常範圍 (Normal)';
    badgeColor = 'bg-emerald-100 text-emerald-800';
  } else if (bmiVal < 27.0) {
    label = '體重過重 (Overweight)';
    badgeColor = 'bg-amber-100 text-amber-800';
  } else {
    label = '肥胖 (Obese)';
    badgeColor = 'bg-rose-100 text-rose-800';
  }

  return { bmi: bmiVal, label, badgeColor };
}

/**
 * 取得特定性別與 BMI 對應的 Fried 握力切點
 */
export function getGripCutoff(gender, bmi) {
  const table = GRIP_STRENGTH_CUTOFFS[gender] || GRIP_STRENGTH_CUTOFFS.female;
  const match = table.find(item => bmi <= item.maxBmi) || table[table.length - 1];
  return match;
}

/**
 * 取得特定性別與身高對應的 4公尺行走時間切點
 */
export function getWalkTimeCutoff(gender, heightCm) {
  const conf = WALKING_TIME_CUTOFFS[gender] || WALKING_TIME_CUTOFFS.female;
  const isShort = heightCm <= conf.shortCutoffHeight;
  const cutoffTime = isShort ? conf.shortTime : conf.tallTime;
  return {
    cutoffTime,
    isShort,
    ruleLabel: isShort 
      ? `身高 ≤ ${conf.shortCutoffHeight} cm: 需 ≥ ${conf.shortTime} 秒`
      : `身高 > ${conf.shortCutoffHeight} cm: 需 ≥ ${conf.tallTime} 秒`
  };
}

/**
 * 判定各指標與給分
 */
export function evaluateCriteria({ basicInfo, criteriaAnswers }) {
  const { gender, height, weight } = basicInfo;
  const { bmi } = calculateBmi(height, weight);

  const results = {};

  // 1. 非預期性體重減輕
  const wl = criteriaAnswers.weightLoss || {};
  let isWeightLossPositive = false;
  let weightLossDetail = '';

  if (wl.hasLoss) {
    if (wl.mode === 'comparison') {
      const pastW = Number(wl.pastWeight || 0);
      const currW = Number(wl.currentWeight || weight || 0);
      if (pastW > 0 && currW > 0) {
        const diffKg = Number((pastW - currW).toFixed(1));
        const pct = Number(((diffKg / pastW) * 100).toFixed(1));
        if (diffKg >= 4.5 || pct >= 5.0) {
          isWeightLossPositive = true;
          weightLossDetail = `符合衰弱表型：一年前體重 ${pastW} kg、現在體重 ${currW} kg，非自主減輕 ${diffKg} kg (減輕 ${pct}%)，達到 ≥4.5kg 或 ≥5% 之門檻。`;
        } else if (diffKg > 0) {
          weightLossDetail = `未達切點：一年前體重 ${pastW} kg、現在 ${currW} kg，減輕 ${diffKg} kg (${pct}%)，尚未達 4.5kg 或 5% 門檻。`;
        } else {
          weightLossDetail = `體重持平或增加（前一年 ${pastW} kg，現今 ${currW} kg），無減輕。`;
        }
      } else {
        weightLossDetail = '請填寫一年前體重與目前體重以進行比對計算。';
      }
    } else {
      // direct kg
      const lossKg = Number(wl.lossKg || 0);
      const curW = Number(weight || 0);
      const lossPct = curW > 0 ? (lossKg / (curW + lossKg)) * 100 : 0;
      if (lossKg >= 4.5 || lossPct >= 5.0) {
        isWeightLossPositive = true;
        weightLossDetail = `符合衰弱表型：過去一年非自主減輕 ${lossKg} kg (約 ${lossPct.toFixed(1)}%)，符合 ≥4.5kg 或 ≥5% 之標準。`;
      } else if (lossKg > 0) {
        weightLossDetail = `未達切點：非自主減輕 ${lossKg} kg，未達 4.5kg 或 5% 之門檻。`;
      } else {
        weightLossDetail = '請填寫減輕公斤數。';
      }
    }
  } else {
    weightLossDetail = '正常：過去一年無明顯非預期體重減輕（體重大致維持或為刻意減重）。';
  }

  results.weightLoss = {
    score: isWeightLossPositive ? 1 : 0,
    title: '非預期性體重減輕 (Shrinking / Weight Loss)',
    isPositive: isWeightLossPositive,
    detail: weightLossDetail,
    standardSummary: '無刻意減重下，過去一年體重減輕 ≥ 4.5 kg 或 ≥ 5%。'
  };

  // 2. 自覺疲憊感
  const exhaustionDays = criteriaAnswers.exhaustion?.frequency; // 'rarely', 'sometimes', 'often'
  const isExhaustionPositive = exhaustionDays === 'often';

  results.exhaustion = {
    score: isExhaustionPositive ? 1 : 0,
    title: '自覺疲憊感 (Exhaustion)',
    isPositive: isExhaustionPositive,
    detail: isExhaustionPositive
      ? '符合衰弱表型：過去一週內有 ≥3-4 天覺得「做任何事都很費力」或「無法打起精神做事」(CES-D 正向)。'
      : exhaustionDays
      ? '正常：過去一週自覺體力與精力大致穩定，未達連續多日無精打采切點。'
      : '尚未選擇（預設未計分）。',
    standardSummary: '以 CES-D 兩題篩檢：過去一週有 ≥ 3-4 天自覺做事情很費力或提不起勁。'
  };

  // 3. 身體活動量偏低
  const activityLevel = criteriaAnswers.physicalActivity?.level; // 'active', 'moderate', 'low'
  const isActivityPositive = activityLevel === 'low';

  results.physicalActivity = {
    score: isActivityPositive ? 1 : 0,
    title: '身體活動量偏低 (Low Physical Activity)',
    isPositive: isActivityPositive,
    detail: isActivityPositive
      ? '符合衰弱表型：每週休閒活動極少或消耗熱量低於標準 (男性 < 383 kcal/週、女性 < 270 kcal/週)。'
      : activityLevel
      ? '正常：維持規律日常運動或休閒活動（如散步、體操、家務等）。'
      : '尚未選擇（預設未計分）。',
    standardSummary: '依 Minnesota 休閒活動問卷標準：男性每週 < 383 kcal，女性每週 < 270 kcal，或每週極少/無運動。'
  };

  // 4. 行走速度慢（支援實測、無法測量、自評問卷）
  const walkConf = criteriaAnswers.walkingSpeed || {};
  let isWalkSlow = false;
  let walkDetail = '';
  const walkCutoff = getWalkTimeCutoff(gender || 'female', height || 160);

  if (walkConf.method === 'unable') {
    // 因衰弱/臥床/肢體障礙無法測量 -> 依 Fried 原著直接計 1 分
    isWalkSlow = true;
    walkDetail = '符合衰弱表型（無法施測）：依 Fried CHS 原著標準，長者因身體極度虛弱、下肢癱瘓、臥床或需輪椅代步而客觀上無法執行步行測試者，直接判定符合該項衰弱指標 (1分)。';
  } else if (walkConf.method === 'self_report') {
    // SARC-F 自評問卷
    if (walkConf.selfReportStatus === 'difficult') {
      isWalkSlow = true;
      walkDetail = '符合衰弱表型（臨床自評替代）：長者自訴室內行走極為緩慢困難、需助行器/他人扶持或無法在綠燈內穿過馬路。';
    } else if (walkConf.selfReportStatus === 'normal') {
      walkDetail = '正常（臨床自評替代）：自訴平時能獨立平穩行走，無明顯步履蹣跚或嚴重步速遲緩。';
    } else {
      walkDetail = '尚未選擇自評狀態。';
    }
  } else {
    // 實測 4公尺
    const walkTime = Number(walkConf.walkTimeSeconds || 0);
    if (walkTime > 0) {
      if (walkTime >= walkCutoff.cutoffTime) {
        isWalkSlow = true;
        walkDetail = `符合衰弱表型：4公尺行走實測為 ${walkTime} 秒，慢於此性別與身高之門檻 (${walkCutoff.cutoffTime} 秒)。`;
      } else {
        walkDetail = `正常：4公尺行走實測為 ${walkTime} 秒，快於標準門檻 (${walkCutoff.cutoffTime} 秒)。`;
      }
    } else {
      walkDetail = '尚未輸入實測秒數（預設正常）。';
    }
  }

  results.walkingSpeed = {
    score: isWalkSlow ? 1 : 0,
    title: '行走速度慢 (Slowness)',
    isPositive: isWalkSlow,
    detail: walkDetail,
    standardSummary: `4公尺步行標準：${gender === 'male' ? '男性' : '女性'}身高 ${height || '--'}cm 切點為 ≥ ${walkCutoff.cutoffTime} 秒（無法完成測試者依原著計1分）。`
  };

  // 5. 握力低（支援實測、無法測量、提重自評問卷）
  const gripConf = criteriaAnswers.gripStrength || {};
  let isGripLow = false;
  let gripDetail = '';
  const gripCutoffInfo = getGripCutoff(gender || 'female', bmi);

  if (gripConf.method === 'unable') {
    // 因手部關節攣縮/中風偏癱/衰弱無法握力測量 -> 依 Fried 原著直接計 1 分
    isGripLow = true;
    gripDetail = '符合衰弱表型（無法施測）：依 Fried CHS 原著標準，因中風偏癱、嚴重關節攣縮變形或極度衰弱無力而客觀上無法操作握力計者，直接判定符合此項衰弱指標 (1分)。';
  } else if (gripConf.method === 'self_report') {
    // SARC-F 提重物功能評估
    if (gripConf.selfReportStatus === 'difficult') {
      isGripLow = true;
      gripDetail = '符合衰弱表型（臨床自評替代）：長者自訴提拿或搬運 5 公斤重物（如一整袋大米或滿水壺）感到非常困難或完全無法提拿。';
    } else if (gripConf.selfReportStatus === 'normal') {
      gripDetail = '正常（臨床自評替代）：自訴能輕鬆提拿 5 公斤重物或提菜籃，手部抓握機能尚稱良好。';
    } else {
      gripDetail = '尚未選擇自評狀態。';
    }
  } else {
    // 實測握力
    const gripKg = Number(gripConf.gripKg || 0);
    if (gripKg > 0) {
      if (gripKg <= gripCutoffInfo.cutoff) {
        isGripLow = true;
        gripDetail = `符合衰弱表型：實測最大握力 ${gripKg} kg，低於對應切點 (性別 ${gender === 'male' ? '男性' : '女性'}, ${gripCutoffInfo.label}, 切點 ≤ ${gripCutoffInfo.cutoff} kg)。`;
      } else {
        gripDetail = `正常：實測最大握力 ${gripKg} kg，高於標準切點 (${gripCutoffInfo.cutoff} kg)。`;
      }
    } else {
      gripDetail = '尚未輸入握力數值（預設正常）。';
    }
  }

  results.gripStrength = {
    score: isGripLow ? 1 : 0,
    title: '握力偏低 (Weakness / Low Grip Strength)',
    isPositive: isGripLow,
    detail: gripDetail,
    standardSummary: `依性別及 BMI 交叉對照：切點為 ≤ ${gripCutoffInfo.cutoff} kg（無法操作者依原著計1分）。`
  };

  const totalScore = Object.values(results).reduce((sum, item) => sum + item.score, 0);

  let frailtyStatus = '';
  let statusColor = '';
  let statusBadge = '';
  let clinicalMeaning = '';
  let recommendations = [];

  if (totalScore === 0) {
    frailtyStatus = '健壯 (Robust / Non-frail)';
    statusColor = 'emerald';
    statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    clinicalMeaning = '受試者各項生理指標皆維持良好，具備良好的生理儲備量 (Physiologic reserve)。跌倒與急性住院風險在基準常態範圍。';
    recommendations = [
      '維持每週 150 分鐘中等強度有氧運動（如快走、太極拳、游泳）。',
      '維持每週至少 2 次核心與下肢肌力強化訓練。',
      '攝取足量優質蛋白質（建議每日每公斤體重 1.0–1.2 公克）。',
      '定期每年進行一次老年健康篩檢與衰弱度追蹤。'
    ];
  } else if (totalScore <= 2) {
    frailtyStatus = '衰弱前期 (Pre-frail)';
    statusColor = 'amber';
    statusBadge = 'bg-amber-100 text-amber-800 border-amber-300';
    clinicalMeaning = '受試者已出現 1 至 2 項生理機能減退跡象。此階段為「可逆轉黃金介入期」，若積極提供運動與營養指導，高度有望恢復至健壯狀態；若未介入則有較高機率惡化為完全衰弱。';
    recommendations = [
      '針對異常項目精準介入：例如握力低或步速慢者，應進行規律阻力訓練（彈力帶、深蹲扶椅、舉輕啞鈴）。',
      '營養介入：增加優質蛋白質（蛋、豆、魚、肉、乳清蛋白）與維生素 D 補充，預防肌少症 (Sarcopenia)。',
      '檢視居家安全環境，降低絆倒或滑倒因子。',
      '每 3–6 個月重新評估一次衰弱進程。'
    ];
  } else {
    frailtyStatus = '衰弱 (Frail)';
    statusColor = 'rose';
    statusBadge = 'bg-rose-100 text-rose-800 border-rose-300';
    clinicalMeaning = '受試者多項機能指標顯著衰退，生理儲備量脆弱。面對外界壓力源（如小感冒、輕微跌倒、換藥）時極易出現失能、急性住院、機構化或併發症連鎖反應。';
    recommendations = [
      '建議照會老年醫學科醫師、護理師、物理治療師及營養師進行「周全性老年評估 (CGA)」。',
      '全面審視用藥清單（減法醫療，避免潛在不適當多重用藥 Polypharmacy）。',
      '專業物理治療指導之個人化漸進式復能訓練，加強防跌平衡。',
      '評估長照 2.0 資源介入（如居家照顧、日間照顧、居家醫療、無障礙環境改善）。',
      '密切監測體重變化、吞嚥功能與認知狀態。'
    ];
  }

  return {
    results,
    totalScore,
    frailtyStatus,
    statusColor,
    statusBadge,
    clinicalMeaning,
    recommendations,
    evaluatedAt: basicInfo?.assessmentDate
      ? `${basicInfo.assessmentDate} ${new Date().toTimeString().slice(0, 5)}`
      : new Date().toLocaleString('zh-TW')
  };
}

/**
 * 檢查尚未填寫完整的評估項目
 * 返回未填項目的列表與詳細說明，供前端即時提醒
 */
export function checkUnfilledItems(basicInfo, criteriaAnswers) {
  const missing = [];

  // 基本資料驗證
  if (!basicInfo?.assessmentDate) {
    missing.push({ id: 'input-assessment-date', section: 'basic', label: '評估日期', hint: '需選擇或填寫評估日期（可自選今日或過去日期）' });
  }
  if (!basicInfo?.age) {
    missing.push({ id: 'input-age', section: 'basic', label: '年齡', hint: '需填寫長者年齡（年齡影響生理指標與照護處方）' });
  }
  if (!basicInfo?.gender) {
    missing.push({ id: 'select-gender', section: 'basic', label: '生理性別', hint: '需選擇性別以精準匹配 Fried 步速與握力判定切點' });
  }
  if (!basicInfo?.height) {
    missing.push({ id: 'input-height', section: 'basic', label: '身高', hint: '需填寫身高以計算 BMI 及判定 4 公尺步行時間門檻' });
  }
  if (!basicInfo?.weight) {
    missing.push({ id: 'input-weight', section: 'basic', label: '目前體重', hint: '需填寫體重以計算 BMI 與每日蛋白質與熱量精準公克數' });
  }

  // 1. 體重減輕
  const wl = criteriaAnswers?.weightLoss;
  if (wl?.hasLoss) {
    if (wl.mode === 'direct' && (!wl.lossKg || wl.lossKg <= 0)) {
      missing.push({ id: 'criterion-weight-loss', section: 'criteria', criterion: 'weightLoss', label: '指標 1 體重減輕公斤數', hint: '已勾選有體重減輕，請填寫過去一年減輕之公斤數' });
    } else if (wl.mode === 'comparison' && (!wl.pastWeight || wl.pastWeight <= 0)) {
      missing.push({ id: 'criterion-weight-loss', section: 'criteria', criterion: 'weightLoss', label: '指標 1 前一年體重', hint: '已選擇體重對比模式，請填寫一年前體重數值' });
    }
  }

  // 2. 疲憊感
  const exhaustion = criteriaAnswers?.exhaustion?.frequency;
  if (!exhaustion) {
    missing.push({ id: 'criterion-exhaustion', section: 'criteria', criterion: 'exhaustion', label: '指標 2 自覺疲憊感', hint: '尚未選擇過去一週做事情自覺費力或提不起勁之頻率' });
  }

  // 3. 活動量
  const activity = criteriaAnswers?.physicalActivity?.level;
  if (!activity) {
    missing.push({ id: 'criterion-physical-activity', section: 'criteria', criterion: 'physicalActivity', label: '指標 3 身體活動量', hint: '尚未選擇每週運動或休閒家務活動之程度' });
  }

  // 4. 步行速度
  const walk = criteriaAnswers?.walkingSpeed;
  if (walk?.method === 'measured' && (!walk.walkTimeSeconds || walk.walkTimeSeconds <= 0)) {
    missing.push({ id: 'criterion-walking-speed', section: 'criteria', criterion: 'walkingSpeed', label: '指標 4 4公尺行走時間', hint: '已選擇實測模式，請填寫步行秒數（若臥床或無法測量請點選「無法施測」）' });
  } else if (walk?.method === 'self_report' && !walk.selfReportStatus) {
    missing.push({ id: 'criterion-walking-speed', section: 'criteria', criterion: 'walkingSpeed', label: '指標 4 步行能力自評', hint: '已選擇 SARC-F 自評問卷，請勾選長者室內行走困難程度' });
  }

  // 5. 握力
  const grip = criteriaAnswers?.gripStrength;
  if (grip?.method === 'measured' && (!grip.gripKg || grip.gripKg <= 0)) {
    missing.push({ id: 'criterion-grip-strength', section: 'criteria', criterion: 'gripStrength', label: '指標 5 手部握力數值', hint: '已選擇實測模式，請填寫握力計實測公斤數（若手部偏癱或無力請點選「無法施測」）' });
  } else if (grip?.method === 'self_report' && !grip.selfReportStatus) {
    missing.push({ id: 'criterion-grip-strength', section: 'criteria', criterion: 'gripStrength', label: '指標 5 提重物能力自評', hint: '已選擇 SARC-F 自評問卷，請勾選提拿 5 公斤重物困難程度' });
  }

  return missing;
}

