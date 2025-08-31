// src/types/global.d.ts
export {};

declare global {
  interface Window {
    THREE?: typeof import("three");
  }
}
