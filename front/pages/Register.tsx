/**
 * 회원가입 페이지
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Waves, Mail, Lock, User, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { register } from '../api/auth';

const Register: React.FC = () => {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // 유효성 검사
        if (!name || !email || !password || !confirmPassword) {
            setError('모든 필드를 입력해주세요.');
            return;
        }

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        setLoading(true);
        try {
            await register(email, password, name);
            navigate('/login', {
                replace: true,
                state: { message: '회원가입이 완료되었습니다. 로그인해주세요.' }
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 비밀번호 강도 체크
    const passwordChecks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[@$!%*?&]/.test(password),
    };
    const isPasswordValid = Object.values(passwordChecks).every(Boolean);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* 로고 */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ocean-500/20 text-ocean-400 mb-4">
                        <Waves size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">회원가입</h1>
                    <p className="text-gray-400 mt-1">Ocean Admin 계정을 만드세요</p>
                </div>

                {/* 회원가입 폼 */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* 에러 메시지 */}
                        {error && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {/* 이름 */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                이름
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <User size={18} />
                                </span>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="홍길동"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all outline-none"
                                    maxLength={50}
                                />
                            </div>
                        </div>

                        {/* 이메일 */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                이메일
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Mail size={18} />
                                </span>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@email.com"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* 비밀번호 */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                비밀번호
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Lock size={18} />
                                </span>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all outline-none"
                                />
                            </div>
                            {/* 비밀번호 강도 표시 */}
                            {password && (
                                <div className="mt-2 space-y-1 text-xs">
                                    <PasswordCheck valid={passwordChecks.length} text="8자 이상" />
                                    <PasswordCheck valid={passwordChecks.uppercase} text="대문자 포함" />
                                    <PasswordCheck valid={passwordChecks.lowercase} text="소문자 포함" />
                                    <PasswordCheck valid={passwordChecks.number} text="숫자 포함" />
                                    <PasswordCheck valid={passwordChecks.special} text="특수문자(@$!%*?&) 포함" />
                                </div>
                            )}
                        </div>

                        {/* 비밀번호 확인 */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                비밀번호 확인
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Lock size={18} />
                                </span>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all outline-none"
                                />
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
                            )}
                        </div>

                        {/* 회원가입 버튼 */}
                        <button
                            type="submit"
                            disabled={loading || !isPasswordValid}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-ocean-500 hover:bg-ocean-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-ocean-500/30 disabled:opacity-50"
                        >
                            <UserPlus size={18} />
                            {loading ? '처리 중...' : '회원가입'}
                        </button>
                    </form>

                    {/* 로그인 링크 */}
                    <div className="mt-6 text-center text-sm text-gray-500">
                        이미 계정이 있으신가요?{' '}
                        <Link to="/login" className="text-ocean-600 hover:text-ocean-700 font-medium">
                            로그인
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

/** 비밀번호 체크 아이템 */
function PasswordCheck({ valid, text }: { valid: boolean; text: string }) {
    return (
        <div className={`flex items-center gap-1.5 ${valid ? 'text-green-600' : 'text-gray-400'}`}>
            <CheckCircle size={12} />
            {text}
        </div>
    );
}

export default Register;
