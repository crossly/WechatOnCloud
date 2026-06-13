export type CommitText = (text: string) => void;

export class ImeCommitBuffer {
  private composing = false;
  private lastCompositionCommit = '';

  constructor(private readonly commit: CommitText) {}

  compositionStart() {
    this.composing = true;
    this.lastCompositionCommit = '';
  }

  compositionEnd(text: string) {
    this.composing = false;
    if (!text) return;
    this.lastCompositionCommit = text;
    this.commit(text);
  }

  input(text: string, isComposing = false) {
    if (!text) return;
    if (this.composing || isComposing) return;
    if (this.lastCompositionCommit === text) {
      this.lastCompositionCommit = '';
      return;
    }
    this.lastCompositionCommit = '';
    this.commit(text);
  }
}

export interface ImeProxyPositionInput {
  frame: { left: number; right: number; top: number };
  clientX: number;
  clientY: number;
  viewportWidth: number;
  viewportHeight: number;
  proxyWidth?: number;
}

export function imeProxyPositionFromFrameClick(input: ImeProxyPositionInput): { x: number; y: number } {
  const parentX = input.frame.left + input.clientX;
  const parentY = input.frame.top + input.clientY;
  const margin = 12;
  const proxyWidth = Math.min(input.proxyWidth ?? 420, input.viewportWidth - margin * 2);
  const minX = Math.max(margin, input.frame.left + margin);
  const maxX = Math.min(input.frame.right - margin, input.viewportWidth - proxyWidth - margin);
  return {
    x: Math.max(minX, Math.min(maxX, parentX)),
    y: Math.max(56, Math.min(input.viewportHeight - 48, parentY)),
  };
}

export interface ImeProxyActivationInput {
  frame: { left: number; right: number; top: number; bottom: number };
  clientX: number;
  clientY: number;
}

export function imeProxyShouldActivateFromFrameClick(input: ImeProxyActivationInput): boolean {
  const width = input.frame.right - input.frame.left;
  const height = input.frame.bottom - input.frame.top;
  if (width <= 0 || height <= 0) return false;

  const xRatio = input.clientX / width;
  const yRatio = input.clientY / height;
  return xRatio >= 0.28 && yRatio >= 0.72;
}

export interface ImeProxyShortcutInput {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  isComposing: boolean;
}

export function imeProxyShortcutKey(input: ImeProxyShortcutInput): string | null {
  if (input.isComposing || input.altKey || (!input.ctrlKey && !input.metaKey)) return null;
  const key = input.key.length === 1 ? input.key.toUpperCase() : input.key;
  if (!/^[ACVXYZ]$/.test(key)) return null;
  return `Ctrl+${key}`;
}

export interface ImeProxyMobileViewportInput {
  viewportWidth: number;
  viewportHeight: number;
  visualViewportTop?: number;
  visualViewportHeight?: number;
  proxyHeight?: number;
}

export function imeProxyMobileViewportPosition(input: ImeProxyMobileViewportInput): { x: number; y: number | null } {
  const margin = 12;
  void input.viewportWidth;
  return {
    x: margin,
    y: null,
  };
}

export interface ImeProxyPointLike {
  clientX?: number;
  clientY?: number;
  touches?: ArrayLike<{ clientX: number; clientY: number }>;
  changedTouches?: ArrayLike<{ clientX: number; clientY: number }>;
}

export function imeProxyEventPoint(input: ImeProxyPointLike): { clientX: number; clientY: number } | null {
  if (typeof input.clientX === 'number' && typeof input.clientY === 'number') {
    return { clientX: input.clientX, clientY: input.clientY };
  }
  const touch = input.touches?.[0] ?? input.changedTouches?.[0];
  if (!touch) return null;
  return { clientX: touch.clientX, clientY: touch.clientY };
}

export function imeProxyClassName(input: { mobile: boolean; typing: boolean; active: boolean }): string {
  return [
    'iv-ime-proxy',
    input.mobile ? 'mobile' : '',
    input.typing ? 'typing' : '',
    input.active ? 'active' : '',
  ]
    .filter(Boolean)
    .join(' ');
}
