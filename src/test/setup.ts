import '@testing-library/jest-dom/vitest'

// jsdom has no ResizeObserver; components that only use it to detect their
// own rendered width (a pure enhancement, not something tests assert on)
// just need a no-op stand-in so they don't throw during render.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
