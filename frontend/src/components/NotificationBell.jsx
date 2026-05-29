import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2, MoreHorizontal, RefreshCw } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { notificationService } from '../services/notificationService';
import { useToast } from './ToastProvider';
import {
  getNotificationListPath,
  getNotificationType,
  getRelativeTime,
  resolveNotificationTarget,
} from '../utils/notificationUtils';

const NotificationBell = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const wrapperRef = useRef(null);

  const fetchNotifications = useCallback(async ({ quiet = false, filter = activeFilter, expanded = isExpanded } = {}) => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setPagination(null);
      return;
    }

    if (!quiet) setIsLoading(true);

    try {
      const response = await notificationService.getMyNotifications({
        limit: expanded ? 100 : 12,
        isRead: filter === 'unread' ? false : undefined,
      });
      const data = response.data || {};
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(Number(data.unreadCount || 0));
      setPagination(response.meta?.pagination || null);
    } catch (error) {
      showToast(error?.message || 'Không thể tải thông báo', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, isAuthenticated, isExpanded, showToast]);

  useEffect(() => {
    fetchNotifications({ quiet: true });
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const intervalId = window.setInterval(() => {
      fetchNotifications({ quiet: true });
    }, 45000);

    return () => window.clearInterval(intervalId);
  }, [fetchNotifications, isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsMenuOpen(false);
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    setIsMenuOpen(false);

    if (nextOpen) {
      fetchNotifications({ filter: activeFilter, expanded: isExpanded });
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setIsExpanded(false);
    fetchNotifications({ filter, expanded: false });
  };

  const handleViewAll = () => {
    setIsOpen(false);
    setIsMenuOpen(false);
    navigate(getNotificationListPath(location.pathname));
  };

  const handleRead = async (notification) => {
    try {
      if (!notification.isRead) {
        await notificationService.markAsRead(notification.id);
        setNotifications((items) => items.map((item) => (
          item.id === notification.id
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item
        )));
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      setIsOpen(false);
      setIsMenuOpen(false);
      navigate(resolveNotificationTarget(notification, user, location.pathname));
    } catch (error) {
      showToast(error?.message || 'Không thể đánh dấu đã đọc', { type: 'error' });
    }
  };

  const handleReadAll = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((items) => items.map((item) => ({
        ...item,
        isRead: true,
        readAt: item.readAt || new Date().toISOString(),
      })));
      setUnreadCount(0);
      setIsMenuOpen(false);
      if (activeFilter === 'unread') {
        fetchNotifications({ filter: 'unread', expanded: isExpanded });
      }
      showToast('Đã đánh dấu tất cả thông báo là đã đọc', { type: 'success' });
    } catch (error) {
      showToast(error?.message || 'Không thể đánh dấu tất cả đã đọc', { type: 'error' });
    }
  };

  if (!isAuthenticated) return null;

  const displayUnread = unreadCount > 99 ? '99+' : unreadCount;
  const emptyText = activeFilter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo';
  const canViewMore = Boolean(pagination?.total && pagination.total > notifications.length);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Thông báo"
        title="Thông báo"
        className={`relative grid h-10 w-10 place-items-center rounded-full transition-all active:scale-95 ${isOpen ? 'bg-[#2b3896] text-white shadow-lg shadow-[#2b3896]/25' : 'bg-indigo-50 text-[#2b3896] hover:bg-indigo-100'}`}
      >
        <Bell size={21} fill={isOpen ? 'currentColor' : 'none'} strokeWidth={2.3} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-2 bg-[#2b3896] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm">
            {displayUnread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-[80] flex max-h-[calc(100vh-6rem)] w-[min(27rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white text-slate-900 shadow-2xl shadow-[#2b3896]/15 ring-1 ring-black/5">
          <div className="shrink-0 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#2b3896]">E-commerce</p>
                <h2 className="text-[28px] font-extrabold tracking-normal text-slate-950">Thông báo</h2>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((value) => !value)}
                  className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#2b3896]"
                  aria-label="Tùy chọn thông báo"
                >
                  <MoreHorizontal size={22} />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-10 w-60 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 text-sm font-semibold text-slate-700 shadow-xl ring-1 ring-black/5">
                    <button
                      type="button"
                      onClick={handleReadAll}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-indigo-50 hover:text-[#2b3896]"
                    >
                      <CheckCheck size={18} />
                      Đánh dấu tất cả đã đọc
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        fetchNotifications();
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-indigo-50 hover:text-[#2b3896]"
                    >
                      <RefreshCw size={17} />
                      Làm mới thông báo
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'unread', label: 'Chưa đọc' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => handleFilterChange(item.key)}
                  className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${activeFilter === item.key ? 'bg-indigo-100 text-[#2b3896]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between px-4">
            <h3 className="text-[17px] font-extrabold text-slate-900">Trước đó</h3>
            <button
              type="button"
              onClick={handleViewAll}
              className="rounded-md px-2 py-1 text-sm font-bold text-[#2b3896] hover:bg-indigo-50"
            >
              Xem tất cả
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm font-semibold text-slate-500">
                <Loader2 size={18} className="animate-spin text-[#2b3896]" />
                Đang tải thông báo
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-7 py-12 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-indigo-50 text-[#2b3896]">
                  <Bell size={26} />
                </div>
                <p className="mt-4 text-base font-extrabold text-slate-900">{emptyText}</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">Các cập nhật về đơn hàng, thanh toán và tài khoản sẽ hiển thị tại đây.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => {
                  const meta = getNotificationType(notification.type);

                  return (
                    <button
                      type="button"
                      key={notification.id}
                      onClick={() => handleRead(notification)}
                      className={`group flex w-full gap-3 rounded-xl px-2 py-2 text-left transition ${notification.isRead ? 'hover:bg-slate-50' : 'bg-indigo-50/70 hover:bg-indigo-100/80'}`}
                    >
                      <div className="relative h-16 w-16 shrink-0">
                        <div className={`grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br ${meta.avatar} shadow-sm`}>
                          <span className="material-symbols-outlined text-[30px]">{meta.icon}</span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-white ${meta.badge} text-white shadow-sm`}>
                          <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className={`line-clamp-3 text-[15px] leading-5 ${notification.isRead ? 'font-medium text-slate-600' : 'font-extrabold text-slate-900'}`}>
                          <span className="font-extrabold text-slate-950">{notification.title}</span>
                          <span className="font-medium"> {notification.content}</span>
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[13px] font-extrabold text-[#2b3896]">{getRelativeTime(notification.createdAt)}</span>
                          <span className="text-[12px] font-semibold text-slate-400">{meta.label}</span>
                        </div>
                      </div>

                      {!notification.isRead && (
                        <span className="mt-8 h-3 w-3 shrink-0 rounded-full bg-[#2b3896]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-100 p-3">
            <button
              type="button"
              onClick={canViewMore || !isExpanded ? handleViewAll : () => fetchNotifications({ expanded: isExpanded })}
              className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-indigo-50 hover:text-[#2b3896]"
            >
              {canViewMore || !isExpanded ? 'Xem thông báo trước đó' : 'Làm mới thông báo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
