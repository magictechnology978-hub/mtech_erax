// api/chat.js
const express = require('express');
const cors = require('cors'); 
const { GoogleGenAI } = require('@google/genai'); 

const GEMINI_KEY = process.env.GEMINI_FLASH_KEY;

let genAI;
if (GEMINI_KEY) {
    // التصحيح: تمرير المفتاح مباشرة وليس كـ Object
    genAI = new GoogleGenAI(GEMINI_KEY); 
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' })); 

const router = express.Router();

router.get('/', (req, res) => {
    res.json({ status: "Backend Ready", ai_ready: !!genAI });
});

router.post('/', async (req, res) => {
    if (!genAI) {
        return res.status(500).json({ error: "API Key missing" });
    }

    const { contents, systemInstruction } = req.body;

    try {
        // إذا كنت متأكداً من وجود إصدار 2.5، ضعه هنا. 
        // لكن الموصى به حالياً للاستقرار هو "gemini-1.5-flash"
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", 
            systemInstruction: systemInstruction 
        });

        // إرسال المحتوى
        const result = await model.generateContent({ contents });
        const response = await result.response;
        
        res.json({ success: true, geminiResponse: response.text() });

    } catch (error) {
        console.error("Gemini Error:", error.message);
        res.status(500).json({ 
            error: "Internal Server Error", 
            details: error.message 
        });
    }
});

app.use('/api/chat', router);
module.exports = app;