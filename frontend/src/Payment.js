import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./Payment.css";
import promptpayLogo from "./data-icon/promptpay-logo.png";
import truemoneyLogo from "./data-icon/truemoney-logo.png";
import paymentLogo from "./data-icon/payment-logo.jpg";
import { incrementQueueNumber } from "./utils";
import SlipUpload from "./SlipUpload";

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const type = queryParams.get("type");
  const time = queryParams.get("time");
  const price = queryParams.get("price");

  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      const pendingUploadId = localStorage.getItem('pendingUploadId');
      
      if (pendingUploadId) {
        const response = await fetch("http://localhost:4000/api/confirm-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uploadId: pendingUploadId }),
        });
        
        if (response.ok) {
          localStorage.removeItem('pendingUploadId');
          
          const currentQueueNumber = incrementQueueNumber();
          const newOrder = {
            type,
            time,
            price,
            queueNumber: currentQueueNumber,
          };
          localStorage.setItem("order", JSON.stringify(newOrder));
          
          // แสดง success message
          setShowPopup(false);
          setErrorMessage("✅ การชำระเงินสำเร็จ! ข้อมูลของคุณถูกส่งไปยังแอดมินแล้ว");
          
          setTimeout(() => {
            navigate("/");
          }, 2000);
        } else {
          throw new Error('Payment confirmation failed');
        }
      } else {
        const currentQueueNumber = incrementQueueNumber();
        const newOrder = {
          type,
          time,
          price,
          queueNumber: currentQueueNumber,
        };
        localStorage.setItem("order", JSON.stringify(newOrder));
        setErrorMessage("✅ การชำระเงินสำเร็จ!");
        
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      setErrorMessage("❌ เกิดข้อผิดพลาดในการยืนยันการชำระเงิน");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSelection = (method) => {
    if (!method) return;
    setPaymentMethod(method);
    setShowPopup(true);
    setErrorMessage("");
  };

  const closePopup = () => {
    setShowPopup(false);
    setOtpSent(false);
    setOtpVerified(false);
    setOtp("");
    setPhone("");
    setErrorMessage("");
  };

  const sendOtp = async () => {
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      setErrorMessage("กรุณากรอกหมายเลขโทรศัพท์ที่ถูกต้อง (10 หลัก)");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/send-otp", { phone });
      if (response.data.success) {
        setOtpSent(true);
        setErrorMessage("");
        setErrorMessage("📱 OTP ถูกส่งไปยังหมายเลขโทรศัพท์ของคุณแล้ว");
      } else {
        setErrorMessage(response.data.message || "ไม่สามารถส่ง OTP ได้");
      }
    } catch (error) {
      console.error("Error sending OTP:", error.response || error.message);
      setErrorMessage("❌ ไม่สามารถส่ง OTP ได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setErrorMessage("กรุณากรอก OTP 6 หลัก");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/verify-otp", { phone, otp });
      if (response.data.success) {
        setOtpVerified(true);
        setErrorMessage("✅ OTP ยืนยันสำเร็จ!");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error.response || error.message);
      setErrorMessage("❌ OTP ไม่ถูกต้อง กรุณาลองใหม่");
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="payment-container">
      <div className="payment-wrapper">
        <header className="payment-header">
          <button className="back-btn" onClick={handleGoBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1>ชำระเงิน</h1>
          <div></div>
        </header>

        <main className="payment-main">
          <div className="content-card">
            {/* Order Summary */}
            <div className="order-summary">
              <div className="summary-header">
                <div className="summary-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                    <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                    <path d="M3 12h6m6 0h6"/>
                  </svg>
                </div>
                <h2>สรุปรายการ</h2>
              </div>
              
              <div className="summary-details">
                <div className="summary-item">
                  <span className="item-label">บริการ:</span>
                  <span className="item-value">
                    {type === "image" ? "รูปภาพ + ข้อความ" : "ข้อความ"}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="item-label">ระยะเวลา:</span>
                  <span className="item-value">{time} นาที</span>
                </div>
                <div className="summary-item total-item">
                  <span className="item-label">ยอดรวม:</span>
                  <span className="item-value total-price">฿{price}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="payment-section">
              <h3>เลือกวิธีการชำระเงิน</h3>
              <div className="payment-methods">
                <div
                  className={`payment-method ${paymentMethod === "promptpay" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("promptpay")}
                >
                  <div className="method-icon">
                    <img src={promptpayLogo} alt="PromptPay" />
                  </div>
                  <div className="method-info">
                    <h4>PromptPay</h4>
                    <p>ชำระผ่าน QR Code</p>
                  </div>
                  <div className="method-check">
                    {paymentMethod === "promptpay" && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    )}
                  </div>
                </div>

                <div
                  className={`payment-method ${paymentMethod === "truemoney" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("truemoney")}
                >
                  <div className="method-icon">
                    <img src={truemoneyLogo} alt="TrueMoney" />
                  </div>
                  <div className="method-info">
                    <h4>TrueMoney</h4>
                    <p>ชำระผ่าน Wallet</p>
                  </div>
                  <div className="method-check">
                    {paymentMethod === "truemoney" && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Error/Success Message */}
            {errorMessage && (
              <div className={`alert-message ${errorMessage.includes("✅") ? 'success' : 'error'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {errorMessage.includes("✅") ? (
                    <path d="M20 6L9 17l-5-5"/>
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </>
                  )}
                </svg>
                {errorMessage}
              </div>
            )}

            {/* Continue Button */}
            <div className="action-buttons">
              <button className="secondary-btn" onClick={handleGoBack}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                ย้อนกลับ
              </button>
              <button
                className="primary-btn"
                onClick={() => handlePaymentSelection(paymentMethod)}
                disabled={!paymentMethod || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="spinner"></div>
                    กำลังประมวลผล...
                  </>
                ) : (
                  <>
                    ดำเนินการชำระเงิน
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </main>

        {/* PromptPay Popup */}
        {showPopup && paymentMethod === "promptpay" && (
          <div className="modal-overlay" onClick={closePopup}>
            <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>ชำระเงินผ่าน PromptPay</h3>
                <button className="close-button" onClick={closePopup}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="qr-section">
                  <img src={paymentLogo} alt="QR Code" className="qr-code" />
                  <div className="amount-display">
                    <span className="amount-label">ยอดชำระ</span>
                    <span className="amount-value">฿{price}</span>
                  </div>
                </div>
                
                <div className="payment-steps">
                  <h4>ขั้นตอนการชำระเงิน</h4>
                  <ol>
                    <li>เปิดแอปธนาคารหรือแอป PromptPay</li>
                    <li>เลือก "สแกน QR" หรือ "PromptPay"</li>
                    <li>สแกน QR Code ข้างต้น</li>
                    <li>ยืนยันยอดเงินและชำระ</li>
                    <li>อัปโหลดสลิปเพื่อยืนยัน</li>
                  </ol>
                </div>

                <SlipUpload price={price} onSuccess={handleConfirmPayment} />
              </div>
            </div>
          </div>
        )}

        {/* TrueMoney Popup */}
        {showPopup && paymentMethod === "truemoney" && (
          <div className="modal-overlay" onClick={closePopup}>
            <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>ชำระเงินผ่าน TrueMoney</h3>
                <button className="close-button" onClick={closePopup}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="truemoney-form">
                  <div className="form-group">
                    <label>หมายเลขโทรศัพท์</label>
                    <input
                      type="tel"
                      placeholder="0XX-XXX-XXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      maxLength="10"
                      className="phone-input"
                    />
                    <button 
                      className="otp-btn" 
                      onClick={sendOtp} 
                      disabled={otpSent || !phone}
                    >
                      {otpSent ? "OTP ถูกส่งแล้ว" : "ส่ง OTP"}
                    </button>
                  </div>

                  {otpSent && (
                    <div className="form-group">
                      <label>รหัส OTP</label>
                      <input
                        type="text"
                        placeholder="XXXXXX"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength="6"
                        className="otp-input"
                      />
                      <button 
                        className="verify-btn" 
                        onClick={verifyOtp}
                        disabled={!otp}
                      >
                        ยืนยัน OTP
                      </button>
                    </div>
                  )}

                  {otpVerified && (
                    <div className="payment-confirm">
                      <div className="success-check">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      </div>
                      <p>OTP ยืนยันสำเร็จ!</p>
                      <button 
                        className="final-confirm-btn" 
                        onClick={handleConfirmPayment}
                        disabled={isProcessing}
                      >
                        {isProcessing ? "กำลังประมวลผล..." : `ยืนยันการชำระ ฿${price}`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Payment;