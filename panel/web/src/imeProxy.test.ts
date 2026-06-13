/// <reference types="node" />

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ImeCommitBuffer,
  imeProxyCommitTransport,
  imeProxyEventPoint,
  imeProxyClassName,
  imeProxyMobileViewportPosition,
  imeProxyPositionFromFrameClick,
  imeProxyShortcutKey,
  imeProxyShouldActivateFromFrameClick,
} from './imeProxy';

test('commits latin text, numbers, and punctuation immediately', () => {
  const commits: string[] = [];
  const buffer = new ImeCommitBuffer((text) => commits.push(text));

  buffer.input('a');
  buffer.input('1');
  buffer.input(',');

  assert.deepEqual(commits, ['a', '1', ',']);
});

test('holds composing text until composition end', () => {
  const commits: string[] = [];
  const buffer = new ImeCommitBuffer((text) => commits.push(text));

  buffer.compositionStart();
  buffer.input('ni', true);
  buffer.input('你', true);
  buffer.compositionEnd('你');

  assert.deepEqual(commits, ['你']);
});

test('deduplicates the browser input event that follows composition end', () => {
  const commits: string[] = [];
  const buffer = new ImeCommitBuffer((text) => commits.push(text));

  buffer.compositionStart();
  buffer.input('zhong', true);
  buffer.compositionEnd('中');
  buffer.input('中');

  assert.deepEqual(commits, ['中']);
});

test('uses the server transport for committed proxy text', () => {
  assert.equal(imeProxyCommitTransport(), 'server');
});

test('positions proxy near the iframe click in parent viewport coordinates', () => {
  const pos = imeProxyPositionFromFrameClick({
    frame: { left: 100, right: 900, top: 50 },
    clientX: 320,
    clientY: 420,
    viewportWidth: 1000,
    viewportHeight: 800,
  });

  assert.deepEqual(pos, { x: 420, y: 470 });
});

test('keeps proxy fully inside the parent viewport near the right edge', () => {
  const pos = imeProxyPositionFromFrameClick({
    frame: { left: 100, right: 900, top: 50 },
    clientX: 790,
    clientY: 420,
    viewportWidth: 1000,
    viewportHeight: 800,
    proxyWidth: 420,
  });

  assert.deepEqual(pos, { x: 568, y: 470 });
});

test('activates proxy only in the likely WeChat message input area', () => {
  const frame = { left: 100, right: 900, top: 50, bottom: 850 };

  assert.equal(imeProxyShouldActivateFromFrameClick({ frame, clientX: 520, clientY: 720 }), true);
  assert.equal(imeProxyShouldActivateFromFrameClick({ frame, clientX: 520, clientY: 260 }), false);
  assert.equal(imeProxyShouldActivateFromFrameClick({ frame, clientX: 80, clientY: 720 }), false);
});

test('maps local select-all shortcut to the remote desktop shortcut', () => {
  assert.equal(imeProxyShortcutKey({ key: 'a', ctrlKey: true, metaKey: false, altKey: false, isComposing: false }), 'Ctrl+A');
  assert.equal(imeProxyShortcutKey({ key: 'a', ctrlKey: false, metaKey: true, altKey: false, isComposing: false }), 'Ctrl+A');
  assert.equal(imeProxyShortcutKey({ key: 'a', ctrlKey: true, metaKey: false, altKey: false, isComposing: true }), null);
});

test('docks mobile proxy to the viewport bottom', () => {
  const pos = imeProxyMobileViewportPosition({
    viewportWidth: 390,
    viewportHeight: 844,
    visualViewportTop: 0,
    visualViewportHeight: 520,
    proxyHeight: 40,
  });

  assert.deepEqual(pos, { x: 12, y: null });
});

test('reads click coordinates from touch events', () => {
  const point = imeProxyEventPoint({ touches: [{ clientX: 120, clientY: 680 }] });

  assert.deepEqual(point, { clientX: 120, clientY: 680 });
});

test('marks proxy active after focusing the remote input area', () => {
  assert.equal(imeProxyClassName({ mobile: true, typing: false, active: true }), 'iv-ime-proxy mobile active');
});
