import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.post("/api/analyze", async (req, res) => {
    try {
      const gapiKey = process.env.GEMINI_API_KEY;
      if (!gapiKey) {
        return res.status(500).json({ error: "Thành phần AI chưa được cấu hình (Thiếu API Key)." });
      }

      const ai = new GoogleGenAI({ apiKey: gapiKey });
      const prompt = `Bạn là một chuyên gia phân tích dữ liệu IT Helpdesk cấp cao. Dưới đây là các số liệu thống kê tình hình lỗi, nguyên nhân và hướng xử lý qua các tháng:

${JSON.stringify(req.body, null, 2)}

Hãy phân tích và đưa ra đánh giá chuyên sâu mang tính chiến lược dựa trên các số liệu trên:
1. Xác định các xu hướng chính (tăng/giảm đột biến).
2. Phân tích nguyên nhân gốc rễ và đánh giá rủi ro hoặc tác động lên hệ thống.
3. Cung cấp các đề xuất cải thiện thực tế nhằm giảm thiểu lỗi trong các tháng tiếp theo.

Yêu cầu trình bày:
- Viết văn phong cực kỳ chuyên nghiệp, súc tích (có thể dùng cấu trúc 3 phần rõ ràng: Tổng quan, Phân tích chi tiết, Đề xuất).
- Dùng Markdown hiệu quả (sử dụng in đậm cho keywords, dùng bullet points hoặc numbered lists).
- Hạn chế các nội dung thừa, hãy tập trung đi thẳng vào dữ liệu.`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: prompt
        });
      } catch (proError: any) {
        console.warn("Lỗi khi dùng gemini-2.5-pro, tự động chuyển sang gemini-2.5-flash:", proError.message);
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt
        });
      }

      res.json({ analysis: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Có lỗi khi phân tích dữ liệu: " + e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
