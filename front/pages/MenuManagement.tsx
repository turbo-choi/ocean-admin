/**
 * 메뉴 관리 페이지
 * 관리자 전용 - 메뉴 추가/수정/삭제
 */
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, GripVertical } from 'lucide-react';
import { getAllMenus, createMenu, updateMenu, deleteMenu, Menu, MenuRequest } from '../api/menu';
import { getBoardTypes, BoardType } from '../api/boardType';

const MenuManagement: React.FC = () => {
    const [menus, setMenus] = useState<Menu[]>([]);
    const [boardTypes, setBoardTypes] = useState<BoardType[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState<MenuRequest>({
        title: '',
        icon: '',
        linkType: 'route',
        linkValue: '',
        sortOrder: 0,
        isAdminOnly: false,
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // 메뉴 및 게시판 유형 로드
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [menuData, boardTypeData] = await Promise.all([
                getAllMenus(),
                getBoardTypes(),
            ]);
            setMenus(menuData);
            setBoardTypes(boardTypeData);
        } catch (err) {
            setError(err instanceof Error ? err.message : '데이터 로드 실패');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 폼 초기화
     */
    const resetForm = () => {
        setFormData({
            title: '',
            icon: '',
            linkType: 'route',
            linkValue: '',
            sortOrder: menus.length > 0 ? Math.max(...menus.map(m => m.sortOrder)) + 1 : 1,
            isAdminOnly: false,
        });
        setEditingId(null);
        setShowAddForm(false);
    };

    /**
     * 메뉴 추가
     */
    const handleAdd = async () => {
        if (!formData.title) {
            setError('메뉴명을 입력해주세요.');
            return;
        }
        try {
            await createMenu(formData);
            setSuccess('메뉴가 추가되었습니다.');
            resetForm();
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : '메뉴 추가 실패');
        }
    };

    /**
     * 메뉴 수정
     */
    const handleUpdate = async () => {
        if (!editingId || !formData.title) return;
        try {
            await updateMenu(editingId, formData);
            setSuccess('메뉴가 수정되었습니다.');
            resetForm();
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : '메뉴 수정 실패');
        }
    };

    /**
     * 메뉴 삭제
     */
    const handleDelete = async (id: number) => {
        if (!confirm('이 메뉴를 삭제하시겠습니까?')) return;
        try {
            await deleteMenu(id);
            setSuccess('메뉴가 삭제되었습니다.');
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : '메뉴 삭제 실패');
        }
    };

    /**
     * 편집 모드 시작
     */
    const startEdit = (menu: Menu) => {
        setEditingId(menu.id);
        setFormData({
            title: menu.title,
            icon: menu.icon || '',
            linkType: menu.linkType,
            linkValue: menu.linkValue || '',
            sortOrder: menu.sortOrder,
            isAdminOnly: menu.isAdminOnly,
        });
        setShowAddForm(false);
    };

    // 메시지 자동 숨김
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">메뉴 관리</h1>
                    <p className="text-gray-500 mt-1">사이드바에 표시되는 메뉴를 관리합니다.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({
                            title: '',
                            icon: '',
                            linkType: 'route',
                            linkValue: '',
                            sortOrder: menus.length > 0 ? Math.max(...menus.map(m => m.sortOrder)) + 1 : 1,
                            isAdminOnly: false,
                        });
                        setShowAddForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
                    style={{ backgroundColor: '#0da2e7' }}
                >
                    <Plus size={18} />
                    메뉴 추가
                </button>
            </div>

            {/* 알림 메시지 */}
            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
            )}
            {success && (
                <div className="p-4 bg-green-50 text-green-700 rounded-lg">{success}</div>
            )}

            {/* 추가 폼 */}
            {showAddForm && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">새 메뉴 추가</h3>
                    <MenuForm
                        formData={formData}
                        setFormData={setFormData}
                        boardTypes={boardTypes}
                        onSubmit={handleAdd}
                        onCancel={resetForm}
                        submitLabel="추가"
                    />
                </div>
            )}

            {/* 메뉴 목록 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                            <th className="p-4 w-12"></th>
                            <th className="p-4 text-left">메뉴명</th>
                            <th className="p-4 text-left">아이콘</th>
                            <th className="p-4 text-left">유형</th>
                            <th className="p-4 text-left">링크</th>
                            <th className="p-4 text-center w-20">순서</th>
                            <th className="p-4 text-center w-24">관리자</th>
                            <th className="p-4 text-center w-28">작업</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-100">
                        {menus.map(menu => (
                            <React.Fragment key={menu.id}>
                                {editingId === menu.id ? (
                                    <tr className="bg-ocean-50">
                                        <td colSpan={8} className="p-4">
                                            <MenuForm
                                                formData={formData}
                                                setFormData={setFormData}
                                                boardTypes={boardTypes}
                                                onSubmit={handleUpdate}
                                                onCancel={resetForm}
                                                submitLabel="저장"
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    <tr className="hover:bg-gray-50">
                                        <td className="p-4 text-center text-gray-400">
                                            <GripVertical size={16} />
                                        </td>
                                        <td className="p-4 font-medium text-gray-900">{menu.title}</td>
                                        <td className="p-4 text-gray-500">{menu.icon || '-'}</td>
                                        <td className="p-4 text-gray-500">
                                            {menu.linkType === 'route' ? '라우트' : menu.linkType === 'board' ? '게시판' : '외부'}
                                        </td>
                                        <td className="p-4 text-gray-500 font-mono text-xs">{menu.linkValue || '-'}</td>
                                        <td className="p-4 text-center text-gray-500">{menu.sortOrder}</td>
                                        <td className="p-4 text-center">
                                            {menu.isAdminOnly ? (
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">관리자</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">전체</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => startEdit(menu)}
                                                    className="p-1.5 text-gray-500 hover:text-ocean-500 hover:bg-gray-100 rounded transition-colors"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(menu.id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

/** 메뉴 폼 컴포넌트 */
interface MenuFormProps {
    formData: MenuRequest;
    setFormData: React.Dispatch<React.SetStateAction<MenuRequest>>;
    boardTypes: BoardType[];
    onSubmit: () => void;
    onCancel: () => void;
    submitLabel: string;
}

const MenuForm: React.FC<MenuFormProps> = ({ formData, setFormData, boardTypes, onSubmit, onCancel, submitLabel }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">메뉴명 *</label>
                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 outline-none"
                    placeholder="메뉴명"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">아이콘</label>
                <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 outline-none"
                    placeholder="FileText"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
                <select
                    value={formData.linkType}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkType: e.target.value as any, linkValue: '' }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 outline-none"
                >
                    <option value="route">라우트</option>
                    <option value="board">게시판</option>
                    <option value="external">외부링크</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">링크</label>
                {formData.linkType === 'board' ? (
                    <select
                        value={formData.linkValue}
                        onChange={(e) => setFormData(prev => ({ ...prev, linkValue: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 outline-none"
                    >
                        <option value="">선택</option>
                        {boardTypes.map(bt => (
                            <option key={bt.id} value={bt.slug}>{bt.name}</option>
                        ))}
                    </select>
                ) : (
                    <input
                        type="text"
                        value={formData.linkValue}
                        onChange={(e) => setFormData(prev => ({ ...prev, linkValue: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 outline-none"
                        placeholder={formData.linkType === 'route' ? '/path' : 'https://...'}
                    />
                )}
            </div>
            <div className="flex items-end gap-2">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">순서</label>
                    <input
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 outline-none"
                    />
                </div>
                <label className="flex items-center gap-2 pb-2">
                    <input
                        type="checkbox"
                        checked={formData.isAdminOnly}
                        onChange={(e) => setFormData(prev => ({ ...prev, isAdminOnly: e.target.checked }))}
                        className="w-4 h-4 text-ocean-500 rounded"
                    />
                    <span className="text-sm text-gray-600">관리자</span>
                </label>
            </div>
            <div className="md:col-span-6 flex justify-end gap-2">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <X size={16} className="inline mr-1" />
                    취소
                </button>
                <button
                    onClick={onSubmit}
                    className="px-4 py-2 text-white rounded-lg transition-colors"
                    style={{ backgroundColor: '#0da2e7' }}
                >
                    <Save size={16} className="inline mr-1" />
                    {submitLabel}
                </button>
            </div>
        </div>
    );
};

export default MenuManagement;
