import "./NotificationToast.css";

function NotificationToast({
  notificationQueue,
}) {
  return (
    <div
      className="notification-toast-container"
      aria-live="polite"
      aria-atomic="true"
    >
      {notificationQueue.map((toast) => (
        <div
          key={toast.id}
          className={`notification-toast notification-${toast.type}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export default NotificationToast;