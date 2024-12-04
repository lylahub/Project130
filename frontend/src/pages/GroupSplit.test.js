// src/pages/GroupSplit.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import GroupSplit from './GroupSplit';
import { WebSocketContext } from '../WebsocketContext';

// Mock window.alert
window.alert = jest.fn();

// Mock chart.js
jest.mock('chart.js', () => ({
  Chart: jest.fn(),
  registerables: []
}));

// Mock the UserContext
const mockUserContext = {
  uid: 'test-user-id',
};

jest.mock('../userContext', () => ({
  useUser: () => mockUserContext
}));

// Mock the BalancesChart component
jest.mock('../chart', () => ({
  BalancesChart: () => <div data-testid="balances-chart">Mocked Chart</div>,
  CategoryChartExpense: () => <div data-testid="category-chart">Mocked Category Chart</div>
}));

// Mock WebSocket
const mockWebSocket = {
  onmessage: null,
  send: jest.fn()
};

// Mock fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  })
);

// Mock data
const mockGroups = {
  'group1': {
    groupId: 'group1',
    groupName: 'Test Group 1',
    participants: ['user1', 'user2'],
    created_at: { seconds: 1637019600 },
    balances: {
      'test-user-id': {
        owes: {
          'user2': -50
        }
      }
    },
    entriesInfo: {
      'entry1': {
        amount: 100,
        payer: 'user1',
        memo: 'Test expense',
        created_at: { seconds: 1637019600 },
        paidStatus: {}
      }
    }
  }
};

// Test component wrapper
const renderGroupSplit = () => {
  return render(
    <MemoryRouter>
      <WebSocketContext.Provider value={mockWebSocket}>
        <GroupSplit />
      </WebSocketContext.Provider>
    </MemoryRouter>
  );
};

describe('GroupSplit Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default fetch responses
    global.fetch.mockImplementation((url) => {
      if (url.includes('/get-username')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ username: 'TestUser' })
        });
      }
      if (url.includes('/group/fetch-groups')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ groups: mockGroups })
        });
      }
      if (url.includes('/group/create')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            groupId: 'new-group',
            message: 'Group created successfully'
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders group split page with initial elements', async () => {
    renderGroupSplit();

    // Check if main elements are rendered
    expect(screen.getByPlaceholderText('Group Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Participant Emails (comma separated)')).toBeInTheDocument();
    expect(screen.getByText('Create New Group')).toBeInTheDocument();

    // Wait for groups to load
    await waitFor(() => {
      expect(screen.getByText('Test Group 1')).toBeInTheDocument();
    });
  });

  test('can create a new group', async () => {
    renderGroupSplit();

    // Fill in the form
    const groupNameInput = screen.getByPlaceholderText('Group Name');
    const emailsInput = screen.getByPlaceholderText('Participant Emails (comma separated)');
    fireEvent.change(groupNameInput, { target: { value: 'New Test Group' } });
    fireEvent.change(emailsInput, { target: { value: 'test1@example.com,test2@example.com' } });

    // Click create button
    const createButton = screen.getByText('Create New Group');
    fireEvent.click(createButton);

    // Verify API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/group/create'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String)
        })
      );
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('created successfully'));
    });
  });

  test('shows expense modal when clicking a group card', async () => {
    renderGroupSplit();

    // Wait for groups to load
    await waitFor(() => {
      expect(screen.getByText('Test Group 1')).toBeInTheDocument();
    });

    // Click on the group card
    const groupCard = screen.getByText('Test Group 1').closest('.group-card');
    fireEvent.click(groupCard);

    // Check if modal appears
    await waitFor(() => {
      expect(screen.getByText('Expense Details')).toBeInTheDocument();
      expect(screen.getByText('Settlement Summary')).toBeInTheDocument();
      expect(screen.getByTestId('balances-chart')).toBeInTheDocument();
    });
  });

  test('displays correct balance information in group card', async () => {
    renderGroupSplit();

    // Wait for groups to load and check balance display
    await waitFor(() => {
      const balanceElement = screen.getByText('$50.00');
      expect(balanceElement).toBeInTheDocument();
      expect(balanceElement).toHaveClass('negative');
    });
  });
});