// api/chat.js
const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai'); // التصحيح: اسم الكلاس الصحيح

const GEMINI_KEY = process.env.GEMINI_FLASH_KEY;

// 1. تهيئة Google Generative AI
let genAI;
if (GEMINI_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_KEY);
}

const app = express();
app.use(cors());
app.use(express.json());

// مسار الاختبار
app.get('/api/chat', (req, res) => {
    res.json({ status: "Ready", ai_initialized: !!genAI });
});

// المسار الرئيسي للمحادثة
app.post('/api/chat', async (req, res) => {
    if (!genAI) {
        return res.status(500).json({ error: "API Key missing" });
    }

    const { contents, systemInstruction } = req.body;

    try {
        // 2. تحديد الموديل (تأكد من استخدام إصدار موجود مثل gemini-1.5-flash)
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", // تم التصحيح من 2.5 إلى 1.5
            systemInstruction: systemInstruction 
        });

        // 3. توليد المحتوى
        // ملاحظة: contents يجب أن تكون مصفوفة بالتنسيق الصحيح [{ role: "user", parts: [{ text: "..." }] }]
        const result = await model.generateContent({
            contents: contents
        });

        const response = await result.response;
        const text = response.text();

        res.json({ success: true, geminiResponse: text });

    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ 
            error: "حدث خطأ أثناء الاتصال بـ Gemini", 
            details: error.message 
        });
    }
});

module.exports = app;