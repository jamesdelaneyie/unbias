const createNotificationBox = (document: Document) => {
  const notificationBox = document.createElement('div');
  notificationBox.style.position = 'fixed';
  notificationBox.style.bottom = '5px';
  notificationBox.style.left = '5px';
  notificationBox.style.width = '300px';
  notificationBox.style.maxHeight = '500px';
  notificationBox.style.overflowY = 'auto';
  notificationBox.style.backgroundColor = 'rgba(0,0,0,0.8)';
  notificationBox.style.color = 'white';
  notificationBox.style.padding = '10px';
  notificationBox.style.borderRadius = '2px';
  notificationBox.style.fontFamily = 'monospace';
  notificationBox.style.fontSize = '10px';
  notificationBox.style.zIndex = '1000';
  document.body.appendChild(notificationBox);
  return notificationBox;
};

const addNotification = (document: Document, box: HTMLDivElement, message: string) => {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
  notification.style.padding = '5px 0';
  box.appendChild(notification);
  box.scrollTop = box.scrollHeight;
};

export { createNotificationBox, addNotification };
