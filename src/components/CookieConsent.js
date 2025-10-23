// components/CookieConsent.js
import React, { useState, useEffect } from "react";
import { cookieService } from "../services/api.js";

const CookieConsent = ({ userId }) => {
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const consent = cookieService.getConsentCookie();
        if (!consent) {
            setShowBanner(true);
        }
    }, []);

    const handleAccept = async (analytics = true, marketing = false) => {
        const consentData = {
            type: "full",
            analytics: analytics,
            marketing: marketing,
        };

        if (userId) {
            await cookieService.saveConsent(userId, consentData);
        } else {
            cookieService.setConsentCookie(consentData);
        }

        setShowBanner(false);

        // Сохраняем сессию если пользователь авторизован
        if (userId) {
            await cookieService.saveSession(userId);
        }
    };

    const handleReject = () => {
        const consentData = {
            type: "necessary_only",
            analytics: false,
            marketing: false,
        };

        cookieService.setConsentCookie(consentData);
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div
            className="cookie-banner"
            style={{
                position: "fixed",
                bottom: "0",
                left: "0",
                right: "0",
                background: "#2c3e50",
                color: "white",
                padding: "20px",
                zIndex: "1000",
                boxShadow: "0 -2px 10px rgba(0,0,0,0.3)",
            }}
        >
            <div
                className="cookie-content"
                style={{ maxWidth: "1200px", margin: "0 auto" }}
            >
                <h3 style={{ margin: "0 0 10px 0" }}>🍪 Мы используем куки</h3>
                <p style={{ margin: "0 0 15px 0", lineHeight: "1.5" }}>
                    Мы используем куки для улучшения работы сайта. Обязательные
                    куки необходимы для работы сайта. Аналитические куки
                    помогают нам понять, как вы используете сайт.
                </p>
                <div
                    className="cookie-actions"
                    style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                >

                    <button
                        onClick={() => handleAccept(true, true)}
                        style={{
                            padding: "10px 20px",
                            background: "#3498db",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                        }}
                    >
                        Принять аналитические
                    </button>
                    <button
                        onClick={() => handleAccept(true, true)}
                        style={{
                            padding: "10px 20px",
                            background: "#27ae60",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                        }}
                    >
                        Принять все
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
