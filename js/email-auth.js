// ===================================
// Email Auth + OTP - Moamalaty Platform
// ===================================

const EmailAuth = {
    _otp: null,
    _email: null,
    _expiry: null,

    ADMIN_EMAILS: ['abohasan19887@gmail.com', 'jjbb3782@gmail.com'],
    ADMIN_PASSWORD: '202025',
    ADMIN_USER: {
        id: 'u_admin_system',
        name: 'إدارة النظام',
        email: 'abohasan19887@gmail.com',
        role: 'ADMIN',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        loginMethod: 'email',
        balanceUSD: 1000,
        balanceSYP: 1000000
    },

    sendOTP: async (email) => {
        const clean = email.trim().toLowerCase();
        const length = window.APP_CONFIG?.otpLength || 6;
        const code = Math.floor(Math.pow(10, length-1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length-1))).toString();
        const expiry = Date.now() + ((window.APP_CONFIG?.otpExpiry || 10) * 60 * 1000);
        const key = clean.replace(/\./g, '_');

        EmailAuth._otp = code;
        EmailAuth._email = clean;
        EmailAuth._expiry = expiry;

        // Save hashed OTP to Firebase with retry protection
        if (typeof firebaseDB !== 'undefined') {
            try {
                const ref = firebaseDB.ref(`otps/${key}`);
                const snap = await ref.once('value');
                const hashed = await SecurityManager.hashPassword(code);
                const next = {
                    hashed,
                    expiry,
                    lastSent: Date.now(),
                    attempts: snap.exists() ? snap.val().attempts || 0 : 0,
                    maxAttempts: 5,
                    blockedUntil: null
                };
                await ref.set(next);
            } catch (e) {
                console.error('OTP save error:', e);
            }
        }

        // Try EmailJS
        const sent = await EmailAuth._sendEmail(clean, code);
        return {
            success: true,
            simulated: !sent,
            devCode: !sent ? code : null,
            message: `تم إرسال رمز التحقق إلى ${clean}`
        };
    },

    verifyOTP: async (email, code) => {
        const clean = email.trim().toLowerCase();
        const key = clean.replace(/\./g, '_');

        // Local fallback
        if (EmailAuth._otp && EmailAuth._email === clean) {
            if (Date.now() > EmailAuth._expiry) return { success: false, message: 'انتهت صلاحية الرمز' };
            if (code.trim() === EmailAuth._otp) {
                EmailAuth._otp = null;
                if (typeof firebaseDB !== 'undefined') firebaseDB.ref(`otps/${key}`).remove();
                return { success: true };
            }
        }

        if (typeof firebaseDB !== 'undefined') {
            try {
                const ref = firebaseDB.ref(`otps/${key}`);
                const snap = await ref.once('value');
                if (!snap.exists()) return { success: false, message: 'رمز التحقق غير صحيح أو لم يتم إنشاؤه' };

                const d = snap.val();
                if (d.blockedUntil && Date.now() < d.blockedUntil) {
                    return { success: false, message: 'تم حظر المحاولة مؤقتاً بسبب عدد محاولات خاطئة متكرر' };
                }
                if (Date.now() > d.expiry) {
                    await ref.remove();
                    return { success: false, message: 'انتهت صلاحية الرمز' };
                }

                const ok = await SecurityManager.verifyPassword(code.trim(), d.hashed);
                if (ok) {
                    await ref.remove();
                    return { success: true };
                }

                const attempts = (d.attempts || 0) + 1;
                const update = { attempts, lastFailed: Date.now() };
                if (attempts >= (d.maxAttempts || 5)) {
                    update.blockedUntil = Date.now() + (15 * 60 * 1000);
                }
                await ref.update(update);
                return { success: false, message: attempts >= (d.maxAttempts || 5) ? 'تجاوزت الحد المسموح من المحاولات. حاول مرة أخرى بعد 15 دقيقة.' : 'رمز التحقق غير صحيح' };
            } catch (e) {
                console.error('OTP verify error:', e);
            }
        }
        return { success: false, message: 'رمز التحقق غير صحيح' };
    },

    loginWithEmail: async (email, password) => {
        const clean = email.trim().toLowerCase();
        const user = await EmailAuth.getUserByEmail(clean);
        const isAdminLogin = EmailAuth.ADMIN_EMAILS.includes(clean);

        if (!user && !isAdminLogin) {
            return { success:false, message:'البريد الإلكتروني غير مسجل' };
        }

        if (isAdminLogin && !user) {
            if (password !== EmailAuth.ADMIN_PASSWORD) {
                return { success:false, message:'كلمة المرور غير صحيحة' };
            }
            const adminUser = { ...EmailAuth.ADMIN_USER, email: clean, password: EmailAuth.ADMIN_PASSWORD };
            const localUsers = JSON.parse(localStorage.getItem('wusul_users_db') || '[]');
            if (!localUsers.some(u => (u.email || '').toLowerCase() === clean)) {
                localUsers.push(adminUser);
                localStorage.setItem('wusul_users_db', JSON.stringify(localUsers));
            }
            EmailAuth.syncAdminToSheet(adminUser).catch(() => null);
            return { success:true, user: adminUser, token: SecurityManager.generateToken(adminUser) };
        }

        const ok = user.password?.length > 30
            ? await SecurityManager.verifyPassword(password, user.password)
            : user.password === password;
        if (!ok) return { success:false, message:'كلمة المرور غير صحيحة' };
        return { success:true, user, token: SecurityManager.generateToken(user) };
    },

    registerWithEmail: async (name, email, password, role='USER', extra={}) => {
        const clean = email.trim().toLowerCase();
        const existing = await EmailAuth.getUserByEmail(clean);
        if (existing) return { success:false, message:'البريد الإلكتروني مسجل مسبقاً' };

        const hashed = await SecurityManager.hashPassword(password);
        const uuid = crypto.randomUUID?.() || `u_${Date.now()}`;
        const user = {
            id: uuid,
            uuid,
            name: SecurityManager.sanitize.string(name),
            email: clean,
            phone: extra.phone || '',
            password: hashed,
            role,
            balanceUSD: 0,
            balanceSYP: 0,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(clean)}`,
            kycStatus: role === 'USER' ? 'VERIFIED' : 'PENDING',
            emailVerified: false,
            loginMethod: 'email',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...extra
        };

        if (typeof firebaseDB !== 'undefined') {
            try {
                const key = clean.replace(/\./g, '_');
                await firebaseDB.ref(`users_email/${key}`).set(user);
                await firebaseDB.ref(`users/${uuid}`).set(user);
            } catch (e) {
                console.error('Email registration firebase error:', e);
            }
        }

        const local = JSON.parse(localStorage.getItem('wusul_users_db') || '[]');
        local.push(user);
        localStorage.setItem('wusul_users_db', JSON.stringify(local));

        // If registering as PARTNER, also create a partner application so admin can review
        if (user.role === 'PARTNER') {
            try {
                const appRef = 'APP-' + Date.now().toString(36).toUpperCase();
                const appData = {
                    ref: appRef,
                    type: 'PARTNER',
                    name: user.name,
                    phone: user.phone || '',
                    email: user.email || '',
                    city: user.city || '',
                    specialty: user.companyName || user.specialty || '',
                    message: user.regNumber ? `Reg: ${user.regNumber}` : (user.message || ''),
                    status: 'PENDING',
                    submittedAt: Date.now()
                };

                if (typeof firebaseDB !== 'undefined') {
                    try {
                        await firebaseDB.ref(`applications/${appRef}`).set(appData);
                        await firebaseDB.ref(`partner_requests/${appRef}`).set({ ...appData, id: appRef, createdAt: Date.now(), updatedAt: Date.now() });
                    } catch (e) {
                        console.error('Failed to create partner application in Firebase:', e);
                    }
                }

                // Local fallback for admin UI
                const apps = JSON.parse(localStorage.getItem('wusul_applications') || '[]');
                apps.push(appData);
                localStorage.setItem('wusul_applications', JSON.stringify(apps));
            } catch (e) {
                console.error('Partner application creation error:', e);
            }
        }

        if (typeof EmailAuth.sendToSheet === 'function') {
            EmailAuth.sendToSheet('new_user_registration', {
                email: clean,
                name: user.name,
                role: user.role,
                phone: user.phone,
                createdAt: user.createdAt
            }).catch(() => null);
        }

        return { success:true, user };
    },

    markVerified: async (email) => {
        const clean = email.trim().toLowerCase();
        const user = await EmailAuth.getUserByEmail(clean);
        if (!user) return;
        if (typeof firebaseDB !== 'undefined') {
            try {
                await firebaseDB.ref(`users_email/${clean.replace(/\./g,'_')}`).update({ emailVerified:true });
                if (user.id) await firebaseDB.ref(`users/${user.id}`).update({ emailVerified:true });
            } catch(e) {}
        }
        const local = JSON.parse(localStorage.getItem('wusul_users_db') || '[]');
        const idx = local.findIndex(u => u.email === clean);
        if (idx !== -1) { local[idx].emailVerified = true; localStorage.setItem('wusul_users_db', JSON.stringify(local)); }
    },

    resetPassword: async (email, newPass) => {
        const clean = email.trim().toLowerCase();
        const hashed = await SecurityManager.hashPassword(newPass);
        const user = await EmailAuth.getUserByEmail(clean);
        if (!user) return { success:false, message:'البريد غير موجود' };
        if (typeof firebaseDB !== 'undefined') {
            try {
                await firebaseDB.ref(`users_email/${clean.replace(/\./g,'_')}`).update({ password:hashed });
                if (user.id) await firebaseDB.ref(`users/${user.id}`).update({ password:hashed });
            } catch(e) {}
        }
        return { success:true };
    },

    getUserByEmail: async (email) => {
        const clean = email.trim().toLowerCase();
        if (typeof firebaseDB !== 'undefined') {
            try {
                const snap = await firebaseDB.ref(`users_email/${clean.replace(/\./g,'_')}`).once('value');
                if (snap.exists()) return snap.val();
            } catch(e) {
                console.error('Get user by email error:', e);
            }
        }
        const local = JSON.parse(localStorage.getItem('wusul_users_db') || '[]');
        return local.find(u => (u.email || '').toLowerCase() === clean) || null;
    },

    sendToSheet: async (action, payload) => {
        const scriptUrl = window.GOOGLE_SCRIPT_URL;
        if (!scriptUrl || scriptUrl === 'YOUR_GOOGLE_SCRIPT_WEB_APP_URL') return false;
        try {
            const params = new URLSearchParams();
            params.append('action', action);
            params.append('payload', JSON.stringify(payload));
            const response = await fetch(scriptUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });
            const result = await response.json();
            return result.success === true || result.status === 'ok';
        } catch (e) {
            console.error('Send to sheet error:', e);
            return false;
        }
    },

    syncAdminToSheet: async (adminUser) => {
        if (!adminUser) adminUser = EmailAuth.ADMIN_USER;
        return await EmailAuth.sendToSheet('new_user_registration', {
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role,
            createdAt: new Date().toISOString()
        });
    },

    _sendEmail: async (to, code) => {
        // Uses Google Apps Script Web App
        const scriptUrl = window.GOOGLE_SCRIPT_URL;
        if (!scriptUrl || scriptUrl === 'YOUR_GOOGLE_SCRIPT_WEB_APP_URL') return false;

        try {
            // إرسال البيانات كـ x-www-form-urlencoded لتجنب مشاكل CORS
            const params = new URLSearchParams();
            params.append('email', to);
            params.append('code', code);
            params.append('platform', 'معاملاتي');

            const response = await fetch(scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString()
            });
            
            const result = await response.json();
            return result.success === true;
        } catch(e) { 
            console.error('Email send error:', e);
            return false; 
        }
    }
};

window.EmailAuth = EmailAuth;
