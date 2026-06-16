# 🔱 دليل إعداد منصة معاملاتي

## نظرة عامة
منصة خدمات رقمية متكاملة تشمل: حجوزات طبية، تكاسي ذكية، محفظة مالية، خرائط، وإدارة شاملة.

---

## ✅ الملفات المكتملة

| الملف | الحالة | الوصف |
|-------|--------|-------|
| `index.html` | ✅ | الصفحة الرئيسية |
| `login.html` | ✅ | تسجيل الدخول (هاتف + إيميل + OTP) |
| `register.html` | ✅ | إنشاء حساب جديد |
| `dashboard.html` | ✅ | لوحة تحكم المستخدم |
| `profile.html` | ✅ | الملف الشخصي وإعدادات الأمان |
| `patient-record.html` | ✅ | الملف الطبي الإلكتروني |
| `my-bookings.html` | ✅ | قائمة الحجوزات الطبية |
| `booking-details.html` | ✅ | تفاصيل حجز محدد |
| `notifications.html` | ✅ | مركز الإشعارات |
| `doctors.html` | ✅ | قائمة الأطباء |
| `wallet.html` | ✅ | المحفظة المالية الملكية |
| `taxi.html` | ✅ | خدمة التكاسي |
| `emergency.html` | ✅ | الطوارئ |
| `apply.html` | ✅ | التقديم كشريك |
| `map.html` | ✅ | الخريطة الذكية |
| `hospitals.html` | ✅ | دليل المستشفيات |
| `pharmacies.html` | ✅ | الصيدليات المناوبة |
| `admin.html` | ✅ | لوحة الإدارة المركزية |
| `sw.js` | ✅ | خدمة PWA المحسّنة |
| `manifest.json` | ✅ | إعدادات التطبيق |

---

## 🔧 إعداد Firebase

### 1. قاعدة البيانات
تأكد من أن `firebase-config.js` يحتوي على بياناتك الصحيحة.

### 2. قواعد الأمان - انسخ هذا في Firebase Rules:
```json
{
  "rules": {
    "users": {
      "$phone": {
        ".read": "auth != null && (auth.uid === $phone || root.child('users').child(auth.uid).child('role').val() === 'ADMIN')",
        ".write": "auth != null && (auth.uid === $phone || root.child('users').child(auth.uid).child('role').val() === 'ADMIN')"
      }
    },
    "users_email": {
      "$email": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "bookings": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "doctors": {
      ".read": true,
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'ADMIN'"
    },
    "transactions": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'ADMIN'"
    },
    "chats": {
      "$chatId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "otps": {
      ".read": "auth != null",
      ".write": true
    },
    "notifications": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "applications": {
      ".read": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'ADMIN'",
      ".write": true
    },
    "settings": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'ADMIN'"
    },
    "taxis": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "orders": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

---

## 📧 إعداد EmailJS

1. سجّل على [emailjs.com](https://www.emailjs.com)
2. أنشئ Service من Gmail
3. أنشئ Template بهذه المتغيرات:
   ```
   Subject: رمز التحقق - معاملاتي
   
   رمز التحقق الخاص بك هو: {{otp_code}}
   صالح لمدة {{expiry_minutes}} دقائق.
   ```
4. حدّث `js/config.js`:
   ```js
   window.EMAILJS_PUBLIC_KEY  = 'pk_xxxxx';
   window.EMAILJS_SERVICE_ID  = 'service_xxxxx';
   window.EMAILJS_TEMPLATE_ID = 'template_xxxxx';
   ```

---

## 👤 حساب الإدارة الافتراضي

| الحقل | القيمة |
|-------|--------|
| رقم الهاتف | `0936020439` |
| كلمة المرور | `202025` |
| الدور | `ADMIN` |

> ⚠️ **مهم**: غيّر كلمة المرور فور الدخول الأول!

---

## 🚀 نشر المشروع على GitHub Pages

```bash
# 1. رفع الملفات
git init
git add .
git commit -m "Moamalaty v2.0 Launch 🔱"
git remote add origin https://github.com/YOUR_USER/moamalaty.git
git push -u origin main

# 2. فعّل GitHub Pages من Settings > Pages > main branch
```

---

## 📁 هيكل المجلدات

```
moamalaty/
├── index.html          # الرئيسية
├── login.html          # تسجيل الدخول
├── register.html       # التسجيل
├── dashboard.html      # الداشبورد
├── apply.html          # انضمام الشركاء
├── notifications.html  # الإشعارات
├── my-bookings.html    # الحجوزات
├── booking-details.html # تفاصيل حجز
├── ...                 # باقي الصفحات
├── css/
│   ├── style.css       # الأنماط الرئيسية
│   └── notifications.css
├── js/
│   ├── security.js     # الأمان والتشفير
│   ├── firebase-config.js  # Firebase
│   ├── config.js       # الإعدادات العامة
│   ├── auth.js         # نظام المصادقة
│   ├── email-auth.js   # مصادقة البريد
│   ├── ui-manager.js   # إدارة الواجهة
│   ├── dashboard.js    # منطق الداشبورد
│   └── ...
├── assets/
│   └── logo.png        # شعار المنصة
├── manifest.json       # PWA Manifest
└── sw.js              # Service Worker
```
