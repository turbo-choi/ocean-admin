/**
 * 회원관리 페이지 (관리자 전용)
 */
import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, User, Trash2, Edit2, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { getUsers, updateUser, deleteUser, User as UserType, UserRole } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

const UserList: React.FC = () => {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editRole, setEditRole] = useState<UserRole>('user');

    // 회원 목록 로드
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await getUsers(page, 10, search);
            setUsers(response.data);
            setTotalPages(response.totalPages);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : '회원 목록을 불러올 수 없습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, search]);

    // 검색
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setSearch(searchInput);
    };

    // 수정 모드 시작
    const startEdit = (user: UserType) => {
        setEditingId(user.id);
        setEditName(user.name);
        setEditRole(user.role);
    };

    // 수정 취소
    const cancelEdit = () => {
        setEditingId(null);
    };

    // 수정 저장
    const saveEdit = async (id: number) => {
        try {
            const updated = await updateUser(id, { name: editName, role: editRole });
            setUsers((currentUsers) =>
                currentUsers.map((user) => (user.id === id ? updated : user))
            );
            setEditingId(null);
        } catch (err) {
            alert(err instanceof Error ? err.message : '수정에 실패했습니다.');
        }
    };

    // 삭제
    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`"${name}" 회원을 삭제하시겠습니까?`)) return;
        try {
            await deleteUser(id);
            setUsers((currentUsers) => currentUsers.filter((user) => user.id !== id));
        } catch (err) {
            alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
        }
    };

    // 날짜 포맷
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });
    };

    if (!isAdmin) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <Shield className="text-gray-300 mx-auto mb-4" size={48} />
                <h2 className="text-lg font-bold text-gray-700 mb-2">접근 권한이 없습니다</h2>
                <p className="text-gray-500">이 페이지는 관리자만 접근할 수 있습니다.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* 헤더 */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Users className="text-ocean-500" size={24} />
                        <h1 className="text-xl font-bold text-gray-900">회원 관리</h1>
                    </div>
                </div>

                {/* 검색 */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="이메일 또는 이름 검색..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn-ocean px-4 py-2 bg-ocean-500 hover:bg-ocean-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-ocean-500/30"
                    >
                        검색
                    </button>
                </form>
            </div>

            {/* 에러 */}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* 테이블 */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 text-gray-600 text-sm">
                        <tr>
                            <th className="px-6 py-3 text-left font-medium">이름</th>
                            <th className="px-6 py-3 text-left font-medium">이메일</th>
                            <th className="px-6 py-3 text-left font-medium">역할</th>
                            <th className="px-6 py-3 text-left font-medium">가입일</th>
                            <th className="px-6 py-3 text-left font-medium">마지막 로그인</th>
                            <th className="px-6 py-3 text-center font-medium">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    로딩 중...
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    회원이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        {editingId === user.id ? (
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="px-2 py-1 bg-white border border-gray-200 rounded text-sm w-24"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-ocean-100 text-ocean-600 flex items-center justify-center text-xs font-bold">
                                                    {user.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-900">{user.name}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-sm">{user.email}</td>
                                    <td className="px-6 py-4">
                                        {editingId === user.id ? (
                                            <select
                                                value={editRole}
                                                onChange={(e) => setEditRole(e.target.value as UserRole)}
                                                className="px-2 py-1 bg-white border border-gray-200 rounded text-sm"
                                            >
                                                <option value="user">일반 사용자</option>
                                                <option value="admin">관리자</option>
                                            </select>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {user.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                                                {user.role === 'admin' ? '관리자' : '사용자'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">{formatDate(user.createdAt)}</td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">{formatDate(user.lastLoginAt)}</td>
                                    <td className="px-6 py-4 text-center">
                                        {editingId === user.id ? (
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => saveEdit(user.id)}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => startEdit(user)}
                                                    className="p-1.5 text-gray-400 hover:text-ocean-500 hover:bg-gray-100 rounded transition-colors"
                                                    title="수정"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id, user.name)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded transition-colors"
                                                    title="삭제"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm text-gray-600">
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserList;
