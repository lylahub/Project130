import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../components/Navbar';
import '../css/GroupSplit.css';
import { useUser } from '../userContext';
import { WebSocketContext } from '../WebsocketContext';

const GroupSplit = () => {
  const [groups, setGroups] = useState({});
  const [groupName, setGroupName] = useState(""); // 新增 groupName 状态
  const [participantEmails, setParticipantEmails] = useState(""); // 新增 participantEmails 状态
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

  return (
    <div className="group-split-container">
      <Navbar username={username} />
      <div className="group-split-content">
        <div className="group-split-header">
          <h1>Group Split</h1>
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
          ) : (
            Object.values(groups).map(group => (
              <div key={group.groupId} className="group-card">
                <h3>{group.groupName}</h3>
                <p>{group.participants.length} members</p>
                <p>Total: ${group.total || 0}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupSplit;
