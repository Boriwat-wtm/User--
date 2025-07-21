require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(express.static("uploads"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// API สำหรับอัปโหลดรูปภาพและข้อความ
app.post("/upload-content", upload.single("image"), (req, res) => {
  const { message } = req.body;
  const imageUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;

  console.log("Message:", message);
  console.log("Image URL:", imageUrl);

  res.json({ success: true, message, imageUrl });
});

// API เดิมสำหรับอัปโหลดรูปภาพ
app.post("/upload", upload.single("image"), (req, res) => {
  res.json({ imageUrl: `http://localhost:5000/uploads/${req.file.filename}` });
});

let otpStore = {}; // เก็บ OTP ชั่วคราว

// ส่ง OTP ไปยังหมายเลขโทรศัพท์
app.post("/send-otp", (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }
  const otp = Math.floor(100000 + Math.random() * 900000); // สร้าง OTP 6 หลัก
  otpStore[phone] = otp; // เก็บ OTP ไว้ใน memory
  console.log(`OTP for ${phone}: ${otp}`); // จำลองการส่ง OTP
  res.json({ message: "OTP sent successfully" });
});

// ตรวจสอบ OTP
app.post("/verify-otp", (req, res) => {
  const { phone, otp } = req.body;
  if (otpStore[phone] && otpStore[phone] === parseInt(otp)) {
    delete otpStore[phone]; // ลบ OTP หลังจากตรวจสอบสำเร็จ
    res.json({ success: true, message: "OTP verified successfully" });
  } else {
    res.status(400).json({ success: false, message: "Invalid OTP" });
  }
});

// ตรวจสอบการชำระเงิน
app.post("/verify-payment", (req, res) => {
  const { amount, method } = req.body;

  // ตรวจสอบว่าจำนวนเงินตรงกับราคาที่กำหนดหรือไม่
  if (amount === expectedAmount && method === "promptpay") {
    return res.json({ success: true });
  } else {
    return res.json({ success: false });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
