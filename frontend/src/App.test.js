// src/App.test.js
/**
 * @file App.test.js
 * @description Contains tests for the App component, including mocking and rendering validations.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock react-markdown
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="markdown">{children}</div>
}));

// Mock components that use react-markdown
jest.mock('./pages/IncomeRe', () => {
  return {
    __esModule: true,
    default: () => <div>Mocked Income Recommendation Page</div>
  };
});

/**
 * Test to verify the rendering of the App component.
 */
test('renders App component', () => {
  render(<App />);
  // Add your test assertions here
});