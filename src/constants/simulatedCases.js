/**
 * 護理臨床教學模擬案例庫
 * 提供學生快速載入不同生理狀態與風險等級之長者數據
 */

export const SIMULATED_CASES = [
  {
    id: 'case-1-robust',
    name: '案例一：健壯活力長者（陳爺爺，71歲）',
    tag: '健壯 (0分)',
    tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: '退休中學教師，平日熱愛社區園藝與太極拳，作息規律，胃口與精神良好。',
    targetScore: 0,
    basicInfo: {
      age: 71,
      gender: 'male',
      height: 172,
      weight: 66
    },
    criteriaAnswers: {
      weightLoss: {
        hasLoss: false,
        lossKg: 0
      },
      exhaustion: {
        frequency: 'rarely' // 少於1天
      },
      physicalActivity: {
        level: 'active' // 規律運動
      },
      walkingSpeed: {
        walkTimeSeconds: 3.8 // 4公尺 3.8秒 (標準門檻 5.76秒)
      },
      gripStrength: {
        gripKg: 36.5 // 握力 36.5kg (BMI 22.3 切點 29kg)
      }
    },
    learningNotes: '【學習重點】此案例五項皆在正常範圍內，評分為 0 分（健壯 Robust）。生理儲備良好，護理指導以維持現狀、定期篩檢與預防退化為主。'
  },
  {
    id: 'case-2-prefrail',
    name: '案例二：衰弱前期長者（林奶奶，77歲）',
    tag: '衰弱前期 (2分)',
    tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description: '獨居長者，近半年少與鄰居往來，常自覺全身提不起勁、整天坐在客廳看電視，活動量驟降。',
    targetScore: 2,
    basicInfo: {
      age: 77,
      gender: 'female',
      height: 155,
      weight: 53
    },
    criteriaAnswers: {
      weightLoss: {
        hasLoss: false,
        lossKg: 1.0
      },
      exhaustion: {
        frequency: 'often' // 過去一週有4天覺得很費力 (符合疲憊)
      },
      physicalActivity: {
        level: 'low' // 身體活動量極低 (符合活動量低)
      },
      walkingSpeed: {
        walkTimeSeconds: 5.2 // 4公尺 5.2秒 (女≤159cm門檻為 6.43秒，此項正常)
      },
      gripStrength: {
        gripKg: 19.5 // 握力 19.5kg (BMI 22.1，切點 17kg，正常)
      }
    },
    learningNotes: '【學習重點】符合 2 項（疲憊、活動量低），屬於「衰弱前期 (Pre-frail)」。此階段為關鍵的「可逆轉黃金期」，若此時及早給予心理支持、社交參與及規律漸進式活動，能有效防止惡化為衰弱。'
  },
  {
    id: 'case-3-frail-typical',
    name: '案例三：典型衰弱長者（王爺爺，83歲）',
    tag: '衰弱 (4分)',
    tagColor: 'bg-rose-100 text-rose-800 border-rose-300',
    description: '近一年食慾不振、假牙鬆動造成進食減少，體重急遽下降5.5公斤；起身需攙扶，行走步伐沉重緩慢。',
    targetScore: 4,
    basicInfo: {
      age: 83,
      gender: 'male',
      height: 168,
      weight: 54
    },
    criteriaAnswers: {
      weightLoss: {
        hasLoss: true,
        lossKg: 5.5 // 非預期減重 5.5kg (符合)
      },
      exhaustion: {
        frequency: 'often' // 自覺做什麼事都無精打采 (符合)
      },
      physicalActivity: {
        level: 'low' // 多數時間臥床或坐椅 (符合)
      },
      walkingSpeed: {
        walkTimeSeconds: 7.2 // 4公尺耗時 7.2秒 (男≤173cm門檻 5.76秒，符合慢)
      },
      gripStrength: {
        gripKg: 21.0 // 握力 21.0kg (男BMI 19.1 切點 29kg，符合握力低)
      }
    },
    learningNotes: '【學習重點】此案例符合 5 項中的 4 項，已達「衰弱 (Frail)」標準。極易發生跌倒、壓瘡或急性呼吸道感染。護理重點需連結周全性老年評估 (CGA)、營養強化（蛋白質與熱量）、牙科會診及居家安全改造。'
  },
  {
    id: 'case-4-sarcopenic-obesity',
    name: '案例四：肌少性肥胖型衰弱長者（張女士，75歲）',
    tag: '衰弱 (3分)',
    tagColor: 'bg-rose-100 text-rose-800 border-rose-300',
    description: 'BMI達31.2（肥胖），外表看起來不顯消瘦，但肌肉質量大幅減少並被脂肪取代，雙腿無力、起立困難。',
    targetScore: 3,
    basicInfo: {
      age: 75,
      gender: 'female',
      height: 152,
      weight: 72 // BMI = 31.2 (肥胖)
    },
    criteriaAnswers: {
      weightLoss: {
        hasLoss: false,
        lossKg: 0
      },
      exhaustion: {
        frequency: 'rarely'
      },
      physicalActivity: {
        level: 'low' // 因膝關節退化與沉重少動 (符合活動量低)
      },
      walkingSpeed: {
        walkTimeSeconds: 7.5 // 4公尺 7.5秒 (女≤159cm門檻 6.43秒，符合慢)
      },
      gripStrength: {
        gripKg: 18.5 // 握力 18.5kg (女BMI>29.0，切點為 ≤ 21.0kg，符合握力低！)
      }
    },
    learningNotes: '【學習重點】這是一個非常經典的教學案例！學生常誤以為「胖就不會衰弱」，但張女士因肌肉少而脂肪多（Sarcopenic Obesity），Fried 握力在肥胖組別切點高達 21kg，因此握力 18.5kg 明顯過低。共得 3 分，同樣屬於「衰弱」。'
  }
];
