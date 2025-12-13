// api/chat.js
const express = require('express');
const cors = require =('cors');
const axios = require('axios');
// تأكد من أن هذه هي المكتبة الصحيحة المثبتة لديك
const { GoogleGenAI } = require('@google/genai'); 

// 1. قراءة المفاتيح السرية: نركز فقط على مفتاح Gemini
const GEMINI_KEY = process.env.GEMINI_FLASH_KEY;
// تم تعطيل قراءة المفاتيح الأخرى مؤقتاً لتجنب أي Crash
// const YOUTUBE_KEY = process.env.YOUTUBE_DATA_KEY;
// const REMOVE_BG_KEY = process.env.REMOVE_BG_KEY;
// const ELEVEN_LABS_KEY = process.env.ELEVEN_LABS_KEY;

// 2. تهيئة عميل Gemini
let ai;
if (GEMINI_KEY && GEMINI_KEY.length > 10) {
    try {
        // يتم التأكد من أن المفتاح يعمل هنا
        ai = new GoogleGenAI(GEMINI_KEY);
        console.log("✅ Gemini AI Client initialized successfully.");
    } catch (e) {
        console.error("⛔ فشل تهيئة Gemini AI (خطأ في المكتبة): ", e.message);
    }
} else {
    console.error("❌ مفتاح GEMINI_FLASH_KEY مفقود أو غير صحيح.");
}

// 3. إنشاء تطبيق Express
const app = express();
app.use(cors());
// تقليل الـ limit لتقليل الحمل إذا لم تكن تعالج ملفات كبيرة
app.use(express.json({ limit: '1mb' })); 

// =========================================================================
//  المسارات الرئيسية (Routes)
// =========================================================================

// مسار الاختبار: GET /api
app.get('/', (req, res) => {
    res.json({
        status: "✅ Backend Serverless Function Ready",
        service_status: ai ? "Gemini AI Client Ready" : "❌ Gemini AI Key Failed (Check Vercel Logs)",
        test_message: "Use POST /api/chat"
    });
});

// 🤖 مسار Gemini Chat: POST /api/chat
app.post('/chat', async (req, res) => {
    if (!ai) {
        // إذا فشلت التهيئة، يتم الرد برسالة مخصصة بدلاً من الـ 500 HTML
        return res.status(500).json({ 
            error: "فشل في تهيئة خدمة Gemini AI. تأكد من أن GEMINI_FLASH_KEY صحيح ومحفوظ في Vercel.",
            code: "KEY_MISSING_OR_INVALID"
        });
    }
    
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: "الـ prompt مطلوب.", code: "BAD_REQUEST" });
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: prompt,
        });

        res.json({ success: true, geminiResponse: response.text });

    } catch (error) {
        console.error("خطأ في الاتصال بـ Gemini:", error.message);
        // إرجاع الخطأ الفعلي للمساعدة في التشخيص
        res.status(500).json({ 
            error: `فشل في معالجة طلب Gemini. الخطأ الفعلي: ${error.message}`, 
            code: "GEMINI_API_FAILURE"
        });
    }
});

// ... تم تعطيل مسارات YouTube و Remove BG وغيرها مؤقتاً ...

// =========================================================================
//  التصدير الخاص بـ Vercel Serverless Function
// =========================================================================

module.exports = app;