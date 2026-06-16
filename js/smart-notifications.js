const SmartNotifications = {
    init: () => {
        console.log("Smart Notifications System Active...");
        // Simulate background checks
        setInterval(SmartNotifications.checkLocationEvents, 15000); // Every 15s
        setInterval(SmartNotifications.checkTimeEvents, 30000); // Every 30s
    },

    checkLocationEvents: () => {
        if (!navigator.geolocation || typeof Notify === 'undefined') {
            return;
        }

        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude.toFixed(5);
            const lng = position.coords.longitude.toFixed(5);
            const lastLocation = localStorage.getItem('smart_last_location');
            const currentLocation = `${lat},${lng}`;

            if (lastLocation !== currentLocation) {
                localStorage.setItem('smart_last_location', currentLocation);
                Notify.show(
                    "تحديث الموقع الجغرافي",
                    `أنت الآن بالقرب من الإحداثيات ${currentLocation}. تم تحديد الخدمات الطبية الأقرب إليك.`,
                    "fas fa-map-marker-alt"
                );
            }
        }, (error) => {
            console.warn('Geolocation unavailable for notifications:', error);
        }, {
            enableHighAccuracy: true,
            maximumAge: 60000,
            timeout: 10000
        });
    },

    checkTimeEvents: () => {
        const events = [
            { title: "صيدلية محفوظة", msg: "صيدلية 'الخير' بدأت مناوبتها الآن في منطقتك.", icon: "fas fa-pills" },
            { title: "تذكير موعد", msg: "موعد د. ليلى أحمد بعد 60 دقيقة.", icon: "fas fa-clock" },
            { title: "تنبيه عائلي", msg: "قام 'أحمد' بتفعيل مشاركة الموقع المؤقتة.", icon: "fas fa-users-viewfinder" }
        ];

        const event = events[Math.floor(Math.random() * events.length)];
        if (typeof Notify !== 'undefined') {
            Notify.show(event.title, event.msg, event.icon);
        }
    },

    triggerEmergencyBroadCast: (user) => {
        Notify.show(
            "تنبيه طوارئ عاجل",
            `خطير: ${user} في حالة طارئة بموقع (حي الشعلان). تم إبلاغ الإسعاف وأقرب كابتن تكسي طبي.`,
            "fas fa-exclamation-triangle",
            "danger"
        );
    }
};

// Auto-start if in a page that supports it
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    SmartNotifications.init();
} else {
    document.addEventListener('DOMContentLoaded', SmartNotifications.init);
}
