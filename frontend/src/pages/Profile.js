// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar'; // Import Navbar component
import '../css/Profile.css'; // Import CSS for styling
import { useUser } from '../userContext';

// Main Profile component
const Profile = () => {

    // Access `uid` from the global context
    const { uid } = useUser();
    
    // Profile state holds user information
    const [profile, setProfile] = useState({
        username: '',
        email: '',
        profile_pic: 'https://via.placeholder.com/150', // Default profile picture
        bio: '',
    });

    // State to manage edit mode, new password inputs
    const [isEditing, setIsEditing] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Fetch user profile from the backend
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(`http://localhost:3001/user/${uid}`); // Calls the backend `/user/:uid` endpoint
                const data = await response.json();
                setProfile({
                    username: data.username || "To be set",
                    email: data.email || "", // Email is always available from Firebase Auth
                    profile_pic: data.profile_pic || "https://via.placeholder.com/150",
                    bio: data.bio || "To be set",
                });
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };

        if (uid) fetchProfile();
    }, [uid]);

    // Handle input changes for profile information
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    // Handle profile picture upload
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const updatedProfile = { ...profile, profile_pic: reader.result }; // Save image as Base64 string
                setProfile(updatedProfile);

                // Update backend
                try {
                    await fetch(`http://localhost:3001/user/${uid}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ profile_pic: reader.result }),
                    });
                    alert("Profile picture updated successfully!");
                } catch (error) {
                    console.error("Error updating profile picture:", error);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle password change with validation
    const handlePasswordChange = (e) => {
        e.preventDefault();
        if (newPassword === confirmPassword) {
            alert("Password updated successfully!");
            setNewPassword(''); // Clear password fields
            setConfirmPassword('');
        } else {
            alert("Passwords do not match."); // Show error if passwords don't match
        }
    };

    // Save profile changes
    const handleSaveProfile = async () => {
        try {
            const updates = {
                username: profile.username,
                email: profile.email,
                bio: profile.bio,
            };

            await fetch(`http://localhost:3001/user/${uid}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });

            alert("Profile updated successfully!");
            setIsEditing(false); // Exit edit mode
        } catch (error) {
            console.error("Error saving profile:", error);
        }
    };

    return (
        <div className="profile-container">
            {/* Navbar with username passed as prop */}
            <Navbar username={profile.username} />
            <div className="content-container">
                <div className="profile-section">

                    {/* Profile picture section */}
                    <div className="profile-picture">
                        <img
                            src={profile.profile_pic === 'https://via.placeholder.com/150' 
                                ? require('../components/logo.png') // 假設 logo 是 PNG 格式
                                : profile.profile_pic}
                            alt="Profile"
                            className="profile-img"
                        />
                        {isEditing && (
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        )}
                    </div>

                    {/* Form to display and edit profile details */}
                    <form className="profile-form" onSubmit={(e) => e.preventDefault()}>

                        {/* Username field */}
                        <div className="form-group">
                            <label>Username</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="username"
                                    value={profile.username}
                                    onChange={handleInputChange}
                                    placeholder="Enter your username"
                                />
                            ) : (
                                <p>{profile.username || "To be set"}</p> // Display only when not editing
                            )}
                        </div>

                        {/* Email field */}
                        <div className="form-group">
                            <label>Email</label>
                            <p>{profile.email}</p> {/* Email is not editable */}
                        </div>

                        {/* Bio field */}
                        <div className="form-group">
                            <label>Bio</label>
                            {isEditing ? (
                                <textarea
                                    name="bio"
                                    value={profile.bio}
                                    onChange={handleInputChange}
                                    placeholder="Write a short bio"
                                    rows="4"
                                />
                            ) : (
                                <p>{profile.bio || "To be set"}</p> // Display only when not editing
                            )}
                        </div>

                        {/* Password Change Section (visible only in edit mode) */}
                        {isEditing && (
                            <div className="password-section">
                                <h2>Change Password</h2>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                    />
                                </div>
                                <button onClick={handlePasswordChange} className="change-password-button">
                                    Update Password
                                </button>
                            </div>
                        )}

                        {/* Buttons for Edit, Save, and Cancel actions */}
                        <div className="profile-buttons">
                            {isEditing ? (
                                <>
                                    <button onClick={handleSaveProfile} className="save-button">Save Profile</button>
                                    <button onClick={() => setIsEditing(false)} className="cancel-button">Cancel</button>
                                </>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="edit-button">Edit Profile</button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
