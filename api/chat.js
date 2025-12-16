// api/chat.js

const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai'); // التصحيح: اسم المكتبة والكلاس الرسمي

// 1. قراءة المفتاح السري من متغيرات البيئة
const GEMINI_KEY = process.env.GEMINI_FLASH_KEY;

// 2. تهيئة عميل Gemini
let genAI;
if (GEMINI_KEY && GEMINI_KEY.length > 10) {
    try {
        genAI = new GoogleGenerativeAI(GEMINI_KEY); 
        console.log("✅ Gemini AI Client initialized successfully.");
    } catch (e) {
        console.error("⛔ فشل تهيئة Gemini AI: ", e.message);
    }
} else {
    console.error("❌ مفتاح GEMINI_FLASH_KEY مفقود أو غير صحيح.");
}

const app = express();
const router = express.Router();

app.use(cors());
app.use(express.json({ limit: '1mb' })); 

// =========================================================================
//  المسارات الرئيسية (Routes)
// =========================================================================

// مسار الاختبار للتأكد من الحالة
router.get('/', (req, res) => {
    res.json({
        status: "✅ Backend Serverless Function Ready",
        service_status: genAI ? "Gemini AI Client Ready" : "❌ Gemini AI Key Failed",
        test_message: "Use POST /api/chat to send messages"
    });
});

// 🤖 مسار المحادثة: POST /api/chat
router.post('/', async (req, res) => {
    if (!genAI) {
        return res.status(500).json({ 
            error: "فشل في تهيئة خدمة Gemini AI. تأكد من إعداد المفتاح في Vercel.",
            code: "KEY_MISSING"
        });
    }
    
    const { contents, systemInstruction } = req.body;

    if (!contents || !Array.isArray(contents)) {
        return res.status(400).json({ error: "الـ contents مطلوبة ويجب أن تكون مصفوفة.", code: "BAD_REQUEST" });
    }

    try {
        // تحديد الموديل وإضافة تعليمات النظام (systemInstruction) إذا وجدت
        // ملاحظة: تم استخدام "gemini-1.5-flash" لضمان الاستقرار وتجنب خطأ 404
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", 
            systemInstruction: systemInstruction 
        });

        // إرسال الطلب لـ Gemini
        const result = await model.generateContent({
            contents: contents
        });

        const response = await result.response;
        const text = response.text();

        if (text) {
             res.json({ success: true, geminiResponse: text });
        } else {
             res.status(500).json({ 
                 error: "استجابة Gemini كانت فارغة.", 
                 code: "EMPTY_RESPONSE"
             });
        }

    } catch (error) {
        console.error("خطأ في الاتصال بـ Gemini:", error.message);
        res.status(500).json({ 
            error: `فشل في معالجة الطلب: ${error.message}`, 
            code: "GEMINI_API_FAILURE"
        });
    }
});

// ربط الـ Router
app.use('/api/chat', router);

// التصدير لـ Vercel
module.exports = app;