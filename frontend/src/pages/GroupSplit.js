import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import '../css/GroupSplit/base.css';
import '../css/GroupSplit/expenseform.css';
import '../css/GroupSplit/groupcard.css';
import '../css/GroupSplit/model.css';
import '../css/GroupSplit/settlement.css';
import '../css/GroupSplit/transaction.css';
import { useUser } from '../userContext';
import { WebSocketContext } from '../WebsocketContext';

//TODO: Balances update after pay is wrong
//TODO: After changing to another page, the new transactions will be cleared, not kept, prolly fetch again after that? 
//TODO: The above question is due to delay update, same occurred when logging in it cannot fetch groups on time
//TODO: new entry only shows up after refreash the page
const ExpenseModal = ({ group, onClose }) => {
  const { uid } = useUser();
  const [expenseInputs, setExpenseInputs] = useState([
    {
      id: Date.now(),
      paidBy: '',
      amount: '',
      description: ''
    }
  ]);
  const [splitStrategy, setSplitStrategy] = useState("EqualSplit");
  const [customSplits, setCustomSplits] = useState({});
  const [settlementResults, setSettlementResults] = useState({
    totalExpense: 0,
    perPersonShare: 0,
    settlements: [],
    shares: {}
  });
  const [entriesInfo, setEntriesInfo] = useState(group.entriesInfo || {});
  const [showTransactions, setShowTransactions] = useState(false);
  const [balances, setBalances] = useState(
    group && group.balances && group.balances[uid] ? group.balances[uid] : {}
  );
  
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
  
  //changing concrete strategies
  const handleStrategyChange = (e) => {
    setSplitStrategy(e.target.value);
    setSettlementResults({ ...settlementResults, settlements: [] });
  };

  const handleCustomSplitChange = (participant, value) => {
    setCustomSplits({
      ...customSplits,
      [participant]: parseFloat(value) || 0
    });
  };

  const handleShowTransactions = () => {
    setShowTransactions(!showTransactions);
  };

  const isPercentageValid = () => {
    const totalPercentage = Object.values(customSplits).reduce((sum, percentage) => sum + percentage, 0);
    return totalPercentage === 100;
  };

  //Adding entry, message will be propagated via websocket to update the UI
  const handleAddEntry = async () => {
    const response = await fetch("http://localhost:3001/group/add-entry", {
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
  
  //calculate the inputs depending on the chosen strategy
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
    const payer = expenseInputs[0].paidBy; //this can be simplified

    try {
      const response = await fetch("http://localhost:3001/group/calculate-settlement", {
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

      //result = shares
      const result = await response.json();
      setSettlementResults(result);
    } catch (error) {
      console.error("Error calculating settlement:", error);
    }
  };
  
  //logic for paying balances
  const handlePayBalances = async (debtor, payAmount = null, entryId = null) => {
    //balances is stored as 
    const amount = balances.owes[debtor] || 0; // pay to who
    if (!amount) {
      alert("No balance right now!");
      return;
    }
    try {
      // Step 1: Pay the balance
      const payBalanceResponse = await fetch("http://localhost:3001/group/pay-balance", {
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
  
      //Mark as paid (specific transaction or all)
      if (entryId) {
        console.log("Entry ID")
        // Mark the specific transaction as paid
        const markTransactionResponse = await fetch("http://localhost:3001/group/mark-paid", {
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
  
        const markTransactionData = await markTransactionResponse.json();
        console.log("Transaction marked as paid:", markTransactionData);
      } else {
        // Mark all transactions involving the debtor as paid
        const markAllResponse = await fetch("http://localhost:3001/group/mark-all-paid", {
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
  
        const markAllData = await markAllResponse.json();
        console.log("All transactions marked as paid:", markAllData);
      }
    } catch (error) {
      console.error("Error updating balances:", error);
    }
  };  

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
            {balances && balances.owes && Object.keys(balances.owes).length > 0 ? (
              <div className="balances-list">
                {Object.entries(balances.owes).map(([debtor, amount]) => (
                  <div key={debtor} className="balance-item">
                    {amount < 0 ? (
                      <>
                        <p>
                          <strong>You owe {debtor}:</strong> ${Math.abs(parseFloat(amount)).toFixed(2)}
                        </p>
                        <button
                          className="pay-balance-btn"
                          onClick={() => handlePayBalances(debtor)}
                        >
                          Pay All
                        </button>
                      </>
                    ) : (
                      <p>
                        <strong>{debtor} owes you:</strong> ${parseFloat(amount).toFixed(2)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No outstanding balances.</p>
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
                    {participant}
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
            <h3>Settlement Summary</h3>
            
            <div className="strategy-selector">
              <label>Select Strategy:</label>
              <select value={splitStrategy} onChange={handleStrategyChange}>
                <option value="EqualSplit">Equal Split</option>
                <option value="CustomSplit">Custom Split</option>
              </select>
            </div>

            <div className="summary-card">
              <h4>Total Expense</h4>
              <div className="total-amount">${settlementResults.totalExpense.toFixed(2)}</div>
            </div>

            <div className="settlements-list">
              {settlementResults.settlements.map((settlement, index) => (
                <div key={index} className="settlement-item">
                  <div className="settlement-parties">
                    <span className="from">{settlement.from}</span>
                    <span className="arrow">→</span>
                    <span className="to">{settlement.to}</span>
                  </div>
                  <div className="settlement-amount">
                    ${parseFloat(settlement.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
  
          <button className="split-button" onClick={handleCalculate}>
            Calculate Split
          </button>
  
          {settlementResults.settlements.length > 0 && (
            <button className="add-entry-button" onClick={handleAddEntry}>
              Add Entry
            </button>
          )}
  
          {/* Transaction List */}
{showTransactions && (
  <div className="transaction-list">
    <h3>Transactions</h3>
    {Object.keys(entriesInfo || {}).length === 0 ? (
      <p className="no-transactions">No transactions available.</p>
    ) : (
      Object.entries(entriesInfo).map(([entryId, entry]) => (
        <div key={entryId} className="transaction-item">
          <div className="transaction-info">
            <div className="transaction-primary">
              <div className="payer-section">
                <span>Payer: {entry.payer}</span>
                <span className="amount">Amount: ${parseFloat(entry.amount).toFixed(2)}</span>
              </div>
              <div className="description-section">
                <span>Description: {entry.memo}</span>
              </div>
            </div>

            <div className="participants-section">
              <div className="participants-header">Participants:</div>
              <div className="participants-list">
                {Object.entries(entry.participants || {}).map(([participant, share]) => (
                  <div key={participant} className="participant-item">
                    <span className="participant-name">{participant}:</span>
                    <span className="participant-share">${parseFloat(share).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="transaction-footer">
            <span className="created-at">Created At: {formatTimestamp(entry.created_at)}</span>
            {entry.payer !== uid && (
              <div className="payment-status">
                {!entry.paidStatus[uid] || entry.paidStatus[uid] !== true ? (
                  <button
                    className="pay-button"
                    onClick={() => handlePayBalances(entry.payer, entry.participants[uid], entryId)}
                  >
                    Pay
                  </button>
                ) : (
                  <span className="paid-label">Paid</span>
                )}
              </div>
            )}
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
  const username = "Baby"; // 假设这是一个临时的用户名
  const socket = useContext(WebSocketContext);
  const [loading, setLoading] = useState(true); 


  // 处理创建群组
  const handleCreateGroup = async () => {
    try {
      const response = await fetch(`http://localhost:3001/group/create`, {
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
  const handleFetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/group/fetch-groups?userId=${uid}`, {
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
  const updateEntriesForGroup = async (entry, groupId, entryId) => {
    try {
      const balances = entry.balances; // 新的 balances 数据
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
        const currentBalances = prevGroups[groupId]?.balances || {}; // 获取当前的 balances
  
        // 更新每个相关欠款人的数据
        const updatedBalances = { ...currentBalances };
        Object.keys(balances).forEach((user) => {
          updatedBalances[user] = {
            ...currentBalances[user], // 保留旧数据
            owes: {
              ...currentBalances[user]?.owes, // 保留旧的 owes 数据
              ...balances[user]?.owes, // 更新新的 owes 数据
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
            balances: updatedBalances, // 只更新涉及的欠款人
          },
        };
      });
    } catch (error) {
      console.error("Error updating entries and balances:", error.message);
    }
  };
  

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


  useEffect(() => {
    if (uid) {
      handleFetchGroups();
    }
  }, [uid]);

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
    // 格式化創建時間
    const formatDate = (timestamp) => {
      if (!timestamp) return 'N/A';
      
      // 檢查是否是 Firestore Timestamp 對象
      if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
        // 將 Firestore Timestamp 轉換為 JavaScript Date
        const date = new Date(timestamp.seconds * 1000);
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date);
      }
      
      // 如果是一般的 Date 對象
      if (timestamp instanceof Date) {
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(timestamp);
      }
  
      return 'Invalid Date';
    };
  
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
            Total: ${group.total || 0}
          </div>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return <div>Loading...</div>; // Display loading message until data is fetched
  }


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
            socket={socket} 
            onClose={() => setSelectedGroup(null)} 
          />
        )}
      </div>
    </div>
  );
};

export default GroupSplit;