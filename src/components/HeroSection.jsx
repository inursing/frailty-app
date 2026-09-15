import React from 'react';
import { ArrowDown, AlertTriangle, Sparkles, BookOpen, Bot } from 'lucide-react';

export default function HeroSection({ onStartAssessment, onOpenLogicModal, onOpenApiKeyModal }) {
  return (
    <section className="hero-section">
      <div className="hero-badge">
        <Sparkles size={14} />
        <span>護理臨床教學 • LLM 客製化深度評估</span>
      </div>

      <h1 className="hero-title">
        AI 衰弱評估系統
      </h1>

      <p className="hero-desc">
        專為護理教育與臨床長者照護設計。結合 <strong>Fried Frailty Phenotype (弗里德衰弱表型)</strong> 五項客觀指標與 <strong>大語言模型 (LLM)</strong>，針對個別長者之年齡、體重、步速、握力及臨床共病，<strong>量身生成專屬的生理病理剖析、精準營養蛋白質熱量目標與居家漸進式運動復能處方</strong>。
      </p>

      <div className="hero-disclaimer-box" role="alert">
        <AlertTriangle size={22} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div className="hero-disclaimer-text">
          <strong>教學與篩檢聲明：</strong>
          本系統為護理教學與初步篩檢輔助工具，<strong>不可取代專業醫師或跨專業醫療團隊之正式診斷</strong>。
          所有評估與 AI 分析完全於瀏覽器端執行運算，保障個案資訊隱私。
        </div>
      </div>

      <div className="hero-actions">
        <button
          type="button"
          id="btn-start-assessment"
          className="btn btn-primary btn-lg"
          onClick={onStartAssessment}
        >
          <ArrowDown size={20} />
          <span>填寫客製資料並開始評估</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-lg"
          onClick={onOpenApiKeyModal}
        >
          <Bot size={20} />
          <span>AI 模型設定</span>
        </button>

        <button
          type="button"
          className="btn btn-outline btn-lg"
          onClick={onOpenLogicModal}
        >
          <BookOpen size={20} />
          <span>評估切點邏輯</span>
        </button>
      </div>
    </section>
  );
}
