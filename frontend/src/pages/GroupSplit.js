import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import '../css/GroupSplit.css';
import { useUser } from '../userContext';
import { WebSocketContext } from '../WebsocketContext';


const ExpenseModal = ({ group, onClose }) => {
  const [expenses, setExpenses] = useState([]);
  const [expenseInputs, setExpenseInputs] = useState([
    {
      id: Date.now(),
      paidBy: '',
      amount: '',
      description: ''
    }
  ]);

  // const [settlementResults, setSettlementResults] = useState({
  //   totalExpense: 0,
  //   perPersonShare: 0,
  //   settlements: [] // 這將存儲誰需要支付給誰
  // });

  // this is example to show UI, please use above
  const [settlementResults, setSettlementResults] = useState({
    totalExpense: 245.50,
    perPersonShare: 81.83,  // 245.50 / 3 people
    settlements: [
      {
        from: "Charlie",
        to: "Alice",
        amount: 81.83
      },
      {
        from: "Bob",
        to: "Alice",
        amount: 36.33  // (200 - 45.50 - 81.83)
      }
    ]
  });

  // 新增一個輸入區塊
  const addExpenseInput = () => {
    setExpenseInputs([
      ...expenseInputs,
      {
        id: Date.now(),
        paidBy: '',
        amount: '',
        description: ''
      }
    ]);
  };

  // 移除特定輸入區塊
  const removeExpenseInput = (id) => {
    if (expenseInputs.length > 1) {
      setExpenseInputs(expenseInputs.filter(input => input.id !== id));
    }
  };

  // 處理輸入更改
  const handleInputChange = (id, field, value) => {
    setExpenseInputs(expenseInputs.map(input => 
      input.id === id ? { ...input, [field]: value } : input
    ));
  };

  // 清空輸入區域
  const handleClear = () => {
    setExpenseInputs([
      {
        id: Date.now(),
        paidBy: '',
        amount: '',
        description: ''
      }
    ]);
  };

  // 處理計算
  const handleCalculate = () => {
    // 驗證所有輸入是否完整
    const isValid = expenseInputs.every(input => 
      input.paidBy && input.amount && input.description
    );

    if (!isValid) {
      alert("Please fill in all expense details before calculating.");
      return;
    }

    // 將有效的支出添加到expenses列表
    const validExpenses = expenseInputs.map(input => ({
      paidBy: input.paidBy,
      amount: parseFloat(input.amount),
      description: input.description
    }));

    setExpenses([...expenses, ...validExpenses]);
    
    // 不再自動清空輸入區域
  };

  const handleDeleteGroup = () => {
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      // TODO: 實現刪除群組的邏輯
      // console.log('Delete group:', group.groupId);
      onClose(); // 關閉 modal
    }
  };


  const ExpenseResults = () => {
    // 如果還沒有結算結果，顯示提示信息
    if (!settlementResults.settlements.length) {
      return (
        <div className="expense-results">
          <h3>Settlement Summary</h3>
          <p className="no-expenses">Add expenses and calculate to see the settlement summary</p>
        </div>
      );
    }

    return (
      <div className="expense-results">
        <h3>Settlement Summary</h3>
        
        {/* 總覽卡片 */}
        <div className="expense-summary">
          <div className="summary-card">
            <h4>Total Expense</h4>
            <div className="summary-amount">${settlementResults.totalExpense}</div>
          </div>
          <div className="summary-card">
            <h4>Per Person</h4>
            <div className="summary-amount">${settlementResults.perPersonShare}</div>
          </div>
        </div>

        {/* 結算列表 */}
        <div className="settlement-list">
          {settlementResults.settlements.map((settlement, index) => (
            <div key={index} className="settlement-item">
              <div className="settlement-details">
                <span className="expense-tag tag-paid">{settlement.from}</span>
                <span className="settlement-arrow">→</span>
                <span className="expense-tag tag-owe">{settlement.to}</span>
              </div>
              <div className="settlement-amount">
                ${settlement.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-header-left">
            <h2>{group.groupName}</h2>
          </div>
          <div className="modal-header-right">
            <button 
              className="delete-group-btn"
              onClick={handleDeleteGroup}
            >
              Delete Group
            </button>
            <button className="close-button" onClick={onClose}>
              &times;
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* 支出輸入區 */}
          <div className="expense-input">
            <div className="expense-header">
              <h3>Add Expense</h3>
              <div className="expense-header-buttons">
                <button className="add-more-btn" onClick={addExpenseInput}>
                  Add More +
                </button>
                <button className="clear-btn" onClick={handleClear}>
                  Clear
                </button>
              </div>
            </div>
            
            {expenseInputs.map((input, index) => (
              <div key={input.id} className="expense-form">
                <select
                  value={input.paidBy}
                  onChange={(e) => handleInputChange(input.id, 'paidBy', e.target.value)}
                >
                  <option value="">Who paid?</option>
                  {group.participants.map(participant => (
                    <option key={participant} value={participant}>
                      {participant}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Amount"
                  value={input.amount}
                  onChange={(e) => handleInputChange(input.id, 'amount', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={input.description}
                  onChange={(e) => handleInputChange(input.id, 'description', e.target.value)}
                />
                {expenseInputs.length > 1 && (
                  <button 
                    className="remove-expense-btn"
                    onClick={() => removeExpenseInput(input.id)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <ExpenseResults />
          {/* Calculate Split按鈕 */}
          <button className="split-button" onClick={handleCalculate}>
            Calculate Split
          </button>
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
        console.log(data);
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

  // 获取群组信息
  const handleFetchGroups = async () => {
    try {
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
      } else {
        console.error("Failed to fetch groups:", data.error);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  useEffect(() => {
    if (uid) {
      handleFetchGroups();
    }
  }, [uid]);

  // WebSocket 监听
  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.action === 'newGroup') {
          setGroups(prevGroups => ({
            ...prevGroups,
            [message.groupId]: message.entry
          }));
        } else if (message.action === 'newEntry') {
          setGroups(prevGroups => ({
            ...prevGroups,
            [message.groupId]: {
              ...prevGroups[message.groupId],
              entriesInfo: [...(prevGroups[message.groupId]?.entriesInfo || []), message.entry]
            }
          }));
        }
      };
    }

    return () => {
      if (socket) {
        socket.onmessage = null;
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
            group={selectedGroup} 
            onClose={() => setSelectedGroup(null)} 
          />
        )}
      </div>
    </div>
  );
};

export default GroupSplit;