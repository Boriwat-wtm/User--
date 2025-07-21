import { useState } from "react";
import axios from "axios";

export default function UploadPage() {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
    setPreview(URL.createObjectURL(e.target.files[0]));
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("image", image);

    const res = await axios.post("http://localhost:5000/upload", formData);
    alert(`Image uploaded! URL: ${res.data.imageUrl}`);
  };

  return (
    <div className="flex flex-col items-center p-6 space-y-4">
      <h1 className="text-2xl font-bold">Upload Content</h1>
      <textarea
        className="border p-2 w-96 h-20"
        placeholder="Enter your message..."
        onChange={(e) => setMessage(e.target.value)}
      />
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {preview && <img src={preview} alt="Preview" className="h-40 mt-2" />}
      <button className="bg-blue-500 text-white p-2 rounded" onClick={handleUpload}>
        Upload
      </button>
    </div>
  );
}
