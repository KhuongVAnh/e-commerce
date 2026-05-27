export const notificationTypes = {
  'user.registered': {
    label: 'Tài khoản',
    icon: 'person_check',
    badge: 'bg-emerald-500',
    avatar: 'from-emerald-100 to-teal-100 text-emerald-700',
  },
  'order.created': {
    label: 'Đơn hàng',
    icon: 'receipt_long',
    badge: 'bg-[#2b3896]',
    avatar: 'from-indigo-100 to-blue-100 text-[#2b3896]',
  },
  'order.status.updated': {
    label: 'Vận chuyển',
    icon: 'local_shipping',
    badge: 'bg-sky-500',
    avatar: 'from-sky-100 to-cyan-100 text-sky-700',
  },
  'payment.succeeded': {
    label: 'Thanh toán',
    icon: 'payments',
    badge: 'bg-lime-500',
    avatar: 'from-lime-100 to-emerald-100 text-emerald-700',
  },
  'payment.failed': {
    label: 'Cần xử lý',
    icon: 'priority_high',
    badge: 'bg-orange-500',
    avatar: 'from-orange-100 to-rose-100 text-orange-700',
  },
};

export function getNotificationType(type) {
  return notificationTypes[type] || {
    label: 'Thông báo',
    icon: 'notifications',
    badge: 'bg-[#2b3896]',
    avatar: 'from-indigo-100 to-blue-100 text-[#2b3896]',
  };
}

export function getRelativeTime(value) {
  const createdAt = new Date(value);
  const diffMs = Date.now() - createdAt.getTime();

  if (Number.isNaN(createdAt.getTime())) return '';

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày`;

  return createdAt.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
}

export function getNotificationListPath(pathname = window.location.pathname) {
  if (pathname.startsWith('/seller')) return '/seller/notifications';
  if (pathname.startsWith('/admin')) return '/admin/notifications';
  return '/notifications';
}

export function getNotificationDetailPath(notificationId, pathname = window.location.pathname) {
  const basePath = getNotificationListPath(pathname);
  return `${basePath}/${notificationId}`;
}

export function resolveNotificationTarget(notification, user, pathname = window.location.pathname) {
  const metadata = notification?.metadata || {};
  const orderId = metadata.orderId || metadata.orderID || metadata.order_id;
  const type = notification?.type;
  const role = user?.role?.toUpperCase();

  if (['order.created', 'order.status.updated', 'payment.succeeded', 'payment.failed'].includes(type) && orderId) {
    if (role === 'SELLER') {
      return `/seller/orders/${orderId}`;
    }

    if (role === 'ADMIN') {
      return '/admin/orders';
    }

    return `/orders/${orderId}`;
  }

  return getNotificationDetailPath(notification?.id, pathname);
}

export function formatNotificationDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
