// src/pages/Home.test.js
/**
 * @file Home.test.js
 * @description Unit tests for the Home component using React Testing Library.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Home from './Home.js';

// Create mock UserContext
const mockUserContext = {
  uid: 'test-user-id',
};

// Mock the UserContext
jest.mock('../userContext', () => ({
  useUser: () => mockUserContext
}));

// Mock the chart.js module
jest.mock('../chart', () => ({
  /**
   * Mocked CategoryChartExpense component.
   * @param {Object} props - Component props.
   * @param {Array} props.categories - Array of categories.
   * @param {Array} props.transactions - Array of transactions.
   * @returns {JSX.Element} Mocked chart visualization.
   */
  CategoryChartExpense: ({ categories, transactions }) => (
    <div data-testid="mock-expense-chart">
      Mock Expense Chart: {categories.length} categories, {transactions.length} transactions
    </div>
  ),
  CategoryChartIncome: ({ categories, transactions }) => (
    <div data-testid="mock-income-chart">
      Mock Income Chart: {categories.length} categories, {transactions.length} transactions
    </div>
  )
}));

// Mock default response data
const mockCategories = [
  { id: 1, name: 'Food', icon: 'fa-utensils' },
  { id: 2, name: 'Entertainment', icon: 'fa-film' }
];

/**
 * Mocked transactions for the initial state.
 */
const mockTransactions = [
  { 
    id: 1, 
    amount: 50, 
    note: 'Lunch', 
    created_at: { seconds: 1637019600 },
    incomeExpense: 'expense'
  }
];

/**
 * Mocked overall amounts for testing.
 */
const mockOverallAmounts = {
  totalAmount: 1000,
  monthlyAmount: 300
};

// Setup component wrapper with required providers
/**
 * Renders the Home component within the necessary context.
 *
 * @function
 * @returns {RenderResult} The rendered Home component.
 */
const renderHome = () => {
  return render(
    <BrowserRouter>
      <Home />
    </BrowserRouter>
  );
};

describe('Home Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default fetch responses
    global.fetch = jest.fn((url) => {
      if (url.includes('/categories/user-categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ categories: mockCategories })
        });
      }
      if (url.includes('/categories/transactions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ transactions: mockTransactions })
        });
      }
      if (url.includes('/categories/overall')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOverallAmounts)
        });
      }
      if (url.includes('/get-username')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ username: 'TestUser' })
        });
      }
      // Default response for any other endpoints
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          category: {
            success: true,
            categoryData: {
              categoryId: 3,
              name: 'Shopping'
            }
          }
        })
      });
    });
  });

  /**
   * Tests if the main components of the Home page are rendered correctly
   * and if initial data is loaded successfully.
   */
  test('renders main components and loads initial data', async () => {
    renderHome();
  
    // Check if main sections are rendered
    await waitFor(() => {
      expect(screen.getByText('Category Overview')).toBeInTheDocument();
    });
    
    // Wait for data to load
    await waitFor(() => {
      // 修改這裡以匹配實際的文字
      expect(screen.getByText('Overall Total Income')).toBeInTheDocument();
      expect(screen.getByText('$1000')).toBeInTheDocument();
    });
  
    // Check if categories are rendered
    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
      expect(screen.getByText('Entertainment')).toBeInTheDocument();
    });
  
    // Check if both charts are rendered
    expect(screen.getByTestId('mock-expense-chart')).toBeInTheDocument();
    expect(screen.getByTestId('mock-income-chart')).toBeInTheDocument();
  });

  /**
   * Tests if a new category can be added successfully.
   */
  test('can add a new category', async () => {
    // Set up the mock response for adding a category
    const mockAddCategory = {
      category: {
        success: true,
        categoryData: {
          categoryId: 3,
          name: 'Shopping',
          icon: 'fa-shopping-cart'
        }
      }
    };

    // Override the fetch mock for this specific test
    global.fetch.mockImplementation((url, options = {}) => {
      if (options.method === 'POST' && url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAddCategory)
        });
      }
      // Keep the default responses for other API calls
      if (url.includes('/categories/user-categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ categories: mockCategories })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });

    renderHome();

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Add New Category')).toBeInTheDocument();
    });

    // Fill in new category details
    const categoryInput = screen.getByPlaceholderText('Enter category name');
    fireEvent.change(categoryInput, { target: { value: 'Shopping' } });

    // Select an icon
    const icons = screen.getAllByRole('button');
    const iconButton = icons.find(button => 
      button.querySelector('.fa-shopping-cart') ||
      button.closest('.icon-item')
    );
    if (iconButton) {
      fireEvent.click(iconButton);
    }

    // Click add category button
    const addButton = screen.getByText('Add Category');
    fireEvent.click(addButton);

    // Verify the API was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/categories'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String)
        })
      );
    });
  });
});