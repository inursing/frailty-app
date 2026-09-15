/**
 * PDF 專業一頁式報告匯出與下載服務
 * 嚴格符合標準 A4 規格 (210mm x 296mm)，區分「長者與家屬圖文版」及「醫護臨床專業版」，絕不變形或溢出
 */

/**
 * 產生「長者與家屬圖文版」A4 一頁式 HTML
 * 特點：大字體、親切高對比度、蛋白質食材圖解、居家保命運動圖示與防跌指南
 */
/**
 * 產生「長者與家屬圖文指南版」A4 一頁式 HTML
 * 特點：大字體易讀、親切高對比度、蛋白質四大天王食材圖解卡、居家保命運動處方與起床防跌三部曲
 */
export function buildSeniorPdfHtml({ basicInfo, evaluationResults, criteriaAnswers = {}, aiReport, clinicalNotes }) {
  const { age, gender, height, weight, assessmentDate } = basicInfo || {};
  const { totalScore = 0, frailtyStatus = '', results = {}, evaluatedAt = '' } = evaluationResults || {};
  const bmi = weight && height ? (weight / Math.pow(height / 100, 2)).toFixed(1) : '--';

  const displayDate = assessmentDate || 
    (evaluatedAt ? (evaluatedAt.includes('/') || evaluatedAt.includes('-') ? evaluatedAt.split(' ')[0].replace(/\//g, '-') : evaluatedAt) : new Date().toISOString().slice(0, 10));

  const proteinLow = Math.round((weight || 60) * (totalScore >= 1 ? 1.2 : 1.0));
  const proteinHigh = Math.round((weight || 60) * (totalScore >= 3 ? 1.5 : (totalScore >= 1 ? 1.3 : 1.2)));
  const calories = Math.round((weight || 60) * 30);

  // 長者精神問候與狀態主題
  const statusTheme = totalScore === 0
    ? {
        title: '活力健壯長者！精神奕奕！',
        sub: '您的身體儲備量非常充足，請繼續保持均衡三餐營養與規律活動，快樂享受健康銀髮生活！',
        color: '#059669',
        bg: '#ecfdf5',
        border: '#10b981',
        tagBg: '#dcfce7',
        tagText: '#15803d',
        icon: '😊'
      }
    : totalScore <= 2
    ? {
        title: '體能稍有減退，現在是「逆轉肌力」的黃金期！',
        sub: '已有輕微疲憊或步速減緩跡象，請別擔心！只要吃足蛋白質並配合客製居家運動，極大機會恢復活力！',
        color: '#d97706',
        bg: '#fffbeb',
        border: '#f59e0b',
        tagBg: '#fef3c7',
        tagText: '#92400e',
        icon: '💪'
      }
    : {
        title: '身體較為虛弱，需要生活守護與細心扶持',
        sub: '肌肉與體能耗損較多，日常請放慢腳步、注意防跌。以下運動與安全措施已為您量身調整！',
        color: '#e11d48',
        bg: '#fff1f2',
        border: '#f43f5e',
        tagBg: '#ffe4e6',
        tagText: '#9f1239',
        icon: '🛡️'
      };

  // 個人化運動處方（4 項圖解卡片）
  const walkMethod = criteriaAnswers?.walkingSpeed?.method;
  const isUnableWalk = walkMethod === 'unable' || results?.walkingSpeed?.detail?.includes('無法施測') || results?.walkingSpeed?.detail?.includes('臥床');
  const isWalkSlow = results?.walkingSpeed?.isPositive;
  const hasKneeOA = (clinicalNotes || '').includes('關節炎');
  const isGripLow = results?.gripStrength?.isPositive;

  let exercises = [];
  if (isUnableWalk) {
    exercises = [
      {
        num: 1,
        title: '床上足踝幫浦運動 (躺姿)',
        desc: '躺在床上雙腳腳掌輪流向下踩、向上勾起維持 3 秒，每次 15 下。',
        benefit: '促進下肢血液循環，防深層靜脈血栓與垂足！',
        tag: '臥床專屬'
      },
      {
        num: 2,
        title: '床頭坐起雙臂擴胸 (躺/半坐)',
        desc: '搖高床頭或家屬攙扶坐起，雙手緩慢向兩側張開深吸氣，重複 8 次。',
        benefit: '鍛鍊呼吸肌與胸背肌力，預防肺部積痰！',
        tag: '安全溫和'
      },
      {
        num: 3,
        title: '輪椅坐姿臀部減壓 (坐姿)',
        desc: '坐在輪椅上每 30 分鐘，雙手扶穩將屁股輪流向側傾減壓。',
        benefit: '避免坐骨受壓，是預防壓瘡與褥瘡最關鍵動作！',
        tag: '壓瘡防範'
      },
      {
        num: 4,
        title: '床上輕捏毛巾與指關節放鬆',
        desc: '拿乾毛巾在胸前輕捏握與捲折，或由家屬溫柔扳開手指伸展 5 分鐘。',
        benefit: '維持指部末梢神經感知與手部關節靈活！',
        tag: '末梢循環'
      }
    ];
  } else if (isWalkSlow || walkMethod === 'self_report') {
    exercises = [
      {
        num: 1,
        title: hasKneeOA ? '坐姿直膝抬腿 (膝關節炎專屬)' : '安全扶椅起立 (有人在側看護)',
        desc: hasKneeOA
          ? '端坐椅子上，將單側小腿打直抬平維持 5 秒，左右腳輪流各 10 次。'
          : '雙手扶穩高背餐椅，慢慢站起站直停 2 秒，再緩慢坐下，每日做 8～10 次。',
        benefit: hasKneeOA ? '不傷膝蓋軟骨！強化大腿股四頭肌，走路有力！' : '強化由坐到站的大腿與臀部肌力，防跌第一名！',
        tag: hasKneeOA ? '保護膝蓋' : '核心防跌'
      },
      {
        num: 2,
        title: '坐姿原地踏步 (坐姿防摔)',
        desc: '端坐在無輪餐椅上，雙腳輪流踏步踩地，每天做 30～50 下。',
        benefit: '坐著就能安全活動髖關節與大腿，增強神經肌肉協調！',
        tag: '安全有氧'
      },
      {
        num: 3,
        title: '扶牆微墊腳尖 (小腿肌力鍛鍊)',
        desc: '雙手穩扶牆面，腳後跟輕輕墊起 2 秒再放下，重複做 10 次。',
        benefit: '鍛鍊小腿腓腸肌，過馬路與跨門檻步伐更輕盈！',
        tag: '步伐穩定'
      },
      {
        num: 4,
        title: isGripLow ? '捏握軟式彈力球 (手部抓握強化)' : '扶桌沿骨盆前後擺動 (平衡訓練)',
        desc: isGripLow
          ? '手握彈力球或軟網球用力捏緊 3 秒再放鬆，左右手各做 10 次。'
          : '雙手扶穩桌緣，身體重心輕輕向前移、再向後移，感受腳底板均勻受力。',
        benefit: isGripLow ? '提升手部握力，拿筷子、端碗、握拐杖更穩固！' : '喚醒足底本體感覺神經，預防身體後仰傾倒！',
        tag: isGripLow ? '握力加強' : '動態平衡'
      }
    ];
  } else {
    exercises = [
      {
        num: 1,
        title: '戶外自然快步健走 (中強度有氧)',
        desc: '每週累積至少 150 分鐘，步速維持微喘但仍能順暢說話之程度。',
        benefit: '維持良好心肺功能與下肢肌耐力！',
        tag: '體能維持'
      },
      {
        num: 2,
        title: '徒手深蹲或椅上升降 (全身肌力)',
        desc: '雙腳與肩同寬，背部打直下蹲至大腿微屈，每日做 2 組各 10～12 次。',
        benefit: '強化全身骨骼肌質量，預防肌肉流失！',
        tag: '肌力強化'
      },
      {
        num: 3,
        title: '單腳站立平衡練習 (前庭小腦平衡)',
        desc: '雙手微扶椅背，單腳離地維持 10 秒，換腳進行，每日 3 次。',
        benefit: '強化深層小肌群平衡反射，遠離日常絆倒！',
        tag: '平衡敏捷'
      },
      {
        num: 4,
        title: '寶特瓶手部微負重肌力訓練',
        desc: '手握 500ml 裝水寶特瓶，進行手部二頭肌彎舉與推舉，每組 12 次。',
        benefit: '維持手臂上肢肌耐力，提菜買菜輕鬆自如！',
        tag: '日常肌力'
      }
    ];
  }

  // 個人化防跌備註
  const notes = clinicalNotes || '';
  let specialFallNote = '';
  if (notes.includes('跌倒')) {
    specialFallNote = '⚠️ 長者近半年有跌倒史，起立走動務必有專人在旁守護，離床加裝感應呼叫鈴！';
  } else if (notes.includes('高血壓') || notes.includes('多重用藥')) {
    specialFallNote = '⚠️ 長者有用藥或血壓問題，務必落實「平躺30秒、坐床緣30秒、站立30秒」防姿位性低血壓！';
  } else if (notes.includes('關節炎')) {
    specialFallNote = '⚠️ 長者膝關節退化，上下樓梯請遵循「好腳先上、痛腳先下」，避免提重物爬樓梯！';
  } else {
    specialFallNote = '💡 浴室保持乾燥並鋪防滑墊，走道夜間留設自動感應小夜燈，杜絕暗處摸黑絆倒！';
  }

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>AI 衰弱評估與居家照護指南（長者與家屬圖文版）</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0; padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Apple Color Emoji", "Segoe UI Emoji", Roboto, "Noto Sans TC", "PingFang TC", sans-serif;
      color: #0f172a; background: white;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
      font-size: 12px; line-height: 1.45;
    }
    .page-container {
      width: 210mm; height: 296mm; max-height: 296mm;
      padding: 7mm 9mm; margin: 0 auto;
      display: flex; flex-direction: column; justify-content: space-between;
      overflow: hidden; background: white;
    }
    .report-header {
      border-bottom: 2.5px solid #059669;
      padding-bottom: 4px; margin-bottom: 5px;
      display: flex; align-items: flex-end; justify-content: space-between;
    }
    .header-badge {
      display: inline-block; background: #dcfce7; color: #15803d;
      font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; margin-bottom: 3px;
    }
    .main-title { font-size: 20px; font-weight: 900; color: #065f46; margin: 0 0 2px 0; }
    .sub-title { font-size: 11px; color: #475569; }
    .meta-info { text-align: right; font-size: 10.5px; color: #64748b; line-height: 1.4; }
    .meta-date { font-size: 12px; font-weight: 800; color: #065f46; }
    
    .patient-bar {
      background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 6px;
      padding: 5px 10px; margin-bottom: 6px;
      display: grid; grid-template-columns: 1.2fr 1.2fr 1fr 1.4fr; gap: 6px; font-size: 11.5px;
    }
    .patient-bar strong { color: #065f46; }

    .greeting-card {
      background: ${statusTheme.bg}; border: 2px solid ${statusTheme.border}; border-radius: 8px;
      padding: 8px 12px; margin-bottom: 6px;
      display: flex; align-items: center; gap: 12px;
    }
    .greeting-icon {
      width: 46px; height: 46px; border-radius: 50%; background: white;
      border: 2.5px solid ${statusTheme.border}; display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
      font-size: 24px;
    }
    .greeting-content { flex: 1; }
    .greeting-badge {
      display: inline-block; background: ${statusTheme.tagBg}; color: ${statusTheme.tagText};
      font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 4px; margin-bottom: 2px;
    }
    .greeting-title { font-size: 15.5px; font-weight: 900; color: ${statusTheme.color}; margin: 1px 0; }
    .greeting-sub { font-size: 11.5px; color: #334155; line-height: 1.35; margin: 0; }

    /* 營養大補帖區塊 */
    .section-box {
      border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 7px 9px;
      margin-bottom: 6px; background: white;
    }
    .section-box.nutri { border-color: #86efac; background: #f0fdf4; }
    .section-box.exercise { border-color: #93c5fd; background: #eff6ff; }
    .section-box.fall { border-color: #fde68a; background: #fffbeb; }

    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 5px; padding-bottom: 3px; border-bottom: 1px solid rgba(0,0,0,0.07);
    }
    .section-title { font-size: 14px; font-weight: 900; margin: 0; }
    .section-title.nutri { color: #166534; }
    .section-title.exercise { color: #1e40af; }
    .section-title.fall { color: #92400e; }

    /* 蛋白質與熱量大指標 */
    .nutri-targets { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 5px; }
    .target-pill {
      background: white; border-radius: 6px; padding: 4px 8px; text-align: center;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .target-pill.green { border: 1.5px solid #86efac; }
    .target-pill.blue { border: 1.5px solid #93c5fd; }
    .target-label { font-size: 10.5px; font-weight: 700; color: #475569; }
    .target-val { font-size: 18px; font-weight: 900; margin: 1px 0; }
    .target-val.green { color: #15803d; }
    .target-val.blue { color: #1d4ed8; }
    .target-hint { font-size: 10px; color: #64748b; }

    /* 四大食材圖鑑卡 (2x2) */
    .food-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 4px; }
    .food-card {
      background: white; border: 1.5px solid #bbf7d0; border-radius: 6px;
      padding: 5px 8px; display: flex; align-items: center; gap: 8px;
    }
    .food-emoji { font-size: 24px; flex-shrink: 0; line-height: 1; }
    .food-info { flex: 1; }
    .food-name { font-size: 12.5px; font-weight: 900; color: #1e293b; display: flex; align-items: center; justify-content: space-between; }
    .food-prot { background: #dcfce7; color: #15803d; font-size: 10px; font-weight: 800; padding: 1px 5px; border-radius: 4px; }
    .food-desc { font-size: 10.5px; color: #475569; line-height: 1.3; margin-top: 1px; }

    .sun-tip {
      background: #fef3c7; border-left: 3.5px solid #f59e0b; border-radius: 4px;
      padding: 3px 8px; font-size: 10.5px; color: #92400e; line-height: 1.35;
    }

    /* 運動處方卡 (2x2) */
    .exercise-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 4px; }
    .exercise-card {
      background: white; border: 1.5px solid #bfdbfe; border-radius: 6px;
      padding: 5px 8px; display: flex; flex-direction: column; justify-content: space-between;
    }
    .exercise-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
    .exercise-num {
      width: 17px; height: 17px; border-radius: 50%; background: #1d4ed8; color: white;
      font-size: 10.5px; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; margin-right: 4px;
    }
    .exercise-title { font-size: 12px; font-weight: 900; color: #1e293b; }
    .exercise-tag { font-size: 9.5px; background: #dbeafe; color: #1e40af; padding: 1px 4px; border-radius: 3px; font-weight: 700; }
    .exercise-desc { font-size: 11px; color: #334155; line-height: 1.35; margin: 2px 0; }
    .exercise-benefit {
      background: #eff6ff; border-top: 1px dashed #bfdbfe; padding-top: 2px;
      font-size: 10px; font-weight: 700; color: #1d4ed8;
    }

    .exercise-alert {
      font-size: 10.5px; color: #be123c; font-weight: 700; line-height: 1.3;
      display: flex; align-items: center; gap: 4px;
    }

    /* 起床起身防跌三部曲橫幅 */
    .fall-steps {
      display: grid; grid-template-columns: 1fr auto 1fr auto 1.15fr; gap: 4px; align-items: center;
      margin: 4px 0;
    }
    .step-pill {
      background: white; border: 1.5px solid #fde68a; border-radius: 6px;
      padding: 4px 6px; text-align: center;
    }
    .step-arrow { color: #d97706; font-size: 14px; font-weight: 900; }
    .step-pill strong { display: block; font-size: 11px; color: #92400e; }
    .step-pill span { font-size: 9.5px; color: #78350f; }

    .fall-note {
      background: #fffbeb; border-top: 1px dotted #fde68a; padding-top: 3px;
      font-size: 10.5px; color: #92400e; font-weight: 700; line-height: 1.3;
    }

    .report-footer {
      border-top: 1.5px solid #cbd5e1; padding-top: 4px; font-size: 10px; color: #475569;
      display: flex; align-items: center; justify-content: space-between;
    }
    .hotline-highlight { font-size: 11.5px; font-weight: 900; color: #065f46; }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- 頂部標頭 -->
    <div class="report-header">
      <div>
        <div class="header-badge">🌸 長者與家屬圖文指南版</div>
        <h1 class="main-title">AI 衰弱評估與居家復能指南</h1>
        <div class="sub-title">大字體易讀指引 • 每日蛋白質精算 • 居家保命運動圖解 • 防跌起床三部曲</div>
      </div>
      <div class="meta-info">
        <div>評估日期：<span class="meta-date">${displayDate}</span></div>
        <div>工具：AI 衰弱照護教學輔助系統</div>
      </div>
    </div>

    <!-- 長者基本資料條 -->
    <div class="patient-bar">
      <div><strong>受試長者：</strong>${age ? `${age} 歲` : '未填'} ${gender === 'male' ? '男性' : gender === 'female' ? '女性' : ''}</div>
      <div><strong>身高/體重：</strong>${height || '--'} cm / ${weight || '--'} kg</div>
      <div><strong>BMI 體態：</strong>${bmi} kg/m²</div>
      <div><strong>病史備註：</strong>${clinicalNotes ? clinicalNotes.slice(0, 16) : '無特別補充'}</div>
    </div>

    <!-- 大字體精神問候與狀態卡 -->
    <div class="greeting-card">
      <div class="greeting-icon">${statusTheme.icon}</div>
      <div class="greeting-content">
        <div class="greeting-badge">評估結果：${frailtyStatus}（Fried 總分 ${totalScore} 分）</div>
        <div class="greeting-title">${statusTheme.title}</div>
        <p class="greeting-sub">${statusTheme.sub}</p>
      </div>
    </div>

    <!-- 區塊一：營養大補帖 (蛋白質四大天王) -->
    <div class="section-box nutri">
      <div class="section-header">
        <h3 class="section-title nutri">🍽️ 營養大補帖：每天吃足蛋白質，存肌肉不流失！</h3>
        <span style="font-size: 10px; color: #166534; font-weight: 700;">依體重 (${weight || 60}kg) 專屬精算</span>
      </div>

      <div class="nutri-targets">
        <div class="target-pill green">
          <div class="target-label">每天建議蛋白質目標</div>
          <div class="target-val green">${proteinLow} ～ ${proteinHigh} <span style="font-size: 11px;">公克</span></div>
          <div class="target-hint">相當於每天吃進 3～4 份優質蛋白質</div>
        </div>
        <div class="target-pill blue">
          <div class="target-label">每天建議總熱量</div>
          <div class="target-val blue">約 ${calories} <span style="font-size: 11px;">大卡</span></div>
          <div class="target-hint">熱量充足，才不會燃燒消耗自體肌肉</div>
        </div>
      </div>

      <!-- 四大食材圖鑑卡 (2x2) -->
      <div class="food-grid">
        <div class="food-card">
          <div class="food-emoji">🥛</div>
          <div class="food-info">
            <div class="food-name">濃無糖豆漿 <span class="food-prot">+7g 蛋白質</span></div>
            <div class="food-desc">1 杯 (約 240ml) • 好吞嚥、吸收快，早餐或點心首選</div>
          </div>
        </div>
        <div class="food-card">
          <div class="food-emoji">🥚</div>
          <div class="food-info">
            <div class="food-name">水煮蛋 / 蒸蛋 <span class="food-prot">+7g 蛋白質</span></div>
            <div class="food-desc">1 顆 • 牙口不好長者首選軟嫩好嚼的蒸蛋</div>
          </div>
        </div>
        <div class="food-card">
          <div class="food-emoji">🐟</div>
          <div class="food-info">
            <div class="food-name">清蒸魚 / 嫩雞肉 <span class="food-prot">+20g 蛋白質</span></div>
            <div class="food-desc">掌心大小 (約 1 掌) • 鱸魚鮭魚肉質細嫩，護心血管</div>
          </div>
        </div>
        <div class="food-card">
          <div class="food-emoji">🧈</div>
          <div class="food-info">
            <div class="food-name">傳統板豆腐 / 豆干 <span class="food-prot">+14g 蛋白質</span></div>
            <div class="food-desc">半盒板豆腐 • 植物性高鈣高蛋白，守護骨骼健康</div>
          </div>
        </div>
      </div>

      <div class="sun-tip">
        ☀️ <strong>陽光骨力小叮嚀：</strong>每天早晨或傍晚散步曬太陽 10～15 分鐘，幫助身體製造維生素 D，讓鈣質與肌肉吸收更好！
      </div>
    </div>

    <!-- 區塊二：居家保命運動處方 (客製化 4 項圖解卡片) -->
    <div class="section-box exercise">
      <div class="section-header">
        <h3 class="section-title exercise">🏃‍♂️ 專屬居家保命運動（根據長者實測活動能力客製化安排）</h3>
        <span style="font-size: 10px; color: #1e40af; font-weight: 700;">
          ${isUnableWalk ? '臥床/輪椅專屬防攣縮' : hasKneeOA ? '膝退化免蹲專屬' : '安全日常防跌賦能'}
        </span>
      </div>

      <div class="exercise-grid">
        ${exercises.map(ex => `
        <div class="exercise-card">
          <div>
            <div class="exercise-head">
              <div>
                <span class="exercise-num">${ex.num}</span>
                <span class="exercise-title">${ex.title}</span>
              </div>
              <span class="exercise-tag">${ex.tag}</span>
            </div>
            <div class="exercise-desc">${ex.desc}</div>
          </div>
          <div class="exercise-benefit">🎯 功效：${ex.benefit}</div>
        </div>
        `).join('')}
      </div>

      <div class="exercise-alert">
        <span>⚠️ <strong>安全第一叮嚀：</strong>運動時務必穿著防滑包鞋，身旁有平穩支撐；若頭暈或關節劇痛請立即停止休息！</span>
      </div>
    </div>

    <!-- 區塊三：起床起身防跌三部曲 -->
    <div class="section-box fall">
      <div class="section-header">
        <h3 class="section-title fall">🛡️ 居家防跌保命守則：起床起身三部曲</h3>
        <span style="font-size: 10px; color: #92400e; font-weight: 700;">防姿位性低血壓與突發暈眩</span>
      </div>

      <div class="fall-steps">
        <div class="step-pill">
          <strong>🛌 ① 醒來床上平躺 30 秒</strong>
          <span>調勻呼吸、手腳輕動動</span>
        </div>
        <div class="step-arrow">➔</div>
        <div class="step-pill">
          <strong>🪑 ② 坐於床緣垂腳 30 秒</strong>
          <span>放鬆雙腳、適應血壓變化</span>
        </div>
        <div class="step-arrow">➔</div>
        <div class="step-pill">
          <strong>🧍 ③ 站起扶穩 30 秒再邁步！</strong>
          <span>確認無頭暈黑矇後再前行</span>
        </div>
      </div>

      <div class="fall-note">
        ${specialFallNote}
      </div>
    </div>

    <!-- 頁尾聲明與專線 -->
    <div class="report-footer">
      <div>⚠️ <strong>長者照護叮嚀：</strong>本指南供居家健康促進與家屬照顧參考。若活動力突然顯著下降，請儘速就醫。</div>
      <div class="hotline-highlight">📞 衛福部長照 2.0 諮詢專線：手機/市話直撥 1966</div>
    </div>
  </div>
</body>
</html>`;
}

export function buildClinicalPdfHtml({ basicInfo, evaluationResults, aiReport, clinicalNotes }) {
  const { age, gender, height, weight } = basicInfo;
  const { totalScore, frailtyStatus, results, evaluatedAt } = evaluationResults;
  const displayDate = basicInfo.assessmentDate || 
    (evaluatedAt ? (evaluatedAt.includes('/') || evaluatedAt.includes('-') ? evaluatedAt.split(' ')[0].replace(/\//g, '-') : evaluatedAt) : new Date().toISOString().slice(0, 10));
  const bmi = weight && height ? (weight / Math.pow(height / 100, 2)).toFixed(1) : '--';

  const riskColor = totalScore === 0 ? '#15803d' : totalScore <= 2 ? '#b45309' : '#be123c';
  const riskBg = totalScore === 0 ? '#f0fdf4' : totalScore <= 2 ? '#fffbeb' : '#fff1f2';

  const proteinLow = Math.round((weight || 60) * (totalScore >= 1 ? 1.2 : 1.0));
  const proteinHigh = Math.round((weight || 60) * (totalScore >= 3 ? 1.5 : (totalScore >= 1 ? 1.3 : 1.2)));
  const proteinFactor = totalScore >= 3 ? '1.2 ~ 1.5' : (totalScore >= 1 ? '1.2 ~ 1.3' : '1.0 ~ 1.2');
  const calories = Math.round((weight || 60) * 30);

  const isUnableWalk = results.walkingSpeed?.detail?.includes('無法施測');
  const hasFallHistory = (clinicalNotes || '').includes('跌倒');
  const hasPolypharmacy = (clinicalNotes || '').includes('多重用藥') || (clinicalNotes || '').includes('高血壓');

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>周全性老年衰弱臨床評估與處方報告（醫護專業版）</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0; padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif;
      color: #0f172a; background: white;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
      font-size: 10.5px; line-height: 1.4;
    }
    .page-container {
      width: 210mm; height: 296mm; max-height: 296mm;
      padding: 7mm 9mm; margin: 0 auto;
      display: flex; flex-direction: column; justify-content: space-between;
      overflow: hidden; background: white;
    }
    .report-header {
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 4px; margin-bottom: 6px;
      display: flex; align-items: flex-end; justify-content: space-between;
    }
    .header-badge {
      display: inline-block; background: #dbeafe; color: #1e40af;
      font-size: 9.5px; font-weight: 800; padding: 1px 6px; border-radius: 4px; margin-bottom: 2px;
    }
    .main-title { font-size: 17.5px; font-weight: 900; color: #1e3a8a; margin: 0 0 2px 0; }
    .sub-title { font-size: 10px; color: #475569; }
    .meta-info { text-align: right; font-size: 9px; color: #64748b; line-height: 1.35; }

    .patient-bar {
      background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 5px;
      padding: 4px 8px; margin-bottom: 5px;
      display: grid; grid-template-columns: 1fr 1fr 1fr 1.5fr; gap: 6px; font-size: 10px;
    }
    .patient-bar strong { color: #1e3a8a; }

    .summary-card {
      background: ${riskBg}; border: 1.5px solid ${riskColor}; border-radius: 5px;
      padding: 6px 10px; margin-bottom: 6px;
      display: flex; align-items: center; gap: 10px;
    }
    .score-circle {
      width: 44px; height: 44px; border-radius: 50%; background: white;
      border: 2.5px solid ${riskColor}; display: flex; flex-direction: column;
      align-items: center; justify-content: center; flex-shrink: 0; color: ${riskColor};
    }
    .score-circle .num { font-size: 18px; font-weight: 900; line-height: 1; }
    .score-circle .sub { font-size: 7.5px; font-weight: 700; }
    .level-text { font-size: 14px; font-weight: 900; color: ${riskColor}; margin: 0 0 1px 0; }
    .meaning-text { font-size: 10px; color: #334155; margin: 0; line-height: 1.3; }

    .clinical-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 10px; }
    .clinical-table th, .clinical-table td { border: 1px solid #cbd5e1; padding: 3px 5px; text-align: left; }
    .clinical-table th { background: #f1f5f9; color: #1e3a8a; font-weight: 700; }
    .badge-pos { background: #ffe4e6; color: #be123c; font-weight: 800; padding: 1px 4px; border-radius: 3px; font-size: 9px; }
    .badge-neg { background: #dcfce7; color: #15803d; font-weight: 800; padding: 1px 4px; border-radius: 3px; font-size: 9px; }

    .clinical-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; flex: 1; margin-bottom: 5px; }
    .c-card { border: 1px solid #cbd5e1; border-radius: 5px; padding: 6px 8px; background: #ffffff; display: flex; flex-direction: column; }
    .c-card.patho { background: #f8fafc; border-color: #94a3b8; }
    .c-card.interv { background: #f0fdf4; border-color: #86efac; }
    .c-head {
      font-size: 11.5px; font-weight: 800; margin-bottom: 4px; padding-bottom: 3px;
      border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;
    }
    .c-head.patho { color: #0f172a; }
    .c-head.interv { color: #166534; }

    .item-row { margin-bottom: 4px; font-size: 9.5px; line-height: 1.35; color: #334155; }
    .item-row strong { color: #0f172a; }

    .sign-bar {
      border-top: 1px solid #cbd5e1; padding-top: 4px;
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 9px; color: #475569;
    }
    .sign-line { border-bottom: 1px dotted #94a3b8; height: 14px; margin-top: 2px; }
    .report-footer { font-size: 8.5px; color: #64748b; margin-top: 3px; display: flex; align-items: center; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="report-header">
      <div>
        <div class="header-badge">📋 醫護專業與臨床門診版</div>
        <h1 class="main-title">周全性老年衰弱臨床評估與處方報告</h1>
        <div class="sub-title">標準：Linda P. Fried Frailty Phenotype (CHS, 2001) • 周全性老年評估 CGA</div>
      </div>
      <div class="meta-info">
        <div>評估時間：${evaluatedAt || new Date().toLocaleString('zh-TW')}</div>
        <div>病歷參考：臨床醫護/長照整合系統</div>
      </div>
    </div>

    <div class="patient-bar">
      <div><strong>個案：</strong>${age ? `${age} 歲` : '--'} ${gender === 'male' ? '男性' : gender === 'female' ? '女性' : ''}</div>
      <div><strong>身長/體重：</strong>${height || '--'} cm / ${weight || '--'} kg</div>
      <div><strong>BMI：</strong>${bmi} kg/m²</div>
      <div><strong>共病/用藥：</strong>${clinicalNotes ? clinicalNotes.slice(0, 22) : '無特別補充'}</div>
    </div>

    <div class="summary-card">
      <div class="score-circle">
        <span class="num">${totalScore}</span>
        <span class="sub">/ 5分</span>
      </div>
      <div>
        <div class="level-text">臨床分級判定：${frailtyStatus}</div>
        <div class="meaning-text">${evaluationResults.clinicalMeaning}</div>
      </div>
    </div>

    <table class="clinical-table">
      <thead>
        <tr>
          <th style="width: 20%;">Fried 表型維度</th>
          <th style="width: 25%;">臨床實測 / 表徵狀態</th>
          <th style="width: 45%;">CHS 門檻切點與臨床判定依據</th>
          <th style="width: 10%; text-align: center;">給分</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1. 非自主體重減輕</strong></td>
          <td>${results.weightLoss.detail.split('：')[1] || results.weightLoss.detail}</td>
          <td>過去一年非自主減輕 ≥4.5 kg 或 ≥5.0%（蛋白質異化分解指標）</td>
          <td style="text-align: center;"><span class="${results.weightLoss.isPositive ? 'badge-pos' : 'badge-neg'}">${results.weightLoss.score} 分</span></td>
        </tr>
        <tr>
          <td><strong>2. 自覺疲憊感</strong></td>
          <td>${results.exhaustion.detail.split('：')[1] || results.exhaustion.detail}</td>
          <td>CES-D 篩檢：過去一週內 ≥3-4 天自覺做任何事皆費力或提不起勁</td>
          <td style="text-align: center;"><span class="${results.exhaustion.isPositive ? 'badge-pos' : 'badge-neg'}">${results.exhaustion.score} 分</span></td>
        </tr>
        <tr>
          <td><strong>3. 身體活動量偏低</strong></td>
          <td>${results.physicalActivity.detail.split('：')[1] || results.physicalActivity.detail}</td>
          <td>Minnesota 問卷耗能低於最低 20%（男&lt;383 kcal/週，女&lt;270 kcal/週）</td>
          <td style="text-align: center;"><span class="${results.physicalActivity.isPositive ? 'badge-pos' : 'badge-neg'}">${results.physicalActivity.score} 分</span></td>
        </tr>
        <tr>
          <td><strong>4. 行走速度遲緩</strong></td>
          <td>${results.walkingSpeed.detail.split('：')[1] || results.walkingSpeed.detail}</td>
          <td>4 公尺步行時間門檻切點比對（因臥床或偏癱無法施測依原著計 1 分）</td>
          <td style="text-align: center;"><span class="${results.walkingSpeed.isPositive ? 'badge-pos' : 'badge-neg'}">${results.walkingSpeed.score} 分</span></td>
        </tr>
        <tr>
          <td><strong>5. 最大握力低下</strong></td>
          <td>${results.gripStrength.detail.split('：')[1] || results.gripStrength.detail}</td>
          <td>握力計實測依性別/BMI 切點或 SARC-F 上肢 5kg 提拿功能自評</td>
          <td style="text-align: center;"><span class="${results.gripStrength.isPositive ? 'badge-pos' : 'badge-neg'}">${results.gripStrength.score} 分</span></td>
        </tr>
      </tbody>
    </table>

    <div class="clinical-grid">
      <!-- 左欄：生理病理剖析與風險推估 -->
      <div class="c-card patho">
        <div class="c-head patho">
          <span>🩺 生理病理剖析與預後風險</span>
          <span style="font-size: 9.5px; color: #475569;">Pathophysiology & Risks</span>
        </div>
        <div class="item-row">
          <strong>• 骨骼肌與代謝異化 (Sarcopenia / Catabolism)：</strong>
          ${results.weightLoss.isPositive ? '個案存在顯著體重減損與肌肉質量異化分解，惡病質與低白蛋白血症風險高。' : '目前骨骼肌與體重維持穩定，需持續維持熱量正平衡。'}
          ${results.gripStrength.isPositive ? '伴隨上肢肌力與握力偏低，符合肌少症臨床特徵。' : '上肢肌力維持正常範圍。'}
        </div>
        <div class="item-row">
          <strong>• 臨床預後風險量化推估：</strong>
          綜合評分為 ${totalScore} 分（${frailtyStatus}）。面對外界突發急性壓力源（如感染、小手術或更換藥物）時，發生跌倒骨折、功能急性退化及非預期急診住院風險顯著上升。
        </div>
        <div class="item-row">
          <strong>• 用藥安全與共病交互影響：</strong>
          ${hasPolypharmacy ? '檢視多重用藥清單（參照 Beers Criteria），警惕鎮靜安眠藥、肌肉鬆弛劑或降壓藥引發姿位性低血壓及致跌效應。' : '常規追蹤慢性病控制，避免多重用藥交互負擔。'}
          ${hasFallHistory ? '⚠️ 過去曾有跌倒紀錄，屬高風險個案，起立行走需輔具與防護！' : ''}
        </div>
      </div>

      <!-- 右欄：周全性臨床處方與照會指引 -->
      <div class="c-card interv">
        <div class="c-head interv">
          <span>📋 周全性處方與照會指引 (CGA Interventions)</span>
          <span style="font-size: 9.5px; color: #15803d;">Clinical Action Plan</span>
        </div>
        <div class="item-row">
          <strong>• 醫學營養處方 (體重 ${weight || 60}kg 精算)：</strong>
          蛋白質每日目標 <strong>${proteinLow} ~ ${proteinHigh} 公克</strong> (${proteinFactor} g/kg/day)；每日總熱量目標約 <strong>${calories} 大卡</strong> (30 kcal/kg/day)。三餐平均分佈攝取優質蛋白質（每餐≥20g），克服老年肌肉合成同化阻抗 (Anabolic Resistance)。
        </div>
        <div class="item-row">
          <strong>• 漸進式運動復能處方：</strong>
          ${isUnableWalk ? '執行床上踝幫浦、雙臂擴胸與定時輪椅減壓，維持肺功能與關節活動度。' : '大腿股四頭肌坐姿抬腿或扶椅起立訓練，強化下肢抗阻力；小腿微墊腳尖鍛鍊動態平衡反射。'}
        </div>
        <div class="item-row">
          <strong>• 跨專業團隊轉介與照會建議：</strong>
          建議照會老年醫學科醫師進行 CGA 周全性評估、轉介物理治療師評估步態輔具、營養師營養諮詢；評估銜接長照 2.0 居家照護與防跌環境改善。
        </div>
      </div>
    </div>

    <!-- 醫護人員簽核欄 -->
    <div class="sign-bar">
      <div>評估醫護人員：<div class="sign-line"></div></div>
      <div>專業科別 / 單位：<div class="sign-line"></div></div>
      <div>主治醫師覆核：<div class="sign-line"></div></div>
    </div>

    <div class="report-footer">
      <div>⚠️ <strong>教學與臨床篩檢提示：</strong>本系統為老年醫學臨床教學與初步篩檢輔助工具，正式診斷需由專科醫師確立。</div>
      <div>長照 2.0 專線：1966</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 產生「隨身簡要摘要版」A4 一頁式 HTML
 */
export function buildSummaryPdfHtml({ basicInfo, evaluationResults, criteriaAnswers = {}, clinicalNotes }) {
  return buildSeniorPdfHtml({ basicInfo, evaluationResults, criteriaAnswers, aiReport: null, clinicalNotes });
}

/**
 * 下載專屬 PDF 報告檔案（支援 'senior' | 'clinical' | 'summary'）
 */
export async function downloadPdfReport({ basicInfo, evaluationResults, criteriaAnswers = {}, aiReport, clinicalNotes, type = 'senior' }) {
  let html = '';
  let filename = '';

  const displayDate = basicInfo?.assessmentDate || 
    (evaluationResults?.evaluatedAt ? (evaluationResults.evaluatedAt.includes('/') || evaluationResults.evaluatedAt.includes('-') ? evaluationResults.evaluatedAt.split(' ')[0].replace(/\//g, '-') : evaluationResults.evaluatedAt) : new Date().toISOString().slice(0, 10));

  const genderStr = basicInfo?.gender === 'male' ? '男' : basicInfo?.gender === 'female' ? '女' : '';
  const ageStr = basicInfo?.age ? `${basicInfo.age}歲` : '';

  if (type === 'clinical') {
    html = buildClinicalPdfHtml({ basicInfo, evaluationResults, criteriaAnswers, aiReport, clinicalNotes });
    filename = `AI衰弱評估報告_醫護專業版_${displayDate}_${ageStr}${genderStr}.pdf`;
  } else if (type === 'summary') {
    html = buildSummaryPdfHtml({ basicInfo, evaluationResults, criteriaAnswers, clinicalNotes });
    filename = `AI衰弱評估摘要_隨身版_${displayDate}_${ageStr}${genderStr}.pdf`;
  } else {
    // default: senior
    html = buildSeniorPdfHtml({ basicInfo, evaluationResults, criteriaAnswers, aiReport, clinicalNotes });
    filename = `AI衰弱評估報告_長者圖文版_${displayDate}_${ageStr}${genderStr}.pdf`;
  }

  // 建立乾淨的渲染容器掛載至 document.body
  const container = document.createElement('div');
  container.id = 'pdf-render-sandbox';
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = '794px'; // 210mm @ 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.zIndex = '-9999';
  container.innerHTML = html;
  document.body.appendChild(container);

  await new Promise(resolve => setTimeout(resolve, 200));
  const targetElement = container.querySelector('.page-container') || container;

  try {
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      }
    };

    await html2pdf().set(opt).from(targetElement).save();
    return { success: true, method: 'pdf' };
  } catch (err) {
    console.warn('html2pdf 產生失敗，自動喚起原生列印為 PDF：', err);
    openPrintPdfWindow({ basicInfo, evaluationResults, aiReport, clinicalNotes, type });
    return { success: true, method: 'print' };
  } finally {
    setTimeout(() => {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }, 1200);
  }
}

/**
 * 匯出/下載一頁式「長者圖文版 PDF」
 */
export async function downloadSeniorPdf({ basicInfo, evaluationResults, criteriaAnswers = {}, aiReport, clinicalNotes }) {
  return await downloadPdfReport({ basicInfo, evaluationResults, criteriaAnswers, aiReport, clinicalNotes, type: 'senior' });
}

/**
 * 匯出/下載一頁式「醫護臨床專業版 PDF」
 */
export async function downloadClinicalPdf({ basicInfo, evaluationResults, criteriaAnswers = {}, aiReport, clinicalNotes }) {
  return await downloadPdfReport({ basicInfo, evaluationResults, criteriaAnswers, aiReport, clinicalNotes, type: 'clinical' });
}

/**
 * 匯出/下載一頁式「隨身摘要版 PDF」
 */
export async function downloadSummaryPdf({ basicInfo, evaluationResults, criteriaAnswers = {}, clinicalNotes }) {
  return await downloadPdfReport({ basicInfo, evaluationResults, criteriaAnswers, aiReport: null, clinicalNotes, type: 'summary' });
}

/**
 * 喚起無變形「列印為 PDF」視窗
 */
export function openPrintPdfWindow({ basicInfo, evaluationResults, criteriaAnswers = {}, aiReport, clinicalNotes, type = 'senior' }) {
  let html = '';
  if (type === 'clinical') {
    html = buildClinicalPdfHtml({ basicInfo, evaluationResults, criteriaAnswers, aiReport, clinicalNotes });
  } else if (type === 'summary') {
    html = buildSummaryPdfHtml({ basicInfo, evaluationResults, criteriaAnswers, clinicalNotes });
  } else {
    html = buildSeniorPdfHtml({ basicInfo, evaluationResults, criteriaAnswers, aiReport, clinicalNotes });
  }

  const printWin = window.open('', '_blank', 'width=850,height=1100');
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 400);
  }
}

