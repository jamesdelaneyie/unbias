import { describe, it, expect } from 'vitest';
import { createNotificationBox, addNotification } from '../client/HTMLUI';

describe('Notification Box', () => {
  it('should create a notification box', () => {
    const box = createNotificationBox(document);
    expect(box).toBeInstanceOf(HTMLDivElement);
    expect(box.style.position).toBe('fixed');
  });

  it('should add a notification', () => {
    const box = createNotificationBox(document);
    addNotification(document, box, 'Test notification');
    expect(box.children.length).toBe(1);
    expect(box.children[0].textContent).toBe('Test notification');
  });
});
