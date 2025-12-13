// api/chat.js
const express = require('express');
const cors = require('cors'); 
const { GoogleGenAI } = require('@google/genai'); 

// 1. قراءة المفاتيح السرية
const GEMINI_KEY = process.env.GEMINI_FLASH_KEY;

// 2. تهيئة عميل Gemini
let ai;
if (GEMINI_KEY && GEMINI_KEY.length > 10) {
    try {
        ai = new GoogleGenAI({ apiKey: GEMINI_KEY }); 
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
// ✅ التعديل هنا: تغيير المسار من '/chat' إلى '/' لاستقبال الطلب الموجه للـ Function مباشرة
app.post('/', async (req, res) => {
    // التحقق أولاً من تهيئة الـ AI
    if (!ai) {
        return res.status(500).json({ 
            error: "فشل في تهيئة خدمة Gemini AI. تأكد من أن GEMINI_FLASH_KEY صحيح ومحفوظ في Vercel.",
            code: "KEY_MISSING_OR_INVALID"
        });
    }
    
    // نستقبل 'contents' و 'systemInstruction' من الفرونت إند
    const { contents, systemInstruction } = req.body;

    // التحقق من الـ contents (سجل المحادثة)
    if (!contents || contents.length === 0) {
        return res.status(400).json({ error: "الـ contents (سجل المحادثة) مطلوب.", code: "BAD_REQUEST" });
    }

    try {
        // بناء الـ Configuration للـ API
        const config = {};
        if (systemInstruction) {
            config.systemInstruction = systemInstruction; 
        }

        // إرسال الـ contents بالكامل (History + الرسالة الجديدة)
        const response = await ai.generateContent({
            model: "gemini-2.5-flash", 
            contents: contents, 
            config: config
        });

        // التأكد من أن الاستجابة موجودة قبل إرسالها
        if (response && response.text) {
             res.json({ success: true, geminiResponse: response.text });
        } else {
             console.warn("Received empty or invalid text response from Gemini.");
             res.status(500).json({ 
                error: "استجابة Gemini كانت فارغة أو غير صالحة. قد يكون بسبب فلترة المحتوى.", 
                code: "EMPTY_GEMINI_RESPONSE"
            });
        }

    } catch (error) {
        console.error("خطأ في الاتصال بـ Gemini:", error.message);
        res.status(500).json({ 
            error: `فشل في معالجة طلب Gemini. الخطأ الفعلي: ${error.message}`, 
            code: "GEMINI_API_FAILURE"
        });
    }
});

// =========================================================================
//  التصدير الخاص بـ Vercel Serverless Function
// =========================================================================

module.exports = app;