import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    username: "",
    email: "",
    avatar: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempUser, setTempUser] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    // Load user data from localStorage or API
    const userData = {
      username: localStorage.getItem("username") || "User",
      email: localStorage.getItem("email") || "user@example.com",
      avatar: localStorage.getItem("avatar") || null
    };
    setUser(userData);
    setTempUser(userData);
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setTempUser({ ...user });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempUser({ ...user });
    setPreviewUrl(null);
  };

  const handleSave = () => {
    // Save user data
    setUser({ ...tempUser });
    localStorage.setItem("username", tempUser.username);
    localStorage.setItem("email", tempUser.email);
    if (previewUrl) {
      localStorage.setItem("avatar", previewUrl);
    }
    setIsEditing(false);
    setPreviewUrl(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setTempUser(prev => ({
        ...prev,
        avatar: url
      }));
    }
  };

  const handleRemoveAvatar = () => {
    setTempUser(prev => ({
      ...prev,
      avatar: null
    }));
    setPreviewUrl(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleGoBack = () => {
    navigate("/");
  };

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        <header className="profile-header">
          <button className="back-btn" onClick={handleGoBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            กลับ
          </button>
          <h1 className="page-title">โปรไฟล์</h1>
          <div></div>
        </header>

        <main className="profile-main">
          <div className="profile-card">
            <div className="avatar-section">
              <div className="avatar-container">
                {(previewUrl || tempUser.avatar || user.avatar) ? (
                  <img 
                    src={previewUrl || tempUser.avatar || user.avatar} 
                    alt="Avatar" 
                    className="avatar-image"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                )}
                
                {isEditing && (
                  <div className="avatar-actions">
                    <label className="upload-btn" htmlFor="avatar-upload">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17,8 12,3 7,8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    {(tempUser.avatar || previewUrl) && (
                      <button className="remove-btn" onClick={handleRemoveAvatar}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="profile-info">
              <div className="info-group">
                <label>ชื่อผู้ใช้</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={tempUser.username}
                    onChange={handleInputChange}
                    className="profile-input"
                    placeholder="กรุณาใส่ชื่อผู้ใช้"
                  />
                ) : (
                  <div className="info-value">{user.username}</div>
                )}
              </div>

              <div className="info-group">
                <label>อีเมล</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={tempUser.email}
                    onChange={handleInputChange}
                    className="profile-input"
                    placeholder="กรุณาใส่อีเมล"
                  />
                ) : (
                  <div className="info-value">{user.email}</div>
                )}
              </div>
            </div>

            <div className="profile-actions">
              {isEditing ? (
                <div className="edit-actions">
                  <button className="save-btn" onClick={handleSave}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17,21 17,13 7,13 7,21"/>
                      <polyline points="7,3 7,8 15,8"/>
                    </svg>
                    บันทึก
                  </button>
                  <button className="cancel-btn" onClick={handleCancel}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <div className="view-actions">
                  <button className="edit-btn" onClick={handleEdit}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    แก้ไขโปรไฟล์
                  </button>
                  <button className="logout-btn" onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16,17 21,12 16,7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16,17 21,12 16,7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>lt Profile;
    </div>
  );}export default Profile;