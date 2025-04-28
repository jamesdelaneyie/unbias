import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
  runScripts: 'dangerously',
});

(global as any).document = dom.window.document;
(global as any).window = dom.window;
(global as any).HTMLDivElement = dom.window.HTMLDivElement;
