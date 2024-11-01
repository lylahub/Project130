// src/pages/Profile.js
import React, { useState } from 'react';
import Navbar from '../components/Navbar'; // Import Navbar component
import '../css/Profile.css'; // Import CSS for styling

// Main Profile component
const Profile = () => {
    // Profile state holds user information
    const [profile, setProfile] = useState({
        username: 'Baby',
        email: 'baby@example.com',
        profilePicture: '', // URL or uploaded image data for the profile picture
        bio: 'This is a sample bio.',
    });

    // State to manage edit mode, new password inputs
    const [isEditing, setIsEditing] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Handle input changes for profile information
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    // Handle image upload and display
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile((prev) => ({ ...prev, profilePicture: reader.result }));
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

    // Save profile changes and exit edit mode
    const handleSaveProfile = () => {
        setIsEditing(false); // Exit edit mode
        alert("Profile updated successfully!"); // Notify user
    };

    return (
        <div className="profile-container">
            {/* Navbar with username passed as prop */}
            <Navbar username={profile.username} />
            <div className="content-container">
                <div className="profile-section">
                    <h1>Profile</h1>

                    {/* Profile picture section */}
                    <div className="profile-picture">
                        <img
                            src={profile.profilePicture || 'https://via.placeholder.com/150'} // Default placeholder if no picture
                            alt="Profile"
                            className="profile-img"
                        />
                        {/* Allow uploading profile picture in edit mode */}
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
                                <p>{profile.username}</p> // Display only when not editing
                            )}
                        </div>

                        {/* Email field */}
                        <div className="form-group">
                            <label>Email</label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    name="email"
                                    value={profile.email}
                                    onChange={handleInputChange}
                                    placeholder="Enter your email"
                                />
                            ) : (
                                <p>{profile.email}</p> // Display only when not editing
                            )}
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
                                <p>{profile.bio}</p> // Display only when not editing
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
