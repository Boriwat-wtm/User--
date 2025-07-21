import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; 
import "./Upload.css";

function Upload() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const type = queryParams.get("type");
  const time = parseInt(queryParams.get("time")); 
  const price = queryParams.get("price");

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [textColor, setTextColor] = useState("white");

  const MAX_TEXT_LENGTH = 36;

  const handleTextChange = (e) => {
    const inputText = e.target.value;
    if (inputText.length <= MAX_TEXT_LENGTH) {
      setText(inputText);
      setAlertMessage("");
    } else {
      setAlertMessage(`ข้อความต้องไม่เกิน ${MAX_TEXT_LENGTH} ตัวอักษร`);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ตรวจสอบขนาดไฟล์ (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setAlertMessage("ขนาดไฟล์ต้องไม่เกิน 5MB");
        return;
      }
      setImage(file);
      setAlertMessage("");
    }
  };

  const handleUpload = () => {
    if (type === "image" && !image) {
      setAlertMessage("โปรดเลือกไฟล์รูปภาพ");
      return;
    }

    if (!text.trim()) {
      setAlertMessage("โปรดใส่ข้อความ");
      return;
    }

    setShowPreviewModal(true);
  };

  const handleAccept = async () => {
    const formData = new FormData();
    formData.append("text", text);
    formData.append("type", type);
    formData.append("time", time);
    formData.append("price", price);
    formData.append("textColor", textColor);

    if (type === "image" && image) {
      formData.append("file", image);
    }

    let sender = "Unknown";
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userObj = JSON.parse(user);
        sender = userObj.name || userObj.username || "Unknown";
      } catch {
        sender = "Unknown";
      }
    }
    formData.append("sender", sender);

    try {
      const response = await fetch("http://localhost:4000/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        // ใช้ uploadId โดยตรงโดยไม่เก็บใน state
        localStorage.setItem('pendingUploadId', result.uploadId);
        
        setShowPreviewModal(false);
        navigate(`/payment?uploadId=${result.uploadId}&price=${price}&type=${type}&time=${time}`);
      } else {
        throw new Error('Failed to upload');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      setAlertMessage("เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่");
    }
  };

  const handleEdit = () => {
    setShowPreviewModal(false);
  };

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="upload-container">
      <div className="upload-wrapper">
        <header className="upload-header">
          <button className="back-btn" onClick={handleGoBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1>สร้างเนื้อหา</h1>
          <div></div>
        </header>

        <main className="upload-main">
          <div className="content-card">
            <div className="package-info">
              <div className="package-detail">
                <span className="label">ประเภท:</span>
                <span className="value">{type === "image" ? "รูปภาพ + ข้อความ" : "ข้อความ"}</span>
              </div>
              <div className="package-detail">
                <span className="label">เวลาแสดง:</span>
                <span className="value">{time} นาที</span>
              </div>
              <div className="package-detail">
                <span className="label">ราคา:</span>
                <span className="value price">฿{price}</span>
              </div>
            </div>

            {type === "image" && (
              <div className="upload-section">
                <h3>อัปโหลดรูปภาพ</h3>
                <div className="file-upload-container">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    id="file-upload"
                    className="file-input"
                  />
                  <label htmlFor="file-upload" className="file-upload-label">
                    {image ? (
                      <div className="file-selected">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>เลือกไฟล์แล้ว: {image.name}</span>
                      </div>
                    ) : (
                      <div className="file-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <path d="M21 15l-5-5L5 21"/>
                        </svg>
                        <span>คลิกเพื่อเลือกรูปภาพ</span>
                        <small>รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 5MB</small>
                      </div>
                    )}
                  </label>
                </div>

                {image && (
                  <div className="image-preview-container">
                    <img src={URL.createObjectURL(image)} alt="Preview" className="preview-image" />
                    <div
                      className="preview-text-overlay"
                      style={{ 
                        color: textColor, 
                        textShadow: textColor === "white" ? "0 2px 8px rgba(0,0,0,0.8)" : "0 2px 8px rgba(255,255,255,0.8)"
                      }}
                    >
                      {text}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="text-section">
              <h3>ข้อความที่ต้องการแสดง</h3>
              <div className="text-input-container">
                <textarea
                  placeholder="พิมพ์ข้อความที่ต้องการแสดงบนหน้าจอ..."
                  value={text}
                  onChange={handleTextChange}
                  className="text-input"
                  maxLength={MAX_TEXT_LENGTH}
                />
                <div className="character-count">
                  <span className={text.length >= MAX_TEXT_LENGTH ? 'limit-reached' : ''}>
                    {text.length}/{MAX_TEXT_LENGTH}
                  </span>
                </div>
              </div>
            </div>

            <div className="color-section">
              <h3>สีข้อความ</h3>
              <div className="color-options">
                <label className={`color-option ${textColor === "white" ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="textColor"
                    value="white"
                    checked={textColor === "white"}
                    onChange={() => setTextColor("white")}
                  />
                  <div className="color-preview white"></div>
                  <span>สีขาว</span>
                </label>
                <label className={`color-option ${textColor === "black" ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="textColor"
                    value="black"
                    checked={textColor === "black"}
                    onChange={() => setTextColor("black")}
                  />
                  <div className="color-preview black"></div>
                  <span>สีดำ</span>
                </label>
              </div>
            </div>

            {alertMessage && (
              <div className="alert-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {alertMessage}
              </div>
            )}

            <div className="action-buttons">
              <button className="secondary-btn" onClick={handleShowModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9,9h6a3,3,0,0,1,0,6H9"/>
                  <path d="M9,15V9"/>
                </svg>
                ข้อกำหนด
              </button>
              <button className="primary-btn" onClick={handleUpload}>
                ดำเนินการต่อ
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </main>

        {/* Modal ข้อกำหนด */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>ข้อกำหนดการใช้งาน</h3>
                <button className="close-button" onClick={handleCloseModal}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="restrictions-content">
                  <h4>🚫 เนื้อหาที่ห้ามใช้</h4>
                  <ul>
                    <li>การโฆษณาที่ละเมิดกฎหมาย (การพนัน, แอลกอฮอล์, ยาเสพติด)</li>
                    <li>เนื้อหาลามกอนาจารหรือไม่เหมาะสม</li>
                    <li>การดูถูกเหยียดหยามหรือสร้างความแตกแยก</li>
                    <li>การคุกคามหรือผิดกฎหมาย</li>
                    <li>QR Code หรือลิงก์ในรูปภาพ</li>
                  </ul>
                  <div className="warning-note">
                    ⚠️ หากพบเนื้อหาที่ไม่เหมาะสม ทางบริการขอสงวนสิทธิ์ในการปฏิเสธและไม่คืนเงิน
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal ยืนยัน */}
        {showPreviewModal && (
          <div className="modal-overlay" onClick={handleEdit}>
            <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>ยืนยันเนื้อหา</h3>
                <button className="close-button" onClick={handleEdit}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="preview-container">
                  {type === "image" && image && (
                    <div className="final-preview">
                      <img src={URL.createObjectURL(image)} alt="Preview" />
                      <div
                        className="final-text-overlay"
                        style={{ 
                          color: textColor, 
                          textShadow: textColor === "white" ? "0 2px 8px rgba(0,0,0,0.8)" : "0 2px 8px rgba(255,255,255,0.8)"
                        }}
                      >
                        {text}
                      </div>
                    </div>
                  )}
                  {type === "text" && (
                    <div className="text-only-preview">
                      <p style={{ color: textColor }}>{text}</p>
                    </div>
                  )}
                  <div className="preview-info">
                    <p><strong>แสดงเป็นเวลา:</strong> {time} นาที</p>
                    <p><strong>ราคา:</strong> ฿{price}</p>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button className="secondary-btn" onClick={handleEdit}>แก้ไข</button>
                <button className="primary-btn" onClick={handleAccept}>ยืนยันและชำระเงิน</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Upload;