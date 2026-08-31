import test from 'node:test';
import assert from 'node:assert/strict';

test('install prompt listeners attach only once and can be torn down', async () => {
  const eventListeners = new Map<string, Set<(...args: unknown[]) => void>>();

  const createListenerMap = () => ({
    addEventListener(type: string, listener: (...args: unknown[]) => void) {
      const set = eventListeners.get(type) ?? new Set();
      set.add(listener);
      eventListeners.set(type, set);
    },
    removeEventListener(type: string, listener: (...args: unknown[]) => void) {
      eventListeners.get(type)?.delete(listener);
    },
  });

  const windowStub = {
    matchMedia: () => ({ matches: false }),
    ...createListenerMap(),
  };

  const documentStub = createListenerMap();
  const navigatorStub = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    platform: 'Win64',
    maxTouchPoints: 0,
    standalone: false,
  };

  Object.defineProperty(globalThis, 'window', {
    value: windowStub,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'document', {
    value: documentStub,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'navigator', {
    value: navigatorStub,
    configurable: true,
    writable: true,
  });

  const modulePath = `./installPrompt.ts?test=${Date.now()}`;
  const { attachInstallPromptListeners, detachInstallPromptListeners } = await import(modulePath);

  attachInstallPromptListeners();
  attachInstallPromptListeners();

  assert.equal(eventListeners.get('beforeinstallprompt')?.size ?? 0, 1);
  assert.equal(eventListeners.get('appinstalled')?.size ?? 0, 1);
  assert.equal(eventListeners.get('pageshow')?.size ?? 0, 1);
  assert.equal(eventListeners.get('visibilitychange')?.size ?? 0, 1);

  detachInstallPromptListeners();
  assert.equal(eventListeners.get('beforeinstallprompt')?.size ?? 0, 0);
  assert.equal(eventListeners.get('appinstalled')?.size ?? 0, 0);
  assert.equal(eventListeners.get('pageshow')?.size ?? 0, 0);
  assert.equal(eventListeners.get('visibilitychange')?.size ?? 0, 0);

  delete (globalThis as { window?: unknown }).window;
  delete (globalThis as { document?: unknown }).document;
  delete (globalThis as { navigator?: unknown }).navigator;
});
