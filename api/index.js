// api/index.js

// 1. استدعاء المكتبات الضرورية وقراءة مفاتيح .env محلياً (ضروري يكون أول سطر)
require('dotenv').config(); 
const express = require('express');
const cors = require('cors'); 
const axios = require('axios'); 
const { GoogleGenAI } = require('@google/genai'); 

// 2. قراءة المفاتيح السرية من البيئة (process.env)
const GEMINI_KEY = process.env.GEMINI_FLASH_KEY;
const YOUTUBE_KEY = process.env.YOUTUBE_DATA_KEY; 
const ELEVEN_LABS_KEY = process.env.ELEVEN_LABS_KEY;
const EMAILJS_KEY = process.env.EMAILJS_KEY; 
const REMOVE_BG_KEY = process.env.REMOVE_BG_KEY; 

// 3. تهيئة التطبيق والسيرفر
const app = express();
const PORT = 3000; 

// 4. تهيئة عميل Gemini
const ai = new GoogleGenAI(GEMINI_KEY);

// 5. إعدادات السيرفر (Middlewares)
app.use(cors()); 
// يسمح بقراءة البيانات بصيغة JSON ويسمح بحد أقصى 50MB للصور
app.use(express.json({ limit: '50mb' })); 

// =========================================================================
//  مسارات الـ API (الـ Routes)
// =========================================================================

// مسار رئيسي للاختبار: GET /api
app.get('/', (req, res) => {
    res.json({
        message: "✅ سيرفر الـ Backend شغال بنجاح ومفاتيحك محمية.",
        status: "استخدم المسارات الأخرى للاتصال بالخدمات.",
        key_status_check: !!GEMINI_KEY ? "Gemini Key Loaded" : "Gemini Key Missing in Environment"
    });
});


// 1. 🤖 مسار Gemini Chat: POST /api/chat
app.post('/chat', async (req, res) => {
    if (!GEMINI_KEY) return res.status(500).json({ error: "مفتاح Gemini غير مُعد." });
    
    const { prompt } = req.body; 
    if (!prompt) return res.status(400).json({ error: "الـ prompt مطلوب." });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: prompt,
        });

        res.json({ success: true, geminiResponse: response.text });

    } catch (error) {
        console.error("خطأ في الاتصال بـ Gemini:", error.message);
        res.status(500).json({ error: "فشل في معالجة طلب Gemini. تأكد من أن المفتاح صحيح." });
    }
});


// 2. 🖼️ مسار Remove.bg: POST /api/remove-background
app.post('/remove-background', async (req, res) => {
    if (!REMOVE_BG_KEY) return res.status(500).json({ error: "مفتاح Remove.bg غير مُعد." });
    
    const { imageUrl, base64_image } = req.body; 

    if (!imageUrl && !base64_image) {
        return res.status(400).json({ error: "يجب إرسال رابط صورة (imageUrl) أو كود (base64_image)." });
    }
    
    try {
        const response = await axios.post(
            'https://api.remove.bg/v1.0/removebg',
            { 
                image_url: imageUrl, 
                image_file_b64: base64_image,
                size: 'auto'
            },
            {
                headers: {
                    'X-Api-Key': REMOVE_BG_KEY,
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer' 
            }
        );
        
        // إرجاع الصورة الناتجة مباشرة للـ Frontend
        res.set('Content-Type', 'image/png');
        res.send(response.data);

    } catch (error) {
        console.error("خطأ في الاتصال بـ remove.bg:", error.message);
        res.status(500).json({ error: "فشل في معالجة إزالة الخلفية. (Check Vercel Logs)" });
    }
});


// 3. 📺 مسار YouTube Search: POST /api/youtube
app.post('/youtube', async (req, res) => {
    if (!YOUTUBE_KEY) return res.status(500).json({ error: "مفتاح YouTube غير مُعد." });
    
    const { query } = req.body; 
    if (!query) return res.status(400).json({ error: "الـ query مطلوب للبحث." });

    const YOUTUBE_SEARCH_URL = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${YOUTUBE_KEY}`;
    
    try {
        const result = await axios.get(YOUTUBE_SEARCH_URL);
        res.json({ success: true, items: result.data.items });
    } catch (error) {
        console.error("خطأ في الاتصال بـ YouTube:", error.message);
        res.status(500).json({ error: "فشل في الاتصال بخدمة YouTube." });
    }
});


// 4. 🔊 مسار Eleven Labs (TTS): POST /api/tts
app.post('/tts', (req, res) => {
    if (!ELEVEN_LABS_KEY) return res.status(500).json({ error: "مفتاح Eleven Labs غير مُعد." });
    
    const { text } = req.body; 

    // هنا يجب إضافة كود اتصال Eleven Labs API الذي يستخدم مفتاح ELEVEN_LABS_KEY
    
    res.json({
        success: true,
        message: "مسار Eleven Labs جاهز، يحتاج إضافة كود الاتصال الفعلي بالخدمة.",
        // **هنا يتم إرجاع ملف الصوت أو رابط له**
    });
});


// 5. ✉️ مسار EmailJS Proxy: POST /api/send-email
app.post('/send-email', (req, res) => {
    // بالرغم من أننا لا نستخدم مفتاح EMAILJS_KEY في هذا المثال، نضع المسار ليكون آمن
    
    res.json({
        success: true,
        message: "مسار إرسال الإيميل جاهز. يستخدم الـ Backend كواجهة آمنة."
    });
});


// =========================================================================
//  التصدير والتشغيل
// =========================================================================

// التصدير لـ Vercel (مهم جداً):
module.exports = app; 

// تشغيل السيرفر محلياً:
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`السيرفر المحلي شغال على: http://localhost:${PORT}`);
  });
}