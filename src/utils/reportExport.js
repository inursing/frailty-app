/**
 * 報告匯出、下載與分享工具函式
 */

/**
 * 下載獨立精美的 HTML 評估報告檔案
 */
export function downloadHtmlReport({ basicInfo, evaluationResults, aiReport, clinicalNotes }) {
  const { age, gender, height, weight } = basicInfo;
  const { totalScore, frailtyStatus, results, evaluatedAt } = evaluationResults;
  const bmi = weight && height ? (weight / Math.pow(height / 100, 2)).toFixed(1) : '--';

  const riskColor = totalScore === 0 ? '#059669' : totalScore <= 2 ? '#d97706' : '#e11d48';
  const riskBg = totalScore === 0 ? '#ecfdf5' : totalScore <= 2 ? '#fffbeb' : '#fff1f2';

  const htmlContent = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>AI 衰弱評估與客製化照護處方報告 - ${age || ''}歲${gender === 'male' ? '男' : '女'}長者</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif; line-height: 1.7; color: #1e293b; background: #f8fafc; padding: 2rem; margin: 0; }
    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; padding: 2.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    .header { border-bottom: 2px solid #1e3a8a; padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .title { font-size: 1.75rem; font-weight: 800; color: #1e3a8a; margin: 0 0 0.5rem 0; }
    .meta { font-size: 0.9rem; color: #64748b; }
    .summary-card { background: ${riskBg}; border: 2px solid ${riskColor}; border-radius: 10px; padding: 1.5rem; margin: 1.5rem 0; display: flex; align-items: center; gap: 1.5rem; }
    .score-circle { width: 80px; height: 80px; border-radius: 50%; background: white; border: 4px solid ${riskColor}; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 900; color: ${riskColor}; font-size: 2rem; }
    .score-circle small { font-size: 0.75rem; font-weight: 600; }
    .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 700; font-size: 0.85rem; }
    .table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
    .table th, .table td { border: 1px solid #e2e8f0; padding: 0.75rem 1rem; text-align: left; }
    .table th { background: #f1f5f9; color: #1e3a8a; }
    .report-box { background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; font-size: 1rem; line-height: 1.8; white-space: pre-line; }
    .disclaimer { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 1rem; font-size: 0.85rem; color: #92400e; text-align: center; margin-top: 2rem; }
    @media print { body { background: white; padding: 0; } .container { box-shadow: none; border: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">AI 衰弱評估與客製化照護處方報告</h1>
      <div class="meta">
        評估日期：${evaluatedAt || new Date().toLocaleString('zh-TW')} | 臨床標準：Fried Frailty Phenotype (CHS)
      </div>
    </div>

    <h3>一、受試長者基本資料</h3>
    <table class="table">
      <tr>
        <th>年齡</th><td>${age ? `${age} 歲` : '未填'}</td>
        <th>生理性別</th><td>${gender === 'male' ? '男性' : gender === 'female' ? '女性' : '未填'}</td>
      </tr>
      <tr>
        <th>身高 / 體重</th><td>${height || '--'} cm / ${weight || '--'} kg</td>
        <th>BMI 指數</th><td>${bmi} kg/m²</td>
      </tr>
      ${clinicalNotes ? `<tr><th>臨床病史補充</th><td colspan="3">${clinicalNotes}</td></tr>` : ''}
    </table>

    <h3>二、衰弱綜合判定結果</h3>
    <div class="summary-card">
      <div class="score-circle">
        <span>${totalScore}</span>
        <small>分 / 5分</small>
      </div>
      <div>
        <h2 style="margin: 0 0 0.5rem 0; color: ${riskColor}; font-size: 1.4rem;">
          等級判定：${frailtyStatus}
        </h2>
        <p style="margin: 0; font-size: 0.95rem; color: #334155;">
          ${evaluationResults.clinicalMeaning}
        </p>
      </div>
    </div>

    <h3>三、Fried 五項表型實測給分</h3>
    <table class="table">
      <thead>
        <tr><th>評估指標</th><th>實測狀態與判定</th><th>得分</th></tr>
      </thead>
      <tbody>
        <tr><td>1. 非預期體重減輕</td><td>${results.weightLoss.detail}</td><td>${results.weightLoss.score} 分</td></tr>
        <tr><td>2. 自覺疲憊感</td><td>${results.exhaustion.detail}</td><td>${results.exhaustion.score} 分</td></tr>
        <tr><td>3. 身體活動量</td><td>${results.physicalActivity.detail}</td><td>${results.physicalActivity.score} 分</td></tr>
        <tr><td>4. 行走速度</td><td>${results.walkingSpeed.detail}</td><td>${results.walkingSpeed.score} 分</td></tr>
        <tr><td>5. 握力</td><td>${results.gripStrength.detail}</td><td>${results.gripStrength.score} 分</td></tr>
      </tbody>
    </table>

    ${aiReport?.content ? `
    <h3>四、AI 客製化周全性護理與生活處方（大語言模型生成）</h3>
    <div class="report-box">
${aiReport.content}
    </div>
    ` : ''}

    <div class="disclaimer">
      <strong>重要提示：</strong>本報告由「AI 衰弱評估系統」運算生成，僅供教學、臨床實習與長者健康促進參考，不可作為正式醫療處方。若長者身心機能有急性惡化，請諮詢老年醫學專科醫師。
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = `AI衰弱評估報告_${age || ''}歲${gender === 'male' ? '男' : '女'}長者_${new Date().toISOString().slice(0, 10)}.html`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 產生專門提供給 LINE / 家族群組 / 簡訊的純文字長者衰弱評估摘要
 */
export function formatLineShareMessage({ basicInfo, evaluationResults, aiReport, clinicalNotes }) {
  const { age, gender, height, weight } = basicInfo;
  const { totalScore, frailtyStatus, results, evaluatedAt } = evaluationResults;
  const bmi = weight && height ? (weight / Math.pow(height / 100, 2)).toFixed(1) : '--';

  const proteinLow = Math.round((weight || 60) * (totalScore >= 1 ? 1.2 : 1.0));
  const proteinHigh = Math.round((weight || 60) * (totalScore >= 3 ? 1.5 : (totalScore >= 1 ? 1.3 : 1.2)));
  const calories = Math.round((weight || 60) * 30);

  const positiveItems = Object.keys(results)
    .filter(k => results[k].isPositive)
    .map(k => results[k].title.split('(')[0].trim());

  const isUnableWalk = results.walkingSpeed?.detail?.includes('無法施測');
  const hasKneeOA = (clinicalNotes || '').includes('關節炎');
  const hasFallHistory = (clinicalNotes || '').includes('跌倒');

  return `👵【AI 長者衰弱評估與生活處方摘要】👴
評估日期：${evaluatedAt || new Date().toLocaleString('zh-TW')}
-----------------------------------------
👤 受試長者：${age || '--'} 歲 ${gender === 'male' ? '男性' : gender === 'female' ? '女性' : ''} (身高: ${height || '--'}cm / 體重: ${weight || '--'}kg / BMI: ${bmi})
📊 衰弱總分：${totalScore} / 5 分
🏷️ 判定等級：【${frailtyStatus}】

⚠️ 符合衰弱表型指標 (${positiveItems.length} 項)：
${positiveItems.length > 0 ? positiveItems.map((item, idx) => `  ${idx + 1}. ${item}`).join('\n') : '  • 無 (五大表型指標皆在正常範圍)'}

🍽️ 居家精準營養處方 (體重 ${weight || 60}kg 精算)：
• 每日蛋白質：建議 ${proteinLow} ~ ${proteinHigh} 公克 (每餐≥20g)
• 推薦優質食材：無糖濃豆漿(7g)、水煮蛋(7g)、清蒸魚/雞肉(20g)、板豆腐(14g)
• 每日總熱量：約 ${calories} 大卡
• 陽光骨力：每日早晚曬太陽 10~15 分鐘補充維生素 D3

🏃‍♂️ 居家保命運動與防跌守則：
${isUnableWalk ? `• 臥床/輪椅肢體活動：床上踝關節踩放15下、雙臂擴胸、輪椅定時臀部減壓。` :
  hasKneeOA ? `• 坐姿直膝抬腿 (不傷膝蓋)：抬平小腿5秒，換腳各10次，強化大腿股四頭肌。` :
  `• 安全扶椅起立 (防跌核心)：扶穩餐椅慢站慢坐，每日8~10次鍛鍊大腿肌力。`}
• 起床起身防跌三部曲：醒來躺30秒、坐床緣30秒、扶穩站好30秒再邁步。
${hasFallHistory ? '• 🚨 曾有跌倒病史！室內走動務必專人守候陪同，浴室加裝防滑扶手。' : '• 浴室鋪設防滑墊、夜間保留走道小夜燈、動線清除雜物電線。'}

📞 衛生福利部長照 2.0 專線：手機/市話直撥 1966
⚠️ 提醒：本摘要由 AI 衰弱評估系統產生，供居家照護參考，不可取代正式醫療診斷。`;
}

/**
 * 純文字直接複製至剪貼簿（保證複製完整文字內容，絕不夾帶或替換為網址）
 */
export async function copySummaryTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard 失敗，嘗試 fallback：', err);
    }
  }

  // 傳統相容性 Fallback
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error('複製至剪貼簿失敗：', err);
    return false;
  }
}

/**
 * 直接開啟 LINE 發送此文字訊息
 */
export function openLineDirectShare(text) {
  const encoded = encodeURIComponent(text);
  const lineUrl = `https://line.me/R/msg/text/?${encoded}`;
  window.open(lineUrl, '_blank');
}

