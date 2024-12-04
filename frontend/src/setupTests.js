/**
 * @file setupTests.js
 * @description Configures global test environment settings for Jest, including adding custom matchers and polyfills.
 */
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
/**
 * Polyfill for `window.matchMedia` to support tests that rely on it.
 *
 * Some libraries or components may use `matchMedia` for responsive design testing.
 * This polyfill ensures that `window.matchMedia` does not throw errors in a test environment.
 */
window.matchMedia = window.matchMedia || function() {
    return {
        matches: false, // Default to no matches
        addListener: function() {}, // No-op for adding listeners
        removeListener: function() {}, // No-op for removing listeners
    };
  };