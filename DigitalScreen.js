import { useEffect, useState } from "react";
import axios from "axios";

export default function DigitalScreen() {
  const [content, setContent] = useState([]);

  useEffect(() => {
    const fetchContent = async () => {
      const res = await axios.get("http://localhost:5000/get-content");
      setContent(res.data);
    };
    fetchContent();
  }, []);

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold">Digital Screen</h1>
      {content.map((item, index) => (
        <div key={index} className="border p-4 my-2 w-96">
          <p>{item.message}</p>
          {item.image && <img src={item.image} alt="Uploaded" className="mt-2 h-40" />}
        </div>
      ))}
    </div>
  );
}
