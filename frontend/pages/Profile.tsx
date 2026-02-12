/**
 * 내 정보 수정 페이지
 * 사용자 정보 표시 및 비밀번호 변경 기능
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { changePassword } from '../api/auth';

const Profile: React.FC = () => {
    const { user } = useAuth();

    // 비밀번호 변경 상태
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    /**
     * 비밀번호 변경 제출 핸들러
     */
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // 유효성 검사
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('모든 필드를 입력해주세요.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('새 비밀번호가 일치하지 않습니다.');
            return;
        }

        if (newPassword.length < 8) {
            setError('비밀번호는 8자 이상이어야 합니다.');
            return;
        }

        // 비밀번호 강도 검사
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            setError('비밀번호는 대소문자, 숫자, 특수문자(@$!%*?&)를 포함해야 합니다.');
            return;
        }

        setSubmitting(true);
        try {
            await changePassword(currentPassword, newPassword);
            setSuccess('비밀번호가 성공적으로 변경되었습니다.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* 헤더 */}
            <div className="flex items-center gap-4">
                <Link
                    to="/"
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    style={{ color: '#6b7280' }}
                >
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">내 정보 수정</h1>
            </div>

            {/* 사용자 정보 카드 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                        style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}
                    >
                        {user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                        <p className="text-gray-500">{user.email}</p>
                        <span
                            className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                                backgroundColor: user.role === 'admin' ? '#f3e8ff' : '#e0f2fe',
                                color: user.role === 'admin' ? '#7c3aed' : '#0284c7'
                            }}
                        >
                            {user.role === 'admin' ? '관리자' : '일반 사용자'}
                        </span>
                    </div>
                </div>

                {/* 계정 정보 */}
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <User size={18} style={{ color: '#6b7280' }} />
                        <div>
                            <p className="text-sm text-gray-500">이름</p>
                            <p className="font-medium text-gray-900">{user.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6b7280' }}>
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        <div>
                            <p className="text-sm text-gray-500">이메일</p>
                            <p className="font-medium text-gray-900">{user.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 비밀번호 변경 카드 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <Lock size={20} style={{ color: '#0284c7' }} />
                    <h3 className="text-lg font-bold text-gray-900">비밀번호 변경</h3>
                </div>

                <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                    {/* 에러/성공 메시지 */}
                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm">
                            {success}
                        </div>
                    )}

                    {/* 현재 비밀번호 */}
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            현재 비밀번호
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                id="currentPassword"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="현재 비밀번호를 입력하세요"
                                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* 새 비밀번호 */}
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            새 비밀번호
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="새 비밀번호를 입력하세요"
                                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            8자 이상, 대소문자, 숫자, 특수문자(@$!%*?&) 포함
                        </p>
                    </div>

                    {/* 비밀번호 확인 */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            새 비밀번호 확인
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="새 비밀번호를 다시 입력하세요"
                                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* 버튼 */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-ocean flex items-center gap-2 px-6 py-3 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                            style={{ backgroundColor: '#0da2e7' }}
                        >
                            <Save size={16} />
                            {submitting ? '변경 중...' : '비밀번호 변경'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
