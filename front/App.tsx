/**
 * Ocean Admin 메인 애플리케이션
 * React Router를 사용하여 페이지 라우팅 처리
 */
import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Search, Bell, HelpCircle, Menu, LogOut } from 'lucide-react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const BoardList = lazy(() => import('./pages/BoardList'));
const BoardDetail = lazy(() => import('./pages/BoardDetail'));
const BoardWrite = lazy(() => import('./pages/BoardWrite'));
const UserList = lazy(() => import('./pages/UserList'));
const Profile = lazy(() => import('./pages/Profile'));
const MenuManagement = lazy(() => import('./pages/MenuManagement'));
const BoardTypeManagement = lazy(() => import('./pages/BoardTypeManagement'));

/** 페이지 제목 매핑 */
const getPageTitle = (pathname: string): string => {
  if (pathname === '/') return 'Overview';
  if (pathname === '/board') return '게시판';
  if (pathname === '/board/write') return '글쓰기';
  if (pathname.startsWith('/board/edit/')) return '글 수정';
  if (pathname.startsWith('/board/')) return '게시글';
  if (pathname === '/users') return '회원 관리';
  return 'Overview';
};

/** 보호된 라우트 (로그인 필요) */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-ocean-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const RouteLoadingFallback: React.FC = () => {
  return (
    <div className="min-h-[320px] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-ocean-500 border-t-transparent rounded-full" />
    </div>
  );
};

/** 메인 레이아웃 컴포넌트 */
const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-gray-500 hover:text-ocean-500 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{pageTitle}</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-ocean-500 transition-colors">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Search data..."
                className="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500 transition-all outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-500 hover:text-ocean-500 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <button className="p-2 text-gray-500 hover:text-ocean-500 hover:bg-gray-100 rounded-lg transition-colors">
                <HelpCircle size={20} />
              </button>
              {user && (
                <>
                  <div className="h-6 w-px bg-gray-200" />
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-ocean-100 text-ocean-600 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="hidden sm:flex flex-col">
                      <span className="font-medium text-gray-900">{user.name}</span>
                      <span className="text-xs text-gray-500">{user.role === 'admin' ? '관리자' : '일반 사용자'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.href = '/profile'}
                    className="p-2 text-gray-500 hover:text-ocean-500 hover:bg-gray-100 rounded-lg transition-colors"
                    title="내 정보 수정"
                    style={{ color: '#6b7280' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-[1600px] mx-auto flex flex-col gap-8">
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/board" element={<BoardList />} />
                <Route path="/board/write" element={<BoardWrite />} />
                <Route path="/board/edit/:id" element={<BoardWrite />} />
                <Route path="/board/:slug" element={<BoardList />} />
                <Route path="/board/:slug/write" element={<BoardWrite />} />
                <Route path="/board/:slug/edit/:id" element={<BoardWrite />} />
                <Route path="/board/:slug/:id" element={<BoardDetail />} />
                <Route path="/users" element={<UserList />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin/menus" element={<MenuManagement />} />
                <Route path="/admin/board-types" element={<BoardTypeManagement />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
};

/** 앱 라우터 */
const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* 공개 라우트 */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 보호된 라우트 */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
