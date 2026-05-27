import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bell, ExternalLink, Loader2 } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../components/ToastProvider';
import {
  formatNotificationDate,
  getNotificationListPath,
  getNotificationType,
  resolveNotificationTarget,
} from '../../utils/notificationUtils';

const NotificationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDetail = async () => {
      setIsLoading(true);
      try {
        const response = await notificationService.getNotificationDetail(id);
        const detail = response.data?.notification;
        setNotification(detail || null);

        if (detail && !detail.isRead) {
          await notificationService.markAsRead(detail.id);
          setNotification({ ...detail, isRead: true, readAt: new Date().toISOString() });
        }
      } catch (error) {
        showToast(error?.message || 'Không thể tải chi tiết thông báo', { type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    loadDetail();
  }, [id, showToast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm font-semibold text-slate-500">
        <Loader2 size={20} className="animate-spin text-[#2b3896]" />
        Đang tải chi tiết thông báo
      </div>
    );
  }

  if (!notification) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-indigo-50 text-[#2b3896]">
          <Bell size={30} />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-950">Không tìm thấy thông báo</h1>
        <Link to={getNotificationListPath(location.pathname)} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2b3896] px-5 py-2.5 text-sm font-bold text-white">
          <ArrowLeft size={16} />
          Quay lại thông báo
        </Link>
      </section>
    );
  }

  const meta = getNotificationType(notification.type);
  const targetPath = resolveNotificationTarget(notification, user, location.pathname);
  const listPath = getNotificationListPath(location.pathname);
  const hasEntityTarget = targetPath !== `${listPath}/${notification.id}`;

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <Link to={listPath} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#2b3896]">
        <ArrowLeft size={16} />
        Quay lại danh sách thông báo
      </Link>

      <article className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-[#2b3896]/5">
        <div className="bg-gradient-to-br from-indigo-50 to-white px-6 py-8 md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="relative h-20 w-20 shrink-0">
              <div className={`grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br ${meta.avatar}`}>
                <span className="material-symbols-outlined text-[38px]">{meta.icon}</span>
              </div>
              <div className={`absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border-2 border-white ${meta.badge} text-white`}>
                <span className="material-symbols-outlined text-[20px]">{meta.icon}</span>
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#2b3896]">{meta.label}</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{notification.title}</h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {formatNotificationDate(notification.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-7 md:px-8">
          <p className="text-base leading-8 text-slate-700">{notification.content}</p>

          <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 text-sm md:grid-cols-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Trạng thái</p>
              <p className="mt-1 font-bold text-slate-800">{notification.isRead ? 'Đã đọc' : 'Chưa đọc'}</p>
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Thời gian đọc</p>
              <p className="mt-1 font-bold text-slate-800">{notification.readAt ? formatNotificationDate(notification.readAt) : 'Chưa có'}</p>
            </div>
          </div>

          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5">
              <p className="mb-3 text-sm font-extrabold text-slate-900">Dữ liệu liên quan</p>
              <dl className="grid gap-3 text-sm md:grid-cols-2">
                {Object.entries(notification.metadata).map(([key, value]) => (
                  <div key={key} className="rounded-xl bg-slate-50 px-3 py-2">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{key}</dt>
                    <dd className="mt-1 break-words font-semibold text-slate-700">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {hasEntityTarget && (
            <button
              type="button"
              onClick={() => navigate(targetPath)}
              className="inline-flex items-center gap-2 rounded-full bg-[#2b3896] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#2b3896]/20 transition hover:bg-[#1f2970]"
            >
              Mở nội dung liên quan
              <ExternalLink size={16} />
            </button>
          )}
        </div>
      </article>
    </section>
  );
};

export default NotificationDetail;
