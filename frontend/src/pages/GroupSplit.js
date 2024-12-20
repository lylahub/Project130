import React, { useState, useEffect, useContext, useMemo } from 'react';
import Navbar from '../components/Navbar';
import '../css/GroupSplit/base.css';
import '../css/GroupSplit/expenseform.css';
import '../css/GroupSplit/groupcard.css';
import '../css/GroupSplit/model.css';
import '../css/GroupSplit/settlement.css';
import '../css/GroupSplit/transaction.css';
import { useUser } from '../userContext';
import { WebSocketContext } from '../WebsocketContext';
import { DollarSign, User, FileText, Users, Clock } from 'lucide-react';
import { BalancesChart } from '../chart'

//TODO: Balances update after pay is wrong
//TODO: After changing to another page, the new transactions will be cleared, not kept, prolly fetch again after that? 
//TODO: The above question is due to delay update, same occurred when logging in it cannot fetch groups on time
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Fetches the username associated with a given user ID.
 *
 * @param {string} uid - User ID.
 * @returns {Promise<string>} - Resolves to the username.
 * @throws {Error} If the request fails.
 */
const fetchUsername = async (uid) => {
  const response = await fetch(`${API_BASE_URL}/get-username/${uid}`);
  if (!response.ok) {
    throw new Error("Failed to fetch username");
  }
  const data = await response.json();
  return data.username;
};

/**
 * Fetches usernames for multiple user IDs.
 *
 * @param {Array<string>} participants - List of user IDs.
 * @returns {Promise<Object>} - Resolves to a mapping of user IDs to usernames.
 * @throws {Error} If the request fails.
 */
const fetchUsernamesForGroup = async (participants) => {
  try {
    const response = await fetch(`${API_BASE_URL}/get-usernames`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uids: participants }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch usernames");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching usernames:", error);
    return {};
  }
};

// Main expense management modal component - handles split bills and group expenses
/**
 * Component for managing expenses within a group.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.group - Group details.
 * @param {Object} props.uidToUsername - Mapping of user IDs to usernames.
 * @param {Function} props.onClose - Callback to close the modal.
 */
const ExpenseModal = ({ group, uidToUsername, onClose }) => {
  const { uid } = useUser();
  
  // Initialize expense input state with default structure
  const [expenseInputs, setExpenseInputs] = useState([
    {
      id: Date.now(),
      paidBy: '',
      amount: '',
      description: ''
    }
  ]);

  // Track split strategy and custom split calculations
  const [splitStrategy, setSplitStrategy] = useState("EqualSplit");
  const [customSplits, setCustomSplits] = useState({});
  const [settlementResults, setSettlementResults] = useState({
    totalExpense: 0,
    perPersonShare: 0,
    settlements: [],
    shares: {}
  });

  // Manage transaction display and balance tracking
  const [entriesInfo, setEntriesInfo] = useState(group.entriesInfo || {});
  const [showTransactions, setShowTransactions] = useState(false);
  const [balances, setBalances] = useState(
    group && group.balances && group.balances[uid] ? group.balances[uid] : {}
  );
  
  // Utility function to format timestamps into readable dates
  /**
   * Formats a timestamp into a readable date string.
   *
   * @param {Object|number|string} timestamp - The timestamp to format.
   * @returns {string} - Formatted date string or 'N/A' if invalid.
   */
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
    return 'Invalid Date';
  };

  // Handler for switching between equal and custom split strategies
  /**
   * Handles the change in split strategy.
   *
   * @param {Object} e - Event object.
   */
  const handleStrategyChange = (e) => {
    setSplitStrategy(e.target.value);
    setSettlementResults({ ...settlementResults, settlements: [] });
  };

  // Manage participant ratios for custom splits
  /**
   * Handles changes to custom split percentages.
   *
   * @param {string} participant - Participant ID.
   * @param {string} value - Custom percentage value.
   */
  const handleCustomSplitChange = (participant, value) => {
    setCustomSplits({
      ...customSplits,
      [participant]: parseFloat(value) || 0
    });
  };

  // Toggle transaction history visibility
  const handleShowTransactions = () => {
    setShowTransactions(!showTransactions);
  };

  // Validate custom split percentages sum to 100%
  /**
   * Checks if the custom split percentages sum to 100%.
   *
   * @returns {boolean} - True if valid, false otherwise.
   */
  const isPercentageValid = () => {
    const totalPercentage = Object.values(customSplits).reduce((sum, percentage) => sum + percentage, 0);
    return totalPercentage === 100;
  };

  // Add new expense entry and trigger websocket update
  const handleAddEntry = async () => {
    const response = await fetch(`${API_BASE_URL}/group/add-entry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: uid,
        groupId: group.groupId,
        payer: expenseInputs[0].paidBy,
        amount: expenseInputs.reduce((sum, input) => sum + parseFloat(input.amount), 0),
        memo: expenseInputs[0].description,
        shares: settlementResults.shares
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to add Entry");
    }
  };
  
  // Calculate expense splits based on selected strategy
  const handleCalculate = async () => {
    const isValid = expenseInputs.every(input => input.paidBy && input.amount && input.description);

    if (!isValid) {
      alert("Please fill in all expense details before calculating.");
      return;
    }

    if (splitStrategy === "CustomSplit" && !isPercentageValid()) {
      alert("The total percentage must be exactly 100%. Please adjust the values.");
      return;
    }

    const amount = expenseInputs.reduce((sum, input) => sum + parseFloat(input.amount), 0);
    const payer = expenseInputs[0].paidBy;

    try {
      // Call API to calculate settlements based on split strategy
      const response = await fetch(`${API_BASE_URL}/group/calculate-settlement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: uid,
          groupId: group.groupId,
          payer,
          amount,
          splitStrategy,
          split: customSplits
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to calculate settlement");
      }

      const result = await response.json();
      setSettlementResults(result);
    } catch (error) {
      console.error("Error calculating settlement:", error);
    }
  };
  
  // Process payments and update transaction statuses
  /**
   * Handles the payment of balances and updates transaction statuses.
   *
   * @param {string} debtor - User ID of the person who owes the balance.
   * @param {number|null} [payAmount=null] - Optional specific amount to pay.
   * @param {string|null} [entryId=null] - Optional ID of the specific transaction entry.
   */
  const handlePayBalances = async (debtor, payAmount = null, entryId = null) => {
    const amount = balances.owes[debtor] || 0;
    if (!amount) {
      alert("No balance right now!");
      return;
    }
    try {
      // Step 1: Process the payment
      const payBalanceResponse = await fetch(`${API_BASE_URL}/group/pay-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: uid,
          groupId: group.groupId,
          payer: uid,
          payee: debtor,
          amount: payAmount,
        }),
      });
  
      if (!payBalanceResponse.ok) {
        throw new Error("Failed to clear balance");
      }
  
      // Step 2: Mark transactions as paid
      if (entryId) {
        // Mark specific transaction as paid
        const markTransactionResponse = await fetch(`${API_BASE_URL}/group/mark-paid`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: uid,
            groupId: group.groupId,
            transactionId: entryId,
            payer: debtor,
          }),
        });
  
        if (!markTransactionResponse.ok) {
          throw new Error("Failed to mark transaction as paid");
        }
      } else {
        // Mark all relevant transactions as paid
        const markAllResponse = await fetch(`${API_BASE_URL}/group/mark-all-paid`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: uid,
            groupId: group.groupId,
            payer: debtor,
          }),
        });
  
        if (!markAllResponse.ok) {
          throw new Error("Failed to mark all transactions as paid");
        }
      }
    } catch (error) {
      console.error("Error updating balances:", error);
    }
  };  

  // Update local state when group data changes
  /**
   * Updates the state when group data changes.
   *
   * @param {Object} group - Group data.
   */
  useEffect(() => {
    if (group.entriesInfo) {
      setEntriesInfo(group.entriesInfo || {});
      setBalances(group.balances?.[uid] || {});
    }
  }, [group.entriesInfo], [group.balances]);
  

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{group.groupName}</h2>
          <div className="modal-header-right">
            <button className="show-transactions-btn" onClick={handleShowTransactions}>
              {showTransactions ? "Hide Transactions" : "Show Transactions"}
            </button>
            <button className="close-button" onClick={onClose}>&times;</button>
          </div>
        </div>
  
        <div className="modal-body">
          {/* Balances Section */}
          <div className="balances-section">
            <h4>Balances</h4>
            {/* Chart Visualization */}
            <div className="balances-chart">
              {balances && balances.owes && Object.keys(balances.owes).length > 0 ? (
                <BalancesChart balances={balances} uidToUsername={uidToUsername} />
              ) : (
                <p className="no-balances">No outstanding balances.</p>
              )}
            </div>
            {balances && balances.owes && Object.keys(balances.owes).length > 0 ? (
              <div className="balances-list">
                {Object.entries(balances.owes).map(([debtor, amount]) => (
                  <div key={debtor} className="balance-item">
                    {amount < 0 ? (
                      <>
                        <p>
                          <strong>You owe {uidToUsername[debtor] || debtor}:</strong> 
                          <span className="amount negative">
                            ${Math.abs(parseFloat(amount)).toFixed(2)}
                          </span>
                        </p>
                        <button
                          className="pay-button"
                          onClick={() => handlePayBalances(debtor)}
                        >
                          Pay All
                        </button>
                      </>
                    ) : (
                      <p>
                        <strong>{uidToUsername[debtor] || debtor} owes you:</strong> 
                        <span className="amount positive">
                          ${parseFloat(amount).toFixed(2)}
                        </span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-balances">No outstanding balances.</p>
            )}
          </div>
  
          {/* Expense Details */}
          <div className="expense-input">
            <h3>Expense Details</h3>
            <div className="expense-form">
              <select
                value={expenseInputs[0].paidBy}
                onChange={(e) => setExpenseInputs([{ ...expenseInputs[0], paidBy: e.target.value }])}
              >
                <option value="">Who paid?</option>
                {group.participants.map((participant) => (
                  <option key={participant} value={participant}>
                    {uidToUsername[participant] || participant}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Amount"
                value={expenseInputs[0].amount}
                onChange={(e) =>
                  setExpenseInputs([{ ...expenseInputs[0], amount: e.target.value }])
                }
              />
              <input
                type="text"
                placeholder="Description"
                value={expenseInputs[0].description}
                onChange={(e) =>
                  setExpenseInputs([{ ...expenseInputs[0], description: e.target.value }])
                }
              />
            </div>
          </div>
  
          {/* Settlement Summary */}
          <div className="settlement-summary">
            <div className="settlement-header">
              <div className="settlement-title-section">
                <h3>Settlement Summary</h3>
                <div className="strategy-section">
                  <label>Select Strategy:</label>
                  <select value={splitStrategy} onChange={handleStrategyChange}>
                    <option value="EqualSplit">Equal Split</option>
                    <option value="CustomSplit">Custom Split</option>
                  </select>
                </div>
              </div>

              <div className="settlement-actions">
                <button className="split-button" onClick={handleCalculate}>
                  Calculate Split
                </button>
                {settlementResults.settlements.length > 0 && (
                  <button className="add-entry-button" onClick={handleAddEntry}>
                    Add Entry
                  </button>
                )}
              </div>
            </div>

            <div className="summary-card">
              <h4>Total Expense</h4>
              <div className="total-amount">
                ${settlementResults.totalExpense.toFixed(2)}
              </div>
            </div>

            {splitStrategy === "CustomSplit" && (
              <div className="custom-split-section">
                <h4>Custom Split Ratios</h4>
                <div className="custom-split-list">
                  {group.participants.map((participant) => (
                    <div key={participant} className="participant-split">
                      <label>{uidToUsername[participant] || participant}:</label>
                      <input
                        type="number"
                        placeholder="Enter ratio in %"
                        value={customSplits[participant] || ""}
                        onChange={(e) => handleCustomSplitChange(participant, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {settlementResults.settlements.length > 0 && (
              <div className="settlements-list">
                {settlementResults.settlements.map((settlement, index) => (
                  <div key={index} className="settlement-item">
                    <div className="settlement-details">
                      <span className="from-tag">{uidToUsername[settlement.from] || settlement.from}</span>
                      <span className="settlement-arrow">→</span>
                      <span className="to-tag">{uidToUsername[settlement.to] || settlement.to}</span>
                    </div>
                    <div className="settlement-amount">
                      ${parseFloat(settlement.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
  
          {/* Transaction List */}
          {showTransactions && (
            <div className="transaction-list">
              <h3>Transactions</h3>
              
              {Object.keys(entriesInfo || {}).length === 0 ? (
                <p className="no-transactions">No transactions available.</p>
              ) : (
                Object.entries(entriesInfo).map(([entryId, entry]) => (
                  <div key={entryId} className="transaction-item">
                    {/* Transaction Item Content */}
                    <div className="transaction-content">
              <div className="transaction-info">
                <div className="info-row">
                  <User className="icon" />
                  <span className="label">Payer:</span>
                  <span className="value">{uidToUsername[entry.payer] || entry.payer}</span>
                </div>
                <div className="info-row">
                  <DollarSign className="icon" />
                  <span className="label">Amount:</span>
                  <span className="value amount">
                    ${parseFloat(entry.amount).toFixed(2)}
                  </span>
                </div>
                <div className="info-row">
                  <FileText className="icon" />
                  <span className="label">Description:</span>
                  <span className="value">{entry.memo || "No description"}</span>
                </div>
                <div className="info-row timestamp">
                  <Clock className="icon" />
                  <span className="label">Created At:</span>
                  <span className="value">{formatTimestamp(entry.created_at)}</span>
                </div>
              </div>

              <div className="vertical-line"></div>

              <div className="participants-info">
                <div className="participants-header">
                  <Users className="icon" />
                  Participants:
                </div>
                <div className="participants-list">
                  {Object.entries(entry.participants || {}).map(([participant, share]) => (
                    <div key={participant} className="participant-row">
                      <span>{uidToUsername[participant] || participant}</span>
                      <span className={`share ${participant === entry.payer ? 'income' : 'expense'}`}>
                        ${parseFloat(share).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                        
                        {/* Pay Button & Paid Label */}
                        <div className="payment-status">
                          {entry.payer !== uid && (!entry.paidStatus?.[uid] || entry.paidStatus[uid] !== true) && (
                            <button
                              className="pay-button"
                              onClick={() => {
                                handlePayBalances(entry.payer, entry.participants[uid], entryId);
                              }}
                            >
                              Pay
                            </button>
                          )}
                          {entry.payer !== uid && entry.paidStatus?.[uid] === true && (
                            <span className="paid-label">Paid</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  
  
                      };  

const GroupSplit = () => {
  const [groups, setGroups] = useState({});
  const [groupName, setGroupName] = useState(""); // 新增 groupName 状态
  const [participantEmails, setParticipantEmails] = useState(""); // 新增 participantEmails 状态
  const [selectedGroup, setSelectedGroup] = useState(null);
  const { uid } = useUser();
  const [username, setUsername] = useState('');
  const [uidToUsername, setUidToUsername] = useState({});
  const socket = useContext(WebSocketContext);
  const [loading, setLoading] = useState(true); 


  // 处理创建群组
  /**
   * Handles the creation of a new group.
   */
  const handleCreateGroup = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/group/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: uid,
          groupName: groupName,
          participantEmails: participantEmails.split(',').map(email => email.trim()) // 将用户输入转换为数组
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Group '${groupName}' created successfully!`);
        handleFetchGroups(); // 刷新群组列表
      } else {
        alert(`Failed to create group: ${data.error}`);
        console.error(data.details);
      }
    } catch (error) {
      console.error("Error creating group:", error);
      //alert("There was an error creating the group.");
    }
  };

  // group information
  /**
   * Fetches the groups the user is part of.
   */
  const handleFetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/group/fetch-groups?userId=${uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      if (data.groups) {
        setGroups(data.groups);
        // Extract all participant UIDs
        const allParticipants = new Set();
        Object.values(data.groups).forEach(group => {
          group.participants.forEach(uid => allParticipants.add(uid));
        });

        // Fetch usernames for all UIDs
        const usernames = await fetchUsernamesForGroup(Array.from(allParticipants));
        setUidToUsername(usernames);
        console.log("Groups", data.groups);
      } else {
        console.error("Failed to fetch groups:", data.error);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

 /*  const updateEntriesForGroup = async (entry, groupId, entryId) => {
    try {
      const balances = entry.balances
      const newEntry = {
        amount: entry.amount,
        created_at: entry.created_at,
        participants: entry.participants,
        memo: entry.memo,
        payer: entry.payer,
        paidStatus: entry.paidStatus
      };
  
      // Update group state with new entries and balances (avoid redundant fetching, only addd the new information)
      setGroups((prevGroups) => ({
        ...prevGroups,
        [groupId]: {
          ...prevGroups[groupId],
          entriesInfo: {
            ...prevGroups[groupId].entriesInfo,
            [entryId]: newEntry,
          },
          balances: balances
        },
      }));
    } catch (error) {
      console.error("Error updating entries and balances:", error.message);
    }
  }; */
  /**
   * Updates entries and balances for a specific group.
   *
   * @param {Object} entry - Entry data.
   * @param {string} groupId - ID of the group.
   * @param {string} entryId - ID of the entry.
   */
  const updateEntriesForGroup = async (entry, groupId, entryId) => {
    try {
      const balances = entry.balances; 
      const newEntry = {
        amount: entry.amount,
        created_at: entry.created_at,
        participants: entry.participants,
        memo: entry.memo,
        payer: entry.payer,
        paidStatus: entry.paidStatus,
      };
  
      // Update group state with new entries and updated balances
      setGroups((prevGroups) => {
        const currentBalances = prevGroups[groupId]?.balances || {};
  
        const updatedBalances = { ...currentBalances };
        Object.keys(balances).forEach((user) => {
          updatedBalances[user] = {
            ...currentBalances[user],
            owes: {
              ...currentBalances[user]?.owes,
              ...balances[user]?.owes,
            },
          };
        });
  
        return {
          ...prevGroups,
          [groupId]: {
            ...prevGroups[groupId],
            entriesInfo: {
              ...prevGroups[groupId].entriesInfo,
              [entryId]: newEntry,
            },
            balances: updatedBalances,
          },
        };
      });
    } catch (error) {
      console.error("Error updating entries and balances:", error.message);
    }
  };

  /**
   * Updates the balances for a specific group.
   *
   * @param {string} payer - User ID of the payer.
   * @param {string} payee - User ID of the payee.
   * @param {Object} entryPayer - Balance data for the payer.
   * @param {Object} entryPayee - Balance data for the payee.
   * @param {string} groupId - ID of the group.
   */
  const updateBalancesForGroup = (payer, payee, entryPayer, entryPayee, groupId) => {
    try {
        const newPayerBalance = entryPayer.owes[payee];  // Amount owed by the payer to the payee
        const newPayeeBalance = entryPayee.owes[payer];  // Amount owed by the payee to the payer

        setGroups((prevGroups) => {
            const currentBalances = prevGroups[groupId]?.balances || {};
            const currentUserBalance = currentBalances[uid] || {}; 
            const currentOwes = { ...currentUserBalance.owes }; 

            if (payer === uid) {
                currentOwes[payee] = newPayerBalance;
            }
            if (payee === uid) {
                currentOwes[payer] = newPayeeBalance;
            }

            const updatedBalances = {
                ...currentBalances,
                [uid]: {
                    ...currentUserBalance,
                    owes: currentOwes, 
                },
            };

            return {
                ...prevGroups,
                [groupId]: {
                    ...prevGroups[groupId],
                    balances: updatedBalances,
                },
            };
        });

        //console.log("Updated balances:", groups[groupId]?.balances);
      } catch (error) {
          console.error("Error updating balances for group:", error.message);
      }
  };

  const allParticipantUids = useMemo(() => {
    const uids = new Set();

    Object.values(groups).forEach((group) => {
      // Add participants to the set
      group.participants.forEach((participant) => uids.add(participant));

      // Add UIDs from balances to the set
      if (group.balances) {
        Object.keys(group.balances).forEach((uid) => uids.add(uid));
      }
    });

    return [...uids]; // Convert Set to Array
  }, [groups]);



  useEffect(() => {
    const fetchData = async () => {
      // Fetch the username based on the uid
      const fetchedUsername = await fetchUsername(uid);
      setUsername(fetchedUsername);
    };

    fetchData();

    if (uid) {
      handleFetchGroups();
    }
    
  }, [uid]);

  // fetch all uid
  useEffect(() => {
    const fetchUsernamesForAll = async () => {
      const uncachedUids = Array.from(allParticipantUids).filter((uid) => !uidToUsername[uid]);
      if (uncachedUids.length > 0) {
        const fetchedUsernames = await fetchUsernamesForGroup(uncachedUids); // Batch API call
        setUidToUsername((prev) => ({ ...prev, ...fetchedUsernames }));
      }
    };
  
    fetchUsernamesForAll();
  }, [allParticipantUids]); // Dependency only on `allParticipantUids`  

  // WebSocket
  useEffect(() => {
    if (socket) {
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.action === 'newGroup') {
                // Update the new group information
                setGroups((prevGroups) => ({
                    ...prevGroups,
                    [message.groupId]: message.entry,
                }));
            } else if (message.action === 'newEntry') {
                // Update entries and balances for the specific group
                updateEntriesForGroup(message.entry, message.groupId, message.entryId);
                console.log("Entered in GroupSplit newEntry with new balances with message", message);
            } else if (message.action === 'newBalance') {
                // Update balances for a group when balance is updated
                updateBalancesForGroup(message.payer, message.payee, message.entryPayer, message.entryPayee, message.groupId);
                //console.log("Updated balances for group:", message.groupId, message.entryPayee);
            } else if (message.action === 'markPaid') {
                // Handle a single transaction marked as paid
                setGroups((prevGroups) => {
                    const updatedEntries = {
                        ...prevGroups[message.groupId].entriesInfo,
                        [message.transactionId]: {
                            ...prevGroups[message.groupId].entriesInfo[message.transactionId],
                            paidStatus: {
                                ...prevGroups[message.groupId].entriesInfo[message.transactionId].paidStatus,
                                [message.userId]: true, // Only update paidStatus for the userId
                            },
                        },
                    };

                    return {
                        ...prevGroups,
                        [message.groupId]: {
                            ...prevGroups[message.groupId],
                            entriesInfo: updatedEntries,
                        },
                    };
                });
            } else if (message.action === 'markAllPaid') {
                // Handle all transactions for a participant marked as paid
                setGroups((prevGroups) => {
                    const updatedEntries = { ...prevGroups[message.groupId].entriesInfo };

                    Object.keys(updatedEntries).forEach((entryId) => {
                        const entry = updatedEntries[entryId];
                        if (entry.participants && entry.participants[message.userId]) {
                            if (!entry.paidStatus) entry.paidStatus = {};
                            entry.paidStatus[message.userId] = true; // Mark the userId as paid
                        }
                    });

                    return {
                        ...prevGroups,
                        [message.groupId]: {
                            ...prevGroups[message.groupId],
                            entriesInfo: updatedEntries,
                        },
                    };
                });
            }
        };
    }

    return () => {
        if (socket) {
            socket.onmessage = null; // Cleanup on unmount
        }
    };
}, [socket]);





  const handleGroupClick = (group) => {
    setSelectedGroup(group);
  };

const GroupCard = ({ group, onClick }) => {
  const { uid } = useUser();  // 添加這行來獲取當前用戶ID
  
  // 計算餘額總和的函數
  const calculateTotalBalance = () => {
    if (group.balances && group.balances[uid] && group.balances[uid].owes) {
      // 計算所有欠款的總和
      return Object.values(group.balances[uid].owes).reduce((sum, amount) => {
        // 如果是負數（我們欠別人的）就減去，如果是正數（別人欠我們的）就加上
        return sum + parseFloat(amount);
      }, 0);
    }
    return 0;
  };

  // 格式化創建時間
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      // 處理 Firestore Timestamp 對象
      if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
        const date = new Date(timestamp.seconds * 1000);
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date);
      }
      
      // 處理普通的 Date 對象
      if (timestamp instanceof Date) {
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(timestamp);
      }

      // 處理時間戳字符串
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(date);
        }
      }

      // 處理數字型時間戳
      if (typeof timestamp === 'number') {
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date);
      }
      
      return 'N/A';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const totalBalance = calculateTotalBalance();
  
  return (
    <div className="group-card" onClick={onClick}>
      <div className="group-card-header">
        <h3>{group.groupName}</h3>
        <span className="group-date">
          {formatDate(group.created_at)}
        </span>
      </div>
      
      <div className="group-meta">
        <div className="meta-item">
          <i className="fas fa-users"></i>
          <span>{group.participants.length} members</span>
        </div>
        <div className="group-total">
          Total: <span className={totalBalance >= 0 ? 'positive' : 'negative'}>
            ${Math.abs(totalBalance).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="group-split-container">
      <Navbar username={username} />
      <div className="group-split-content">
        <div className="group-split-header">
          <input 
            type="text" 
            placeholder="Group Name" 
            value={groupName} 
            onChange={(e) => setGroupName(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="Participant Emails (comma separated)" 
            value={participantEmails} 
            onChange={(e) => setParticipantEmails(e.target.value)}
          />
          <button className="create-group-btn" onClick={handleCreateGroup}>
            Create New Group
          </button>
        </div>

        <div className="groups-grid">
          {Object.keys(groups).length === 0 ? (
            <div className="no-groups">
              <p>You haven't created any groups yet.</p>
              <p>Start by creating a new group!</p>
            </div>
          ) : Object.values(groups).map(group => (
            <GroupCard 
              key={group.groupId}
              group={group}
              onClick={() => handleGroupClick(group)}
            />
          ))}
        </div>

        {selectedGroup && (
          <ExpenseModal 
          /* reload when the entry info is updated */
            key={JSON.stringify(groups[selectedGroup.groupId].entriesInfo)}
            group={groups[selectedGroup.groupId]}
            uidToUsername={uidToUsername} // Pass uidToUsername
            socket={socket} 
            onClose={() => setSelectedGroup(null)} 
          />
        )}
      </div>
    </div>
  );
};

export default GroupSplit;