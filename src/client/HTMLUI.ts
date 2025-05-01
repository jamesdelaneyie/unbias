const ligtenColor = (color: number, amount: number) => {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;

  const newR = Math.min(255, r + (255 - r) * amount);
  const newG = Math.min(255, g + (255 - g) * amount);
  const newB = Math.min(255, b + (255 - b) * amount);

  return (newR << 16) + (newG << 8) + newB;
};

const createNotificationBox = (document: Document) => {
  const notificationBox = document.createElement('div');
  notificationBox.style.position = 'fixed';
  notificationBox.style.top = '10px';
  notificationBox.style.right = '10px';
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

const addUsernameField = (document: Document, box: HTMLDivElement) => {
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'enter username';
  input.style.fontSize = '11px';
  input.style.margin = '10px 0';
  box.appendChild(input);
  return input;
};

export { ligtenColor, createNotificationBox, addNotification, addUsernameField };
