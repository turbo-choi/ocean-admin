/**
 * 게시글 통계 차트 컴포넌트
 * 월별 일별 게시글 및 댓글 수를 차트로 표시
 * 이전/다음 달 전환 기능 포함
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPostChartData, ChartResponse } from '../api/dashboard';

// 한국어 월 이름
const MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월'
];

/**
 * 게시글 통계 차트
 * - 일별 게시글 수를 막대 그래프로 시각화
 * - 이전/다음 달 전환 기능
 * - 오늘 날짜는 강조 표시
 */
export const PostChart: React.FC = () => {
  const [chartData, setChartData] = useState<ChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);

  // 오늘 날짜 (비교용)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  /**
   * 데이터 로드 함수
   */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPostChartData(currentYear, currentMonth);
      setChartData(data);
    } catch (err) {
      setError('차트 데이터를 불러오는데 실패했습니다.');
      console.error('차트 데이터 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * 이전 달로 이동
   */
  const goToPrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(prev => prev - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  /**
   * 다음 달로 이동
   */
  const goToNextMonth = () => {
    const now = new Date();
    const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1;

    // 미래 달로는 이동 불가
    if (isCurrentMonth) return;

    if (currentMonth === 12) {
      setCurrentYear(prev => prev + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  /**
   * 이번 달인지 확인
   */
  const isCurrentMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1;

  // 로딩 상태
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full min-h-[300px] animate-pulse flex items-center justify-center">
        <div className="text-gray-400">차트 로딩 중...</div>
      </div>
    );
  }

  // 에러 상태
  if (error || !chartData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full min-h-[300px] flex items-center justify-center">
        <div className="text-red-500">{error || '데이터 없음'}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">게시글 통계</h3>
          <p className="text-sm text-gray-500">일별 게시글 작성 수</p>
        </div>

        {/* 월 선택 컨트롤 */}
        <div className="flex items-center gap-2">
          {/* 이전 달 버튼 */}
          <button
            onClick={goToPrevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            title="이전 달"
          >
            <ChevronLeft size={20} />
          </button>

          {/* 현재 월 표시 */}
          <div className="min-w-[100px] text-center">
            <span className="font-semibold text-gray-900">
              {currentYear}년 {MONTH_NAMES[currentMonth - 1]}
            </span>
          </div>

          {/* 다음 달 버튼 */}
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className={`p-1.5 rounded-lg transition-colors ${isCurrentMonth
                ? 'text-gray-300 cursor-not-allowed'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            title={isCurrentMonth ? '이번 달입니다' : '다음 달'}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-ocean-500"></span>
          <span className="text-gray-500">오늘</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-ocean-200"></span>
          <span className="text-gray-500">다른 날</span>
        </div>
      </div>

      {/* 차트 */}
      <div className="flex-1 w-full min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData.data}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              dy={10}
              interval={Math.floor(chartData.daysInMonth / 10)}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              width={30}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
              itemStyle={{ color: '#fff' }}
              formatter={(value: number, name: string) => [
                `${value}건`,
                name === 'boardCount' ? '게시글' : '댓글'
              ]}
              labelFormatter={(day) => `${currentMonth}월 ${day}일`}
            />
            <Bar
              dataKey="boardCount"
              radius={[3, 3, 0, 0]}
              name="게시글"
              maxBarSize={20}
            >
              {chartData.data.map((entry) => (
                <Cell
                  key={`cell-${entry.day}`}
                  fill={entry.date === todayStr ? '#0da2e7' : '#bae6fd'}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 통계 요약 */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
        <div className="text-gray-500">
          총 <span className="font-semibold text-gray-900">
            {chartData.data.reduce((sum, d) => sum + d.boardCount, 0)}
          </span>개 게시글
        </div>
        <div className="text-gray-500">
          총 <span className="font-semibold text-gray-900">
            {chartData.data.reduce((sum, d) => sum + d.commentCount, 0)}
          </span>개 댓글
        </div>
      </div>
    </div>
  );
};

// 기존 컴포넌트 export 유지 (레거시 지원)
export const RevenueChart = PostChart;
