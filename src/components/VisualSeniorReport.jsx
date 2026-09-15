import React, { useState, useMemo } from 'react';
import {
  Heart,
  Apple,
  Dumbbell,
  Shield,
  PhoneCall,
  Sun,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  CheckCircle2,
  Smile,
  Info,
  UserCheck
} from 'lucide-react';

export default function VisualSeniorReport({
  basicInfo,
  evaluationResults,
  criteriaAnswers = {},
  clinicalNotes = '',
  aiReport
}) {
  const [showDetailedClinical, setShowDetailedClinical] = useState(false);

  const { totalScore, frailtyStatus, results } = evaluationResults;
  const { weight = 60, gender } = basicInfo;

  // 依體重計算長者每日蛋白質與熱量
  const proteinLow = Math.round((weight || 60) * (totalScore >= 1 ? 1.2 : 1.0));
  const proteinHigh = Math.round((weight || 60) * (totalScore >= 3 ? 1.5 : (totalScore >= 1 ? 1.3 : 1.2)));
  const calories = Math.round((weight || 60) * 30);

  // 長者友善標語
  const statusTheme = totalScore === 0
    ? {
        title: '活力健壯長者！維持好精神！',
        sub: '您的身體儲備量非常充足，繼續保持良好的運動與三餐飲食，快樂享受銀髮生活！',
        bg: '#ecfdf5',
        border: '#10b981',
        text: '#065f46',
        badge: 'bg-emerald-100 text-emerald-800'
      }
    : totalScore <= 2
    ? {
        title: '體能稍有減退，現在是「逆轉健康」的黃金期！',
        sub: '已經出現輕微疲憊或肌力下降跡象，但別擔心！只要吃足蛋白質並配合針對您狀況的居家運動，極大機會恢復活力！',
        bg: '#fffbeb',
        border: '#f59e0b',
        text: '#92400e',
        badge: 'bg-amber-100 text-amber-800'
      }
    : {
        title: '身體較為虛弱，需要客製化守護與扶持',
        sub: '肌肉與體能顯著耗損，日常生活中請放慢腳步、加強防跌。以下運動與安全措施已特別依您的活動能力為您量身調整！',
        bg: '#fff1f2',
        border: '#f43f5e',
        text: '#9f1239',
        badge: 'bg-rose-100 text-rose-800'
      };

  // -------------------------------------------------------------
  // 核心演算法：根據長者「實測活動能力」與「個人慢性病史」動態生成運動處方
  // -------------------------------------------------------------
  const personalizedExercises = useMemo(() => {
    const walkMethod = criteriaAnswers.walkingSpeed?.method;
    const gripMethod = criteriaAnswers.gripStrength?.method;
    const notes = clinicalNotes || '';
    const isWalkSlow = results.walkingSpeed?.isPositive;
    const isGripLow = results.gripStrength?.isPositive;

    const list = [];

    // 情境一：長者無法站立/完全臥床/長期輪椅代步
    if (walkMethod === 'unable') {
      list.push({
        num: 1,
        title: '床上足踝幫浦運動 (躺姿)',
        desc: '躺在床上雙腳腳掌輪流向下踩、向上勾起維持 3 秒，每次 15 下。',
        benefit: '🎯 功效：促進下肢血液回流，預防深層靜脈血栓與垂足變形！',
        tag: '臥床專屬'
      });
      list.push({
        num: 2,
        title: '床上坐起雙臂擴胸 (躺/半坐臥)',
        desc: '搖高床頭或由家屬攙扶坐起，雙手緩慢向兩側張開深吸氣，再收回吐氣，重複 8 次。',
        benefit: '🎯 功效：鍛鍊呼吸肌與胸背肌力，預防肺部積痰與呼吸衰竭。',
        tag: '安全溫和'
      });
      list.push({
        num: 3,
        title: '輪椅坐姿臀部減壓抬身 (坐姿)',
        desc: '坐在輪椅上每 30 分鐘，雙手扶扶手微向前傾或將屁股輪流側傾減壓。',
        benefit: '🎯 功效：避免坐骨結節處持續受壓，是預防壓瘡與褥瘡的最關鍵動作！',
        tag: '壓瘡防範'
      });
      if (gripMethod === 'unable') {
        list.push({
          num: 4,
          title: '手部被動關節伸展 (照顧者協助)',
          desc: '由家屬溫柔握住長者手腕，輕柔將手指逐一扳開伸直再放鬆，每次 5 分鐘。',
          benefit: '🎯 功效：預防中風偏癱或關節攣縮後的手指拳縮變形。',
          tag: '關節放鬆'
        });
      } else {
        list.push({
          num: 4,
          title: '床上輕捏毛巾練習 (手部)',
          desc: '拿一條乾毛巾在胸前輕輕捏握與捲折，左右手各做 10 次。',
          benefit: '🎯 功效：維持指部末梢神經感知與基礎握力。',
          tag: '末梢循環'
        });
      }
      return list;
    }

    // 情境二：長者能站立行走，但步速緩慢或自評行走困難
    if (isWalkSlow || walkMethod === 'self_report') {
      if (notes.includes('關節炎')) {
        list.push({
          num: 1,
          title: '坐姿直膝抬腿 (退化性膝關節炎專屬)',
          desc: '端坐椅子上，將單側小腿打直抬平維持 5 秒，左右腳輪流各做 10 次。',
          benefit: '🎯 功效：不傷膝蓋軟骨！強化大腿股四頭肌，走路有力不腿軟。',
          tag: '保護膝蓋'
        });
      } else {
        list.push({
          num: 1,
          title: '安全扶椅起立 (有人在側看護)',
          desc: '雙手扶穩穩固高背餐椅，慢慢站起站直停 2 秒，再緩慢坐回椅子，每日做 8～10 次。',
          benefit: '🎯 功效：強化由坐到站的大腿與臀部肌力，防跌第一名！',
          tag: '核心防跌'
        });
      }

      list.push({
        num: 2,
        title: '坐姿原地踏步 (坐姿防摔)',
        desc: '端坐在無輪餐椅上，雙腳輪流踏步踩地，每天做 30～50 下。',
        benefit: '🎯 功效：坐著就能安全活動髖關節與大腿，增強神經肌肉協調。',
        tag: '安全有氧'
      });

      list.push({
        num: 3,
        title: '扶牆微墊腳尖 (小腿肌力鍛鍊)',
        desc: '雙手穩扶牆面，腳後跟輕輕墊起 2 秒再放下，重複 10 次。',
        benefit: '🎯 功效：鍛鍊小腿腓腸肌，過馬路與跨越門檻步伐更輕盈。',
        tag: '步伐穩定'
      });

      if (isGripLow || gripMethod === 'unable' || gripMethod === 'self_report') {
        list.push({
          num: 4,
          title: '捏握軟式彈力球 (手部抓握強化)',
          desc: '手握軟式網球或彈力球用力捏緊 3 秒再放鬆，左右手各做 10 次。',
          benefit: '🎯 功效：提升手部握力，拿筷子、端碗、扭毛巾與握拐杖更穩固！',
          tag: '握力加強'
        });
      } else {
        list.push({
          num: 4,
          title: '扶桌沿骨盆前後擺動 (平衡訓練)',
          desc: '雙手扶穩桌緣，身體重心輕輕向前移、再向後移，感受腳底板均勻受力。',
          benefit: '🎯 功效：重新喚醒足底本體感覺神經，預防身體後仰傾倒。',
          tag: '動態平衡'
        });
      }
      return list;
    }

    // 情境三：各項正常或健壯等級長者 (0-1分)
    list.push({
      num: 1,
      title: '戶外自然快步健走 (中強度有氧)',
      desc: '每週累積至少 150 分鐘（每次 30 分鐘），步速維持微喘但仍能說話程度。',
      benefit: '🎯 功效：維持良好心肺功能與下肢肌耐力。',
      tag: '體能維持'
    });
    list.push({
      num: 2,
      title: '徒手深蹲或椅上升降 (全身肌力)',
      desc: '雙腳與肩同寬，背部打直下蹲至大腿微屈，每日做 2 組每組 10～12 次。',
      benefit: '🎯 功效：強化全身骨骼肌質量，預防肌肉流失。',
      tag: '肌力強化'
    });
    list.push({
      num: 3,
      title: '單腳站立平衡練習 (前庭小腦平衡)',
      desc: '雙手微扶椅背，單腳離地維持 10 秒，換腳進行，每日 3 次。',
      benefit: '🎯 功效：強化前庭與深層小肌群平衡反射，遠離日常絆倒。',
      tag: '平衡敏捷'
    });
    list.push({
      num: 4,
      title: '寶特瓶手部微負重肌力訓練',
      desc: '雙手握持 500ml 裝水寶特瓶，進行二頭肌彎舉與推舉，每組 12 次。',
      benefit: '🎯 功效：維持手臂上肢爆發力，提菜買菜輕鬆自如。',
      tag: '日常生活'
    });

    return list;
  }, [basicInfo, criteriaAnswers, evaluationResults, clinicalNotes]);

  // -------------------------------------------------------------
  // 核心演算法：根據長者「病史、跌倒史、肢體狀況」動態生成防跌守護指南
  // -------------------------------------------------------------
  const personalizedFallMeasures = useMemo(() => {
    const notes = clinicalNotes || '';
    const walkMethod = criteriaAnswers.walkingSpeed?.method;
    const measures = [];

    // 1. 若病史中有跌倒經驗
    if (notes.includes('跌倒')) {
      measures.push({
        title: '曾跌倒高風險特別防備',
        desc: '近半年曾有跌倒史是「再跌倒」的最大危險因子！長者離床處應安裝感應呼叫鈴，起立與走動時務必有專人在旁守護。',
        tag: '高危預警'
      });
    }

    // 2. 若有高血壓或多重用藥
    if (notes.includes('高血壓') || notes.includes('多重用藥')) {
      measures.push({
        title: '防姿位性低血壓「起床起身三部曲」',
        desc: '睡醒先在床上平躺 30 秒、坐於床緣垂腳放鬆 30 秒、站起扶穩 30 秒確認無頭暈黑矇再邁步，防突發暈厥跌倒！',
        tag: '藥物/血壓防護'
      });
    }

    // 3. 若有糖尿病
    if (notes.includes('糖尿病')) {
      measures.push({
        title: '糖尿病足部防護（嚴禁赤腳）',
        desc: '室內嚴禁打赤腳行走以防末梢感知遲鈍踩到異物造成傷口；每天洗澡後仔細檢查雙腳足底與腳趾縫有無發紅破損。',
        tag: '慢病專屬'
      });
    }

    // 4. 若有退化性關節炎
    if (notes.includes('關節炎')) {
      measures.push({
        title: '膝關節減壓防跌守則',
        desc: '外出建議使用四腳拐杖或輕量助行器分散膝蓋負擔；上下樓梯遵循「好腳先上、壞腳先下」之護理原則。',
        tag: '關節保護'
      });
    }

    // 5. 若有骨質疏鬆
    if (notes.includes('骨質疏鬆')) {
      measures.push({
        title: '骨鬆脊椎防骨折安全環境',
        desc: '嚴禁彎腰猛烈搬提重物；浴室地面全面鋪設高阻力真空吸盤防滑墊，杜絕濕滑跌倒引發髖部骨折。',
        tag: '骨質保護'
      });
    }

    // 6. 若為獨居長者
    if (notes.includes('獨居')) {
      measures.push({
        title: '獨居長者緊急救援連線',
        desc: '隨身配戴防水緊急呼救按鈕手環；與鄰里居服員或家屬設定每日定時通話報平安機制。',
        tag: '獨居照護'
      });
    }

    // 7. 若為無法行走/輪椅長者
    if (walkMethod === 'unable') {
      measures.push({
        title: '床欄防墜與輪椅安全雙煞車',
        desc: '臥床時兩側床欄務必確實拉起定位；長者坐上、離開或停放輪椅時，兩側輪煞必須同時緊鎖。',
        tag: '轉位安全'
      });
    }

    // 補齊基礎通用守則至 4 項
    if (measures.length < 4) {
      measures.push({
        title: '浴室濕區加裝安全扶手',
        desc: '馬桶旁與淋浴區安裝垂直與水平 L 型穩固金屬扶手，長者如廁站起有所支撐。',
        tag: '居家環境'
      });
    }
    if (measures.length < 4) {
      measures.push({
        title: '夜間走道留設感應夜燈',
        desc: '床邊至洗手間沿途插上自動感應柔和黃光小夜燈，半夜起床視線不摸黑。',
        tag: '照明安全'
      });
    }
    if (measures.length < 4) {
      measures.push({
        title: '客廳地面全面清除障礙物',
        desc: '收好散落地板的電線與延長線，移除容易捲邊翹起的小地毯，走道保持通暢。',
        tag: '動線淨空'
      });
    }
    if (measures.length < 4) {
      measures.push({
        title: '門診藥袋整合（防嗜睡跌倒）',
        desc: '就醫時整包藥袋攜至老年醫學科門診，審查安眠藥、肌肉鬆弛劑或降血壓藥是否有昏沉副作用。',
        tag: '用藥安全'
      });
    }

    return measures.slice(0, 4);
  }, [clinicalNotes, criteriaAnswers]);

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* 1. 長者大字體精神問候卡片 */}
      <div style={{
        backgroundColor: statusTheme.bg,
        border: `2px solid ${statusTheme.border}`,
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1.25rem'
      }}>
        <div style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          backgroundColor: 'white',
          border: `3px solid ${statusTheme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: statusTheme.border
        }}>
          <Smile size={32} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
            <span className={`case-tag ${statusTheme.badge}`} style={{ fontSize: '0.9rem', padding: '0.25rem 0.75rem' }}>
              評估結果：{frailtyStatus}（總分 {totalScore} 分）
            </span>
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: statusTheme.text, margin: '0.25rem 0 0.5rem 0' }}>
            {statusTheme.title}
          </h3>
          <p style={{ fontSize: '1.05rem', color: '#334155', lineHeight: '1.7', margin: 0 }}>
            {statusTheme.sub}
          </p>
        </div>
      </div>

      {/* 2. 圖文並茂：吃出好肌力 - 每日蛋白質與熱量圖解指南 */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: '14px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Apple size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#166534', margin: 0 }}>
              🍽️ 營養大補帖：每天吃足蛋白質，存肌肉不流失！
            </h4>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              依長者目前體重 ({weight || 60} kg) 專屬精算
            </span>
          </div>
        </div>

        {/* 數字大卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 700 }}>
              每天建議蛋白質目標
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#15803d', margin: '0.25rem 0' }}>
              {proteinLow} ～ {proteinHigh} <span style={{ fontSize: '1rem', fontWeight: 600 }}>公克</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569' }}>
              相當於每天要吃進 3~4 份優質蛋白質
            </div>
          </div>

          <div style={{ backgroundColor: '#eff6ff', border: '1.5px solid #93c5fd', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#1e40af', fontWeight: 700 }}>
              每天建議總熱量
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1d4ed8', margin: '0.25rem 0' }}>
              約 {calories} <span style={{ fontSize: '1rem', fontWeight: 600 }}>大卡</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569' }}>
              熱量要足夠，才不會消耗自己的肌肉
            </div>
          </div>
        </div>

        {/* 四大長者優質食材圖鑑卡 */}
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
          🛒 長者推薦！好咬好吸收的「蛋白質四大天王」：
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem' }}>
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.25rem', marginBottom: '0.25rem' }}>🥛</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>濃無糖豆漿</div>
            <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700 }}>1 杯 (約 7g 蛋白質)</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>好吞嚥，早點或點心皆宜</div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.25rem', marginBottom: '0.25rem' }}>🥚</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>水煮蛋 / 蒸蛋</div>
            <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700 }}>1 顆 (約 7g 蛋白質)</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>牙口不好首選軟嫩蒸蛋</div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.25rem', marginBottom: '0.25rem' }}>🐟</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>清蒸鮮魚 / 雞肉</div>
            <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700 }}>掌心大小 (約 20g 蛋白質)</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>鱸魚/鮭魚細嫩又護心血管</div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.25rem', marginBottom: '0.25rem' }}>🧈</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>傳統板豆腐 / 豆干</div>
            <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700 }}>半盒板豆腐 (約 14g 蛋白質)</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>富含鈣質，預防骨質疏鬆</div>
          </div>
        </div>

        <div style={{ marginTop: '1rem', backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '0.75rem 1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: '#92400e' }}>
          <Sun size={20} color="#d97706" style={{ flexShrink: 0 }} />
          <span><strong>陽光骨力小叮嚀：</strong>每天早晨或傍晚散步曬太陽 10～15 分鐘，幫助身體製造維生素 D，讓鈣質與肌肉吸收更好！</span>
        </div>
      </div>

      {/* 3. 🎯 依長者能力與病史「客製化生成」的居家運動處方 */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: '14px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '8px', backgroundColor: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Dumbbell size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e40af', margin: 0 }}>
                🏃‍♂️ 專屬居家保命運動（根據長者目前活動能力客製化匹配）
              </h4>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {criteriaAnswers.walkingSpeed?.method === 'unable'
                  ? '已自動適配：長者無法站立/臥床，提供安全床上/輪椅肢體防攣縮運動'
                  : clinicalNotes.includes('關節炎')
                  ? '已自動適配：長者有膝關節炎病史，優先安排無負重坐姿強化大腿運動'
                  : '已根據長者步態與肌力狀態量身規劃'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700 }}>
            <UserCheck size={14} />
            <span>個人化精準匹配</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {personalizedExercises.map((ex) => (
            <div key={ex.num} style={{ border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '1rem', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ backgroundColor: '#1d4ed8', color: 'white', borderRadius: '50%', width: '1.6rem', height: '1.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800 }}>
                      {ex.num}
                    </span>
                    <strong style={{ fontSize: '1.05rem', color: '#1e293b' }}>{ex.title}</strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                    {ex.tag}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.6', margin: '0.25rem 0' }}>
                  {ex.desc}
                </p>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 600, marginTop: '0.5rem', borderTop: '1px dotted #cbd5e1', paddingTop: '0.35rem' }}>
                {ex.benefit}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#e11d48', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={16} />
          <span>安全第一守則：運動時務必穿著防滑包鞋，身旁有平穩支撐；若感到頭暈、呼吸急促或關節劇痛請立即停止休息！</span>
        </div>
      </div>

      {/* 4. 🎯 依長者「病史、用藥、跌倒經驗」動態匹配的防跌守護指南 */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: '14px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#92400e', margin: 0 }}>
                🛡️ 居家防跌針對性守護（依長者共病與跌倒風險量身建議）
              </h4>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                已結合長者之高血壓、糖尿病、骨質疏鬆、跌倒史等客製化配置
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#fef3c7', color: '#b45309', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700 }}>
            <UserCheck size={14} />
            <span>針對病史調整</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.875rem' }}>
          {personalizedFallMeasures.map((fm, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{fm.title}</strong>
                  <span style={{ fontSize: '0.7rem', backgroundColor: '#fef3c7', color: '#92400e', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                    {fm.tag}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                  {fm.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. 長照 1966 與諮詢卡片 */}
      <div style={{
        backgroundColor: '#eff6ff',
        border: '1.5px solid #bfdbfe',
        borderRadius: '12px',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: '#1d4ed8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneCall size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e3a8a' }}>
              需要居家照顧、復能或到府送餐協助？
            </div>
            <div style={{ fontSize: '0.85rem', color: '#3b82f6' }}>
              手機或市話直撥 <strong>1966 長照專線</strong>（前 5 分鐘免費，政府派照管專員到府評估）
            </div>
          </div>
        </div>

        <span style={{ fontSize: '0.85rem', backgroundColor: 'white', color: '#1e40af', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontWeight: 700, border: '1px solid #93c5fd' }}>
          政府長照 2.0 專線 1966
        </span>
      </div>

      {/* 6. 切換至完整醫護專業細節文本按鈕 */}
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => setShowDetailedClinical(!showDetailedClinical)}
          style={{ fontSize: '0.875rem', color: '#475569' }}
        >
          <FileText size={15} />
          <span>{showDetailedClinical ? '收起完整醫護臨床文本' : '查看完整醫護臨床深度剖析文本'}</span>
          {showDetailedClinical ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {showDetailedClinical && aiReport && (
          <div style={{
            textAlign: 'left',
            marginTop: '1rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1.25rem',
            fontSize: '0.9rem',
            color: '#1e293b',
            lineHeight: '1.8',
            whiteSpace: 'pre-line'
          }}>
            {aiReport.content}
          </div>
        )}
      </div>
    </div>
  );
}
