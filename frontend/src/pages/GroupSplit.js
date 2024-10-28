// src/pages/GroupSplit.js
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import '../css/GroupSplit.css';

const GroupSplit = () => {
  const [groups, setGroups] = useState([]);
  const username = "Baby"; // 這裡應該從用戶狀態獲取

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