/**
 * 게시판 유형 관리 페이지
 * 관리자 전용 - 게시판 추가/수정/삭제
 */
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Layers, FileText } from 'lucide-react';
import { getBoardTypes, createBoardType, updateBoardType, deleteBoardType, BoardType, BoardTypeRequest } from '../api/boardType';

const BoardTypeManagement: React.FC = () => {
    const [boardTypes, setBoardTypes] = useState<BoardType[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState<BoardTypeRequest>({
        name: '',
        slug: '',
        description: '',
        isCommentEnabled: true,
        isAnonymous: false,
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // 게시판 유형 로드
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getBoardTypes();
            setBoardTypes(data);
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
            name: '',
            slug: '',
            description: '',
            isCommentEnabled: true,
            isAnonymous: false,
        });
        setEditingId(null);
        setShowAddForm(false);
    };

    /**
     * slug 자동 생성
     */
    const generateSlug = (name: string) => {
        // 간단한 slug 생성 (한글 제거, 소문자 변환)
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    };

    /**
     * 게시판 추가
     */
    const handleAdd = async () => {
        if (!formData.name || !formData.slug) {
            setError('게시판 이름과 URL 경로를 입력해주세요.');
            return;
        }
        try {
            await createBoardType(formData);
            setSuccess('게시판이 생성되었습니다.');
            resetForm();
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : '게시판 생성 실패');
        }
    };

    /**
     * 게시판 수정
     */
    const handleUpdate = async () => {
        if (!editingId || !formData.name) return;
        try {
            await updateBoardType(editingId, formData);
            setSuccess('게시판이 수정되었습니다.');
            resetForm();
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : '게시판 수정 실패');
        }
    };

    /**
     * 게시판 삭제
     */
    const handleDelete = async (id: number) => {
        if (!confirm('이 게시판을 삭제하시겠습니까? 게시판에 글이 있으면 삭제할 수 없습니다.')) return;
        try {
            await deleteBoardType(id);
            setSuccess('게시판이 삭제되었습니다.');
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : '게시판 삭제 실패');
        }
    };

    /**
     * 편집 모드 시작
     */
    const startEdit = (bt: BoardType) => {
        setEditingId(bt.id);
        setFormData({
            name: bt.name,
            slug: bt.slug,
            description: bt.description || '',
            isCommentEnabled: bt.isCommentEnabled,
            isAnonymous: bt.isAnonymous,
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
                    <h1 className="text-2xl font-bold text-gray-900">게시판 관리</h1>
                    <p className="text-gray-500 mt-1">게시판을 생성하고 관리합니다.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({
                            name: '',
                            slug: '',
                            description: '',
                            isCommentEnabled: true,
                            isAnonymous: false,
                        });
                        setShowAddForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
                    style={{ backgroundColor: '#0da2e7' }}
                >
                    <Plus size={18} />
                    게시판 추가
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
                    <h3 className="text-lg font-bold text-gray-900 mb-4">새 게시판 추가</h3>
                    <BoardTypeForm
                        formData={formData}
                        setFormData={setFormData}
                        generateSlug={generateSlug}
                        onSubmit={handleAdd}
                        onCancel={resetForm}
                        submitLabel="추가"
                        isNew={true}
                    />
                </div>
            )}

            {/* 게시판 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boardTypes.map(bt => (
                    <div key={bt.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {editingId === bt.id ? (
                            <div className="p-6">
                                <BoardTypeForm
                                    formData={formData}
                                    setFormData={setFormData}
                                    generateSlug={generateSlug}
                                    onSubmit={handleUpdate}
                                    onCancel={resetForm}
                                    submitLabel="저장"
                                    isNew={false}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e0f4ff' }}>
                                                <Layers size={20} style={{ color: '#0da2e7' }} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{bt.name}</h3>
                                                <p className="text-sm text-gray-500 font-mono">/board/{bt.slug}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => startEdit(bt)}
                                                className="p-1.5 text-gray-500 hover:text-ocean-500 hover:bg-gray-100 rounded transition-colors"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(bt.id)}
                                                className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {bt.description && (
                                        <p className="text-sm text-gray-600 mt-3">{bt.description}</p>
                                    )}
                                </div>
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-1 text-gray-500">
                                            <FileText size={14} />
                                            {bt.postCount || 0}개 글
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {bt.isCommentEnabled && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">댓글</span>
                                        )}
                                        {bt.isAnonymous && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">익명</span>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

/** 게시판 폼 컴포넌트 */
interface BoardTypeFormProps {
    formData: BoardTypeRequest;
    setFormData: React.Dispatch<React.SetStateAction<BoardTypeRequest>>;
    generateSlug: (name: string) => string;
    onSubmit: () => void;
    onCancel: () => void;
    submitLabel: string;
    isNew: boolean;
}

const BoardTypeForm: React.FC<BoardTypeFormProps> = ({ formData, setFormData, generateSlug, onSubmit, onCancel, submitLabel, isNew }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">게시판 이름 *</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                            const name = e.target.value;
                            setFormData(prev => ({
                                ...prev,
                                name,
                                slug: isNew ? generateSlug(name) || prev.slug : prev.slug,
                            }));
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 outline-none"
                        placeholder="공지사항"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL 경로 *</label>
                    <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-1">/board/</span>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 outline-none"
                            placeholder="notice"
                        />
                    </div>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 outline-none"
                    rows={2}
                    placeholder="게시판에 대한 설명"
                />
            </div>
            <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.isCommentEnabled}
                        onChange={(e) => setFormData(prev => ({ ...prev, isCommentEnabled: e.target.checked }))}
                        className="w-4 h-4 text-ocean-500 rounded"
                    />
                    <span className="text-sm text-gray-700">댓글 허용</span>
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.isAnonymous}
                        onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                        className="w-4 h-4 text-ocean-500 rounded"
                    />
                    <span className="text-sm text-gray-700">익명 게시판</span>
                </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
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

export default BoardTypeManagement;
