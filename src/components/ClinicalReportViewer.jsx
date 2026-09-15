import React from 'react';
import {
  Stethoscope,
  AlertTriangle,
  Apple,
  Dumbbell,
  ShieldCheck,
  Activity,
  CheckCircle2,
  FileText
} from 'lucide-react';

/**
 * 醫護專業報告渲染器
 * 將 raw markdown (包含 ###, **, •, * 等符號) 徹底解析為無雜訊符號、排版嚴謹的結構化卡片
 */
export default function ClinicalReportViewer({ content }) {
  if (!content) return null;

  // 將內容依照章節標題 (#, ##, ### 等) 切割
  const rawSections = content.split(/\n?(?:#{1,4}\s+)/);

  const sections = rawSections
    .filter(s => s.trim().length > 0)
    .map(sec => {
      const lines = sec.trim().split('\n');
      // 清除標題可能帶有的數字、# 與星號
      const titleLine = lines[0]
        .replace(/^[0-9.]+\s*/, '')
        .replace(/[#\*]/g, '')
        .trim();
      const bodyLines = lines.slice(1);

      // 解析 bodyLines
      const parsedItems = [];
      let currentItem = null;

      bodyLines.forEach(line => {
        let trimmed = line.trim();
        if (!trimmed) return;
        // 過濾水平分割線
        if (/^[-*_]{3,}$/.test(trimmed)) return;

        // 主項目：• **標題**：內容 或 **標題**：內容 或 - **標題**
        if (
          trimmed.startsWith('•') ||
          trimmed.startsWith('-') ||
          trimmed.startsWith('* **') ||
          trimmed.startsWith('**') ||
          /^[0-9]+\.\s+\*\*/.test(trimmed)
        ) {
          let cleanLine = trimmed
            .replace(/^[0-9]+\.\s*/, '')
            .replace(/^[•\-\*]\s*/, '');
          
          // 擷取 **bold label**
          const boldMatch = cleanLine.match(/^\*\*(.*?)\*\*[:：]?\s*(.*)$/);
          if (boldMatch) {
            currentItem = {
              type: 'main',
              label: boldMatch[1].trim(),
              text: boldMatch[2].replace(/\*\*/g, '').replace(/\*/g, '').trim(),
              subItems: []
            };
            parsedItems.push(currentItem);
          } else {
            currentItem = {
              type: 'main',
              label: '',
              text: cleanLine.replace(/\*\*/g, '').replace(/\*/g, '').trim(),
              subItems: []
            };
            parsedItems.push(currentItem);
          }
        } else if (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•') || /^[0-9]+\.\s+/.test(trimmed)) {
          // 次項目 (sub-item)
          const subText = trimmed
            .replace(/^[0-9]+\.\s*/, '')
            .replace(/^[\*\-•]\s*/, '')
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .trim();
          
          if (currentItem) {
            currentItem.subItems.push(subText);
          } else {
            currentItem = {
              type: 'sub',
              label: '',
              text: subText,
              subItems: []
            };
            parsedItems.push(currentItem);
          }
        } else {
          // 普通文字段落
          const cleanText = trimmed.replace(/\*\*/g, '').replace(/\*/g, '');
          if (currentItem) {
            currentItem.subItems.push(cleanText);
          } else {
            currentItem = {
              type: 'text',
              label: '',
              text: cleanText,
              subItems: []
            };
            parsedItems.push(currentItem);
          }
        }
      });

      return {
        title: titleLine,
        items: parsedItems
      };
    });

  // 對應章節之圖示
  const getSectionIcon = (title) => {
    if (title.includes('生理病理') || title.includes('表型')) return <Activity size={20} color="#1d4ed8" />;
    if (title.includes('風險量化') || title.includes('預測')) return <AlertTriangle size={20} color="#b45309" />;
    if (title.includes('營養') || title.includes('蛋白質')) return <Apple size={20} color="#059669" />;
    if (title.includes('運動') || title.includes('復能')) return <Dumbbell size={20} color="#7c3aed" />;
    if (title.includes('護理') || title.includes('照會')) return <ShieldCheck size={20} color="#0284c7" />;
    return <FileText size={20} color="#1e3a8a" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
      {sections.map((sec, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: 'white',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          {/* 章節標題 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            paddingBottom: '0.75rem',
            marginBottom: '0.875rem',
            borderBottom: '1.5px solid #f1f5f9'
          }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '6px',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e2e8f0'
            }}>
              {getSectionIcon(sec.title)}
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
              {sec.title}
            </h4>
          </div>

          {/* 內容清單 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sec.items.map((item, itemIdx) => (
              <div key={itemIdx} style={{ fontSize: '0.925rem', lineHeight: '1.7', color: '#334155' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    marginTop: '0.65rem',
                    flexShrink: 0
                  }} />
                  <div>
                    {item.label && (
                      <strong style={{ color: '#0f172a', marginRight: '0.35rem' }}>
                        {item.label}：
                      </strong>
                    )}
                    <span>{item.text}</span>
                  </div>
                </div>

                {/* 次級清單項目 */}
                {item.subItems && item.subItems.length > 0 && (
                  <div style={{
                    marginLeft: '1.5rem',
                    marginTop: '0.35rem',
                    paddingLeft: '0.75rem',
                    borderLeft: '2px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}>
                    {item.subItems.map((sub, sIdx) => {
                      const colonIdx = sub.indexOf('：') !== -1 ? sub.indexOf('：') : sub.indexOf(':');
                      if (colonIdx > 0 && colonIdx < 25) {
                        const subLabel = sub.slice(0, colonIdx).trim();
                        const subVal = sub.slice(colonIdx + 1).trim();
                        return (
                          <div key={sIdx} style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6' }}>
                            <span style={{ color: '#0284c7', marginRight: '0.35rem' }}>▸</span>
                            <strong style={{ color: '#1e293b' }}>{subLabel}：</strong>
                            <span>{subVal}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={sIdx} style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6' }}>
                          <span style={{ color: '#0284c7', marginRight: '0.35rem' }}>▸</span>
                          <span>{sub}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
