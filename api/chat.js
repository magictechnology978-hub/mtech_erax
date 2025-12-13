// api/chat.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
// تأكد من تثبيت المكتبة الصحيحة لـ Gemini (هنا @google/genai)
const { GoogleGenAI } = require('@google/genai');
const removeBg = require('remove.bg'); // إذا كنت تستخدم هذه المكتبة

// 1. قراءة المفاتيح السرية من متغيرات البيئة (Vercel Env Vars)
// يتم التحقق من وجود المفاتيح قبل الاستخدام لعدم حدوث Crash
const GEMINI_KEY = process.env.GEMINI_FLASH_KEY;
const YOUTUBE_KEY = process.env.YOUTUBE_DATA_KEY;
const REMOVE_BG_KEY = process.env.REMOVE_BG_KEY;
const ELEVEN_LABS_KEY = process.env.ELEVEN_LABS_KEY; // إذا كنت تستخدمها

// 2. تهيئة عميل Gemini
let ai;
if (GEMINI_KEY && GEMINI_KEY.length > 10) {
    try {
        ai = new GoogleGenAI(GEMINI_KEY);
    } catch (e) {
        console.error("⛔ فشل تهيئة Gemini AI: ", e.message);
    }
} else {
    console.error("❌ مفتاح GEMINI_FLASH_KEY مفقود أو غير صحيح.");
}

// 3. إنشاء تطبيق Express
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); 

// =========================================================================
//  المسارات الرئيسية (Routes)
// =========================================================================

// مسار الاختبار: GET /api
app.get('/', (req, res) => {
    res.json({
        status: "✅ Backend Serverless Function Ready",
        service_status: ai ? "Gemini AI Client Ready" : "❌ Gemini AI Key Failed",
        test_message: "Use POST /api/chat or other specific API endpoints."
    });
});

// 🤖 1. مسار Gemini Chat: POST /api/chat
app.post('/chat', async (req, res) => {
    if (!ai) {
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

// 🎬 2. مسار YouTube Channel Info: GET /api/youtube-channel?channelId=...
app.get('/youtube-channel', async (req, res) => {
    if (!YOUTUBE_KEY) return res.status(500).json({ error: "مفتاح YOUTUBE_DATA_KEY مفقود." });
    
    const { channelId } = req.query; 
    if (!channelId) return res.status(400).json({ error: "Channel ID مطلوب." });

    const URL = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_KEY}`;
    
    try {
        const response = await axios.get(URL);
        res.json(response.data);
    } catch (error) {
        console.error("خطأ في الاتصال بـ YouTube:", error.message);
        res.status(error.response ? error.response.status : 500).json({ error: "فشل في جلب بيانات قناة يوتيوب." });
    }
});


// 🖼️ 3. مسار Remove Background: POST /api/remove-background
app.post('/remove-background', async (req, res) => {
    if (!REMOVE_BG_KEY) return res.status(500).json({ error: "مفتاح REMOVE_BG_KEY مفقود." });
    
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "رابط الصورة مطلوب." });

    try {
        // إذا كنت تستخدم مكتبة 'remove.bg' بشكل مباشر
        const result = await removeBg.removeBackground({
            apiKey: REMOVE_BG_KEY,
            url: imageUrl,
            outputFile: null // لا نحفظ ملف، نرجع بيانات الصورة
        });

        // غالباً remove.bg بترجع البايتات (Buffer) أو Base64
        // هنا يجب تعديل الرد حسب ما تتوقعه المكتبة
        res.json({ success: true, base64Image: result.base64img });

    } catch (error) {
        console.error("خطأ في خدمة إزالة الخلفية:", error.message);
        res.status(500).json({ error: "فشل في معالجة إزالة الخلفية." });
    }
});

// ... هنا ممكن تضيف مسارات أخرى زي /api/tts لـ Eleven Labs

// =========================================================================
//  التصدير الخاص بـ Vercel Serverless Function
// =========================================================================

// تصدير تطبيق Express مباشرة دون استخدام app.listen
module.exports = app;