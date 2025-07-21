import express from "express";
import cors from "cors";
import multer from "multer";
import Tesseract from "tesseract.js";
import fetch from "node-fetch";
import FormData from "form-data";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());


if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// ตั้งค่าการเก็บไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

app.use(express.json());

app.post("/api/report", async (req, res) => {
  const { category, detail } = req.body;
  if (!category || !detail) {
    return res.status(400).json({ status: "error", message: "category and detail are required" });
  }
  try {
    const adminRes = await fetch("http://localhost:5001/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, detail }),
    });
    const adminData = await adminRes.json();
    if (adminRes.ok) {
      res.json({ status: "ok" });
    } else {
      res.status(500).json({ status: "error", message: adminData.message });
    }
  } catch (err) {
    console.error("ส่งข้อมูลไป admin ไม่สำเร็จ:", err); // เพิ่ม log error
    res.status(500).json({ status: "error", message: "ส่งข้อมูลไป admin ไม่สำเร็จ" });
  }
});

// เพิ่ม API OCR
app.post("/api/ocr", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: "error", message: "No file uploaded" });
  }
  try {
    const { data: { text } } = await Tesseract.recognize(
      req.file.path,
      "tha+eng"
    );
    res.json({ status: "ok", text });
  } catch (err) {
    res.status(500).json({ status: "error", message: "OCR failed" });
  }
});

app.post("/verify-slip", upload.single("slip"), async (req, res) => {
  console.log("===> เข้ามา /verify-slip แล้ว");
  let status = "failed";
  let detail = "";
  const amount = req.body.amount;

  if (!req.file) {
    console.log("===> ไม่พบไฟล์สลิป");
    detail = "ไม่พบไฟล์สลิป";
    await fetch("http://localhost:5001/api/stat-slip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "payment", detail, status, amount }),
    });
    return res.json({ success: false, message: detail });
  }

  try {
    console.log("===> เริ่ม OCR");
    const { data: { text } } = await Tesseract.recognize(
      req.file.path,
      "tha+eng"
    );
    const textArabic = thaiToArabic(text);
    const cleanText = textArabic.replace(/[\s,\,\.]/g, "");
    const cleanAmount = String(amount).replace(/[\s,\,\.]/g, "");
    const cleanAmountDot = String(Number(amount).toFixed(2)).replace(/[\s,\,\.]/g, "");

    console.log("OCR TEXT:", text);
    console.log("cleanText:", cleanText);
    console.log("cleanAmount:", cleanAmount);
    console.log("cleanAmountDot:", cleanAmountDot);

    // ตัวเลือกที่ 1: ตรงกับจำนวนเงิน + "บาท"
    const match1 = cleanText.includes(cleanAmount + "บาท");
    const match2 = cleanText.includes(cleanAmountDot + "บาท");

    // ตัวเลือกที่ 2: ตรงกับจำนวนเงินแบบตรงตัว (แต่ต้องไม่ซ้อนกับเลขอื่น)
    const match3 = cleanText.split("บาท")[0].endsWith(cleanAmount);
    const match4 = cleanText.split("บาท")[0].endsWith(cleanAmountDot);

    console.log("match1:", match1, "match2:", match2, "match3:", match3, "match4:", match4);

    if (match1 || match2 || match3 || match4) {
      status = "success";
      detail = `ชำระเงินสำเร็จ จำนวนเงิน: ${amount}`;
      console.log("===> ตรวจพบจำนวนเงินในสลิป");
      await fetch("http://localhost:5001/api/stat-slip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "payment", detail, status, amount }),
      });
      return res.json({ success: true });
    } else {
      detail = "ชำระเงินไม่ถูกต้อง หรือจำนวนเงินไม่ตรง";
      console.log("===> ชำระเงินไม่ถูกต้อง หรือจำนวนเงินไม่ตรง");
      await fetch("http://localhost:5001/api/stat-slip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "payment", detail, status, amount }),
      });
      return res.json({ success: false, message: detail });
    }
  } catch (err) {
    detail = "OCR ผิดพลาด";
    console.log("===> OCR ผิดพลาด", err);
    await fetch("http://localhost:5001/api/stat-slip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "payment", detail, status, amount }),
    });
    return res.json({ success: false, message: detail });
  }
});

function thaiToArabic(str) {
  return str.replace(/[๐-๙]/g, d => "0123456789"["๐๑๒๓๔๕๖๗๘๙".indexOf(d)]);
}

// เก็บข้อมูลรอชำระเงิน
let pendingUploads = new Map();

// API สำหรับบันทึกข้อมูลรอชำระเงิน
app.post("/api/upload", upload.single("file"), (req, res) => {
  const { text, type, time, price, sender } = req.body;
  const uploadId = Date.now().toString();
  
  const uploadData = {
    id: uploadId,
    text,
    type,
    time,
    price,
    sender,
    file: req.file ? req.file.filename : null,
    filePath: req.file ? req.file.path : null,
    timestamp: new Date(),
    status: 'pending'
  };
  
  // เก็บข้อมูลรอชำระเงิน
  pendingUploads.set(uploadId, uploadData);
  
  // ตั้งเวลายกเลิก 10 นาที
  setTimeout(() => {
    if (pendingUploads.has(uploadId)) {
      console.log(`Upload ${uploadId} expired after 10 minutes`);
      pendingUploads.delete(uploadId);
    }
  }, 10 * 60 * 1000); // 10 นาที
  
  res.json({ success: true, uploadId });
});

// API สำหรับยืนยันการชำระเงิน
app.post("/api/confirm-payment", async (req, res) => {
  try {
    const { uploadId } = req.body;
    
    if (!uploadId) {
      return res.status(400).json({ success: false, message: 'Missing uploadId' });
    }
    
    const uploadData = pendingUploads.get(uploadId);
    
    if (!uploadData) {
      return res.status(404).json({ success: false, message: 'Upload not found or expired' });
    }
    
    // ส่งข้อมูลไปยัง Admin backend
    const formData = new FormData();
    formData.append('text', uploadData.text || '');
    formData.append('type', uploadData.type);
    formData.append('time', uploadData.time.toString());
    formData.append('price', uploadData.price.toString());
    formData.append('sender', uploadData.sender);
    formData.append('textColor', uploadData.textColor || 'white'); // เพิ่มสีข้อความ
    
    // ส่งไฟล์หากมี
    if (uploadData.file) {
      const filePath = path.join(__dirname, 'uploads', uploadData.file);
      if (fs.existsSync(filePath)) {
        formData.append('file', fs.createReadStream(filePath));
      }
    }
    
    // ส่งข้อมูลไปยัง Admin backend
    const response = await fetch('http://localhost:5001/api/upload', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    if (response.ok) {
      // ลบข้อมูลออกจากรายการรอชำระเงิน
      pendingUploads.delete(uploadId);
      
      console.log('Successfully sent to admin backend');
      res.json({ success: true, message: 'Payment confirmed and data sent to admin' });
    } else {
      throw new Error('Failed to send to admin backend');
    }
    
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการยืนยันการชำระเงิน' });
  }
});

// API สำหรับตรวจสอบสถานะ upload
app.get("/api/upload-status/:uploadId", (req, res) => {
  const { uploadId } = req.params;
  
  if (pendingUploads.has(uploadId)) {
    const data = pendingUploads.get(uploadId);
    res.json({ exists: true, status: data.status });
  } else {
    res.json({ exists: false });
  }
});

app.listen(4000, () => console.log("User backend started on port 4000"));