// ===================================
// Moamalaty Global Config
// قم بتعديل هذه القيم بمفاتيحك الخاصة
// ===================================

// ── Google Apps Script Configuration ──────────────────
// ضع رابط الـ Web App الذي نسخته من Google Apps Script هنا
window.GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyIyLbcuRFPCNxi9RWDEDiBpvMYMiJzJrD_7K9Ov-z6C8ykrfKBtFNlgJxKZbsAjtse/exec';

// ── Firebase Config (already in firebase-config.js) ─
// لا تعدّل هنا — المفاتيح في js/firebase-config.js

// ── App Settings ─────────────────────────────────────
window.APP_CONFIG = {
    name:      'معاملاتي',
    version:   '2.0.0',
    currency:  'SYP',
    otpLength: 6,
    otpExpiry: 10,       // minutes
    sessionDays: 365,
    supportEmail: 'support@moamalaty.com',
    supportPhone: '0936020439'
};
