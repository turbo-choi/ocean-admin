/**
 * 최근 유저 활동 컴포넌트
 * API에서 최근 활동 데이터를 가져와 표시
 */
import React, { useEffect, useState } from 'react';
import { UserPlus, LogIn, FileText } from 'lucide-react';
import { getRecentActivities, RecentActivity as ActivityType } from '../api/dashboard';

/**
 * 활동 타입에 따른 아이콘 반환
 */
function getIcon(type: ActivityType['type']) {
  switch (type) {
    case 'user':
      return (
        <div className="size-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
          <UserPlus size={16} />
        </div>
      );
    case 'login':
      return (
        <div className="size-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0">
          <LogIn size={16} />
        </div>
      );
    case 'post':
      return (
        <div className="size-8 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
          <FileText size={16} />
        </div>
      );
  }
}

/**
 * 시간을 상대적 형식으로 변환
 * @param dateString ISO 날짜 문자열
 */
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR');
}

/**
 * 최근 활동 컴포넌트
 * - 유저 가입, 로그인, 게시글 작성 등의 활동을 시간순으로 표시
 */
export const RecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getRecentActivities(5);
        setActivities(data);
        setError(null);
      } catch (err) {
        setError('최근 활동을 불러오는데 실패했습니다.');
        console.error('최근 활동 로드 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 로딩 상태
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col animate-pulse">
        <h3 className="text-lg font-bold text-gray-900 mb-6">최근 활동</h3>
        <div className="flex flex-col gap-6 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="size-8 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-6">최근 활동</h3>
        <div className="flex-1 flex items-center justify-center text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <h3 className="text-lg font-bold text-gray-900 mb-6">최근 활동</h3>
      <div className="flex flex-col gap-6 flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            최근 활동이 없습니다.
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex gap-4 items-start">
              {getIcon(activity.type)}
              <div className="flex flex-col min-w-0">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{activity.userName}</span>
                  {' '}
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatTimeAgo(activity.activityAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      <button className="w-full mt-6 py-2.5 text-sm text-ocean-600 bg-ocean-50 hover:bg-ocean-100 font-medium rounded-lg transition-colors">
        모든 활동 보기
      </button>
    </div>
  );
};
