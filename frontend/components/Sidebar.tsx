/**
 * 사이드바 네비게이션 컴포넌트
 * 동적 메뉴 로드 및 트리 렌더링
 */
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Package,
  Settings,
  ShieldAlert,
  LogOut,
  Waves,
  FileText,
  Bell,
  HelpCircle,
  Menu as MenuIcon,
  Layers,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Home, Calendar, Mail,
  type LucideIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getMenus, Menu } from '../api/menu';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/** 아이콘 이름을 컴포넌트로 매핑 */
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  BarChart3,
  Package,
  Settings,
  ShieldAlert,
  FileText,
  Bell,
  HelpCircle,
  Menu: MenuIcon,
  Layers,
  ExternalLink,
  Home,
  Calendar,
  Mail,
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set());

  // 메뉴 로드 (로그인 상태 변경 시 다시 로드)
  useEffect(() => {
    const loadMenus = async () => {
      try {
        const data = await getMenus();
        setMenus(data);
      } catch (error) {
        console.error('메뉴 로드 오류:', error);
      }
    };
    loadMenus();
  }, [user]);

  /**
   * 메뉴 링크 생성
   */
  const getMenuLink = (menu: Menu): string => {
    if (menu.linkType === 'board') {
      return `/board/${menu.linkValue}`;
    }
    return menu.linkValue || '#';
  };

  /**
   * 활성 상태 확인
   */
  const isActive = (menu: Menu): boolean => {
    const link = getMenuLink(menu);
    if (link === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(link);
  };

  /**
   * 하위 메뉴 토글
   */
  const toggleExpand = (id: number) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  /**
   * 메뉴 아이템 렌더링
   */
  const renderMenuItem = (menu: Menu, depth = 0) => {
    const Icon = iconMap[menu.icon || ''] || FileText;
    const link = getMenuLink(menu);
    const active = isActive(menu);
    const hasChildren = menu.children && menu.children.length > 0;
    const isExpanded = expandedMenus.has(menu.id);

    return (
      <div key={menu.id}>
        {hasChildren ? (
          <>
            <button
              onClick={() => toggleExpand(menu.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${active
                ? 'bg-ocean-500 text-white shadow-lg shadow-ocean-500/20'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              style={{ paddingLeft: `${16 + depth * 16}px` }}
            >
              <Icon size={20} />
              <span className="flex-1 text-left">{menu.title}</span>
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {isExpanded && (
              <div className="mt-1 space-y-1">
                {menu.children!.map(child => renderMenuItem(child, depth + 1))}
              </div>
            )}
          </>
        ) : (
          <Link
            to={link}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${active
              ? 'bg-ocean-500 text-white shadow-lg shadow-ocean-500/20'
              : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            style={{ paddingLeft: `${16 + depth * 16}px` }}
          >
            <Icon size={20} />
            {menu.title}
            {menu.linkType === 'external' && <ExternalLink size={14} className="ml-auto" />}
          </Link>
        )}
      </div>
    );
  };

  // 메인 메뉴와 시스템 메뉴 분리 (sortOrder 50 이상은 시스템)
  const mainMenus = menus.filter(m => m.sortOrder < 50);
  const systemMenus = menus.filter(m => m.sortOrder >= 50);

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 bg-gray-900/50 z-20 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-[#111827] text-white flex flex-col transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-800">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-ocean-500/20 text-ocean-400">
            <Waves size={24} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-white">Ocean Admin</h1>
            <p className="text-xs text-gray-400 font-medium">Enterprise System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-4 py-6 flex-1 overflow-y-auto">
          <div className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Main Menu</div>

          {mainMenus.map(menu => renderMenuItem(menu))}

          {systemMenus.length > 0 && (
            <>
              <div className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2">System</div>
              {systemMenus.map(menu => renderMenuItem(menu))}
            </>
          )}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors group">
            <div className="w-10 h-10 rounded-full ring-2 ring-gray-700 group-hover:ring-ocean-500 transition-all bg-ocean-500/20 text-ocean-400 flex items-center justify-center text-sm font-bold">
              {user?.name.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Guest'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
            </div>
            <button onClick={logout} className="ml-auto">
              <LogOut size={18} className="text-gray-500 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
