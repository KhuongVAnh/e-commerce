import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Bell, CheckCheck, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../components/ToastProvider';
import {
  getNotificationType,
  getRelativeTime,
  resolveNotificationTarget,
} from '../../utils/notificationUtils';

const LIMIT = 10;

const Notifications = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, limit: LIMIT, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const filter = searchParams.get('filter') === 'unread' ? 'unread' : 'all';

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await notificationService.getMyNotifications({
        page,
        limit: LIMIT,
        isRead: filter === 'unread' ? false : undefined,
      });

      setNotifications(response.data?.notifications || []);
      setUnreadCount(Number(response.data?.unreadCount || 0));
      setPagination(response.meta?.pagination || { page, limit: LIMIT, total: 0, totalPages: 1 });
    } catch (error) {
      showToast(error?.message || 'Không thể tải thông báo', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [filter, page, showToast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const setFilter = (nextFilter) => {
    setSearchParams(nextFilter === 'unread' ? { filter: 'unread', page: '1' } : { page: '1' });
  };

  const setPage = (nextPage) => {
    const params = {};
    if (filter === 'unread') params.filter = 'unread';
    params.page = String(nextPage);
    setSearchParams(params);
  };

  const handleReadAll = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((items) => items.map((item) => ({
        ...item,
        isRead: true,
        readAt: item.readAt || new Date().toISOString(),
      })));
      showToast('Đã đánh dấu tất cả thông báo là đã đọc', { type: 'success' });
      if (filter === 'unread') {
        loadNotifications();
      }
    } catch (error) {
      showToast(error?.message || 'Không thể đánh dấu tất cả đã đọc', { type: 'error' });
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await notificationService.markAsRead(notification.id);
      }

      navigate(resolveNotificationTarget(notification, user, location.pathname));
    } catch (error) {
      showToast(error?.message || 'Không thể mở thông báo', { type: 'error' });
    }
  };

  const pageNumbers = useMemo(() => {
    const totalPages = Math.max(1, Number(pagination.totalPages || 1));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, pagination.totalPages]);

  const totalPages = Math.max(1, Number(pagination.totalPages || 1));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#2b3896]">E-commerce</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Thông báo của bạn</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã đọc tất cả thông báo'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadNotifications}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#2b3896]/30 hover:text-[#2b3896]"
          >
            <RefreshCw size={16} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={handleReadAll}
            className="inline-flex items-center gap-2 rounded-full bg-[#2b3896] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#2b3896]/20 transition hover:bg-[#1f2970]"
          >
            <CheckCheck size={16} />
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>

      <div className="mb-5 flex gap-2">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'unread', label: 'Chưa đọc' },
        ].map((item) => (
          <button
            type="button"
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`rounded-full px-5 py-2 text-sm font-extrabold transition ${filter === item.key ? 'bg-indigo-100 text-[#2b3896]' : 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-100 hover:bg-slate-50'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-[#2b3896]/5">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm font-semibold text-slate-500">
            <Loader2 size={20} className="animate-spin text-[#2b3896]" />
            Đang tải thông báo
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-indigo-50 text-[#2b3896]">
              <Bell size={30} />
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-slate-900">Không có thông báo</h2>
            <p className="mt-1 text-sm text-slate-500">Các cập nhật về tài khoản, đơn hàng và thanh toán sẽ hiển thị tại đây.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const meta = getNotificationType(notification.type);

              return (
                <button
                  type="button"
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex w-full gap-4 px-5 py-5 text-left transition hover:bg-indigo-50/60 ${notification.isRead ? 'bg-white' : 'bg-indigo-50/50'}`}
                >
                  <div className="relative h-16 w-16 shrink-0">
                    <div className={`grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br ${meta.avatar}`}>
                      <span className="material-symbols-outlined text-[30px]">{meta.icon}</span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-white ${meta.badge} text-white`}>
                      <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-950">{notification.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{notification.content}</p>
                      </div>
                      {!notification.isRead && <span className="mt-2 h-3 w-3 shrink-0 rounded-full bg-[#2b3896]" />}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-[#2b3896]">{getRelativeTime(notification.createdAt)}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">{meta.label}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-500">
            Trang {currentPage} / {totalPages} - {pagination.total} thông báo
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 hover:text-[#2b3896]"
            >
              <ChevronLeft size={18} />
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                className={`h-10 min-w-10 rounded-xl px-3 text-sm font-extrabold ${pageNumber === currentPage ? 'bg-[#2b3896] text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-[#2b3896]'}`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 hover:text-[#2b3896]"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Notifications;
