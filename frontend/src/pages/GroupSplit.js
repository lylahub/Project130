// src/pages/GroupSplit.js
import React, { useState } from 'react';
import { useContext, useEffect } from 'react';
import Navbar from '../components/Navbar';
import '../css/GroupSplit.css';
import { useUser } from '../userContext';
import { WebSocketContext } from '../WebsocketContext';

const GroupSplit = () => {
  const [groups, setGroups] = useState([]);
  const { uid, setUid } = useUser();
  const username = "Baby"; // 這裡應該從用戶狀態獲取
  const socket = useContext(WebSocketContext);
  useEffect(() => {
    if (uid) {
      fetch(`http://localhost:3001/group/fetch-groups?userId=${uid}`)
        .then(response => response.json())
        .then(data => {
          if (data.groups) {
            setGroups(data.groups);
          } else {
            console.error("Failed to fetch groups:", data.error);
          }
        })
        .catch(error => console.error("Error fetching groups:", error));
    }
  }, [uid]);

  
  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.action === 'newGroup') {
          setGroups(prevGroups => [...prevGroups, message.group]);
        } else if (message.action === 'newEntry') {
          setGroups(prevGroups => 
            prevGroups.map(group => 
              group.id === message.groupId 
                ? { ...group, entries: [...group.entries, message.entry] } 
                : group
            )
          );
        }
      };
    }
  }, [socket]);



  return (
    <div className="group-split-container">
      <Navbar username={username} />
      <div className="group-split-content">
        <div className="group-split-header">
          <h1>Group Split</h1>
          <button className="create-group-btn">Create New Group</button>
        </div>

        <div className="groups-grid">
          {groups.length === 0 ? (
            <div className="no-groups">
              <p>You haven't created any groups yet.</p>
              <p>Start by creating a new group!</p>
            </div>
          ) : (
            groups.map(group => (
              <div key={group.id} className="group-card">
                <h3>{group.name}</h3>
                <p>{group.members.length} members</p>
                <p>Total: ${group.total}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupSplit;