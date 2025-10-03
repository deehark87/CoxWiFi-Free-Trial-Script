// Minimal safe preload script for evaluateOnNewDocument
// This file is intentionally minimal: it runs in the page context before any page scripts.
// Keep this file small and synchronous because `free-wifi.js` reads it synchronously.

// Example: add a non-invasive marker and a safe helper.
(function () {
  try {
    // marker to help debugging and automated tests
    Object.defineProperty(window, '__WIFI2_PRELOAD_LOADED__', {
      value: true,
      writable: false,
      configurable: false,
      enumerable: true,
    });

    // safe helper: a no-op function to be callable from page context without exposing sensitive data
    window.wifi2 = window.wifi2 || {};
    window.wifi2.noop = function () {
      return '__wifi2_noop__';
    };
  } catch (e) {
    // swallow errors to avoid breaking page scripts
    // (preload should be as non-intrusive as possible)
  }
})();
