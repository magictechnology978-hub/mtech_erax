const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai'); 

const app = express();
app.use(cors());
app.use(express.json());

// تأكدي أن هذا المتغير مضاف في Vercel Settings أو ملف .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_FLASH_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const { contents } = req.body;

        // 1. التحقق من المدخلات
        if (!contents) {
            return res.status(400).json({ success: false, error: "المحتوى فارغ" });
        }

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash" // تأكدي من الاسم من AI Studio
        });

        const result = await model.generateContent({ contents });
        const response = await result.response;
        
        res.json({ 
            success: true, 
            geminiResponse: response.text() 
        });

    } catch (error) {
        // 2. التعامل مع خطأ Quota (429) بشكل احترافي
        if (error.message.includes("429")) {
            return res.status(429).json({ 
                success: false, 
                error: "تجاوزت حد الطلبات المسموح به (20 طلب يومياً). حاول لاحقاً." 
            });
        }

        console.error("⛔ Error:", error.message);
        res.status(500).json({ 
            success: false, 
            error: "فشل Gemini: " + error.message 
        });
    }
});

module.exports = app;