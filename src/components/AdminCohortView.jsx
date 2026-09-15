import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Users,
  Calendar,
  FileText,
  Activity,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  RefreshCw,
  Clock,
  ChevronRight
} from 'lucide-react';
import { fetchAllCohortCases, generateMockTrackingData } from '../services/trackingService.js';

export default function AdminCohortView({
  onSelectSubject,
  onSwitchToTracking
}) {
  const [cases, setCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  const loadAllCases = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllCohortCases(searchQuery);
      setCases(data);
    } catch (err) {
      console.error('載入個案清單失敗：', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllCases();
  }, [searchQuery]);

  // 為系統快速生成多位示範受試者
  const handleSeedMultipleCases = () => {
    generateMockTrackingData('SUBJ-2026-001');
    generateMockTrackingData('SUBJ-2026-002');
    generateMockTrackingData('SUBJ-2026-003');
    loadAllCases();
  };

  const totalRecordsCount = cases.reduce((sum, c) => sum + c.recordCount, 0);

  return (
    <div className="section-card" style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* 標頭 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        paddingBottom: '1.25rem',
        borderBottom: '1.5px solid #e2e8f0',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2.75rem',
            height: '2.75rem',
            borderRadius: '10px',
            backgroundColor: '#4f46e5',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              研究管理者後台：受試者個案檢索中心
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
              具備跨個案檢索與族群統計權限，可依研究編號搜尋並調閱各受試者之完整追蹤軌跡
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadAllCases}
            title="重新整理個案列表"
          >
            <RefreshCw size={14} />
            <span>重新整理</span>
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleSeedMultipleCases}
            title="一鍵注入 3 位模擬個案的多期追蹤資料"
          >
            <Sparkles size={14} color="#4f46e5" />
            <span>注入 3 位示範個案</span>
          </button>
        </div>
      </div>

      {/* 族群概況統計卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '8px',
            backgroundColor: '#ede9fe',
            color: '#6d28d9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>列管受試者總數</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{cases.length} 人</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '8px',
            backgroundColor: '#e0f2fe',
            color: '#0369a1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>累積追蹤評估筆數</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{totalRecordsCount} 筆</div>
          </div>
        </div>
      </div>

      {/* 搜尋列 */}
      <div style={{
        marginBottom: '1.5rem',
        position: 'relative',
        maxWidth: '480px'
      }}>
        <label htmlFor="search-subject-id" style={{ display: 'none' }}>搜尋研究編號</label>
        <Search
          size={18}
          color="#94a3b8"
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          id="search-subject-id"
          type="text"
          className="form-input"
          style={{ paddingLeft: '2.5rem' }}
          placeholder="依研究編號快速搜尋（例如：SUBJ-001 或 A102）..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 個案列表 */}
      {cases.length === 0 ? (
        <div style={{
          backgroundColor: '#f8fafc',
          border: '2px dashed #cbd5e1',
          borderRadius: '10px',
          padding: '2.5rem 1rem',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <Users size={36} style={{ margin: '0 auto 0.5rem auto', color: '#94a3b8' }} />
          <p style={{ margin: 0, fontWeight: 600 }}>
            {searchQuery ? `查無符合「${searchQuery}」之受試者編號` : '目前資料庫中尚無受試者評估紀錄'}
          </p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ marginTop: '1rem' }}
            onClick={handleSeedMultipleCases}
          >
            <Sparkles size={14} />
            <span>點此一鍵注入示範個案資料</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {cases.map((c) => {
            const statusClass = c.latestScore === 0
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : c.latestScore <= 2
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-rose-100 text-rose-800 border-rose-300';

            return (
              <div
                key={c.subjectId}
                style={{
                  backgroundColor: 'white',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1.125rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  transition: 'all 0.15s ease-in-out'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 280px' }}>
                  <div style={{
                    width: '2.75rem',
                    height: '2.75rem',
                    borderRadius: '50%',
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: '#1e3a8a',
                    fontSize: '0.9rem'
                  }}>
                    {c.subjectId.slice(0, 4)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>
                        {c.subjectId}
                      </strong>
                      <span className={`case-tag ${statusClass}`} style={{ fontSize: '0.75rem' }}>
                        {c.latestStatus}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>
                      已完成 <strong>{c.recordCount}</strong> 次評估 | 最近評估：{c.latestDate}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>最新總分</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {c.latestScore} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/ 5分</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      onSelectSubject(c.subjectId);
                      onSwitchToTracking();
                    }}
                    title={`檢視 ${c.subjectId} 之長期追蹤折線圖`}
                  >
                    <span>檢視縱向趨勢</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
