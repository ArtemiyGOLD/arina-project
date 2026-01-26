import React, { useState, useEffect, useRef } from "react";
import { processTextWithAI, saveLecture } from "../services/api.js";
import LoadingSpinner from "./LoadingSpinner.js";

const TextProcessor = ({ token, onNewLecture }) => {
    const [inputText, setInputText] = useState("");
    const [outputText, setOutputText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(true);
    const [speechError, setSpeechError] = useState("");
    const [audioPermission, setAudioPermission] = useState(null);
    const [saveStatus, setSaveStatus] = useState("");
    const speechSynthRef = useRef(null);
    const audioContextRef = useRef(null);

    useEffect(() => {
        if (!("speechSynthesis" in window)) {
            setSpeechSupported(false);
            setSpeechError("Браузер не поддерживает синтез речи");
            return;
        }

        speechSynthRef.current = window.speechSynthesis;

        const requestAudioPermission = async () => {
            try {
                // Создаем AudioContext только если его нет
                if (!audioContextRef.current) {
                    audioContextRef.current = new (
                        window.AudioContext || window.webkitAudioContext
                    )();
                }

                // Проверяем состояние AudioContext
                if (audioContextRef.current.state === "suspended") {
                    await audioContextRef.current.resume();
                }
                setAudioPermission("granted");
            } catch (error) {
                console.error("Audio permission error:", error);
                setAudioPermission("denied");
                setSpeechError("Не удалось получить доступ к звуку");
            }
        };

        const handleFirstInteraction = () => {
            requestAudioPermission();
            document.removeEventListener("click", handleFirstInteraction);
            document.removeEventListener("keydown", handleFirstInteraction);
        };

        document.addEventListener("click", handleFirstInteraction);
        document.addEventListener("keydown", handleFirstInteraction);

        // Функция очистки
        return () => {
            document.removeEventListener("click", handleFirstInteraction);
            document.removeEventListener("keydown", handleFirstInteraction);

            if (speechSynthRef.current) {
                speechSynthRef.current.cancel();
            }

            // Осторожно закрываем AudioContext
            if (
                audioContextRef.current &&
                audioContextRef.current.state !== "closed"
            ) {
                try {
                    audioContextRef.current.close();
                } catch (err) {
                    console.error("Error closing AudioContext:", err);
                }
            }
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!inputText.trim()) {
            setError("Пожалуйста, введите текст для анализа");
            return;
        }

        setLoading(true);
        setError("");
        setSaveStatus("");

        try {
            // Анализируем текст
            const result = await processTextWithAI(inputText);
            const summary = result.data.summary;
            setOutputText(summary);

            // Сохраняем лекцию в историю
            setSaveStatus("Сохраняем в историю...");

            const lectureTitle =
                inputText.substring(0, 50) +
                (inputText.length > 50 ? "..." : "");

            await saveLecture(
                {
                    title: lectureTitle,
                    originalText: inputText,
                    summary: summary,
                },
                token,
            );

            setSaveStatus("✅ Лекция сохранена в историю!");

            // Уведомляем родительский компонент о новой лекции
            if (onNewLecture) {
                onNewLecture();
            }

            // Показываем успех
            const outputElement = document.querySelector(".output-content");
            if (outputElement) {
                outputElement.classList.add("success");
                setTimeout(() => {
                    outputElement.classList.remove("success");
                    setSaveStatus("");
                }, 3000);
            }
        } catch (err) {
            console.error("Error:", err);
            setSaveStatus("❌ Не удалось сохранить лекцию");
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setInputText("");
        setOutputText("");
        setError("");
        setSpeechError("");
        setSaveStatus("");
        stopSpeaking();
    };

    const requestAudioPermission = async () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (
                    window.AudioContext || window.webkitAudioContext
                )();
            }

            await audioContextRef.current.resume();

            const oscillator = audioContextRef.current.createOscillator();
            const gainNode = audioContextRef.current.createGain();
            gainNode.gain.value = 0;
            oscillator.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);
            oscillator.start();
            oscillator.stop(audioContextRef.current.currentTime + 0.1);

            setAudioPermission("granted");
            setSpeechError("");

            setSpeechError("Разрешение на звук получено!");
            setTimeout(() => setSpeechError(""), 3000);
        } catch (error) {
            setAudioPermission("denied");
            setSpeechError("Разрешение на звук не получено");
        }
    };

    const speakText = async () => {
        if (!outputText) return;

        if (audioPermission !== "granted") {
            setSpeechError("Запрашиваем разрешение на звук...");
            await requestAudioPermission();

            if (audioPermission !== "granted") {
                setSpeechError("Не удалось получить разрешение на звук");
                return;
            }
        }

        if (isSpeaking) {
            stopSpeaking();
            return;
        }

        try {
            speechSynthRef.current.cancel();

            const speech = new SpeechSynthesisUtterance();
            speech.text = outputText;
            speech.lang = "ru-RU";
            speech.rate = 1.0;
            speech.pitch = 1.0;
            speech.volume = 1.0;

            let voices = speechSynthRef.current.getVoices();
            if (voices.length === 0) {
                await new Promise((resolve) => {
                    speechSynthRef.current.addEventListener(
                        "voiceschanged",
                        resolve,
                        { once: true },
                    );
                });
                voices = speechSynthRef.current.getVoices();
            }

            const russianVoice = voices.find(
                (voice) =>
                    voice.lang === "ru-RU" || voice.lang.includes("ru-RU"),
            );

            if (russianVoice) {
                speech.voice = russianVoice;
            }

            speech.onstart = () => {
                setIsSpeaking(true);
                setSpeechError("");
            };

            speech.onend = () => {
                setIsSpeaking(false);
            };

            speech.onerror = (event) => {
                setIsSpeaking(false);
                if (event.error === "not-allowed") {
                    setSpeechError("Разрешение на звук отклонено");
                    setAudioPermission("denied");
                } else {
                    setSpeechError(`Ошибка озвучки: ${event.error}`);
                }
            };

            speechSynthRef.current.speak(speech);
        } catch (error) {
            setSpeechError("Ошибка при запуске озвучки");
            setIsSpeaking(false);
        }
    };

    const stopSpeaking = () => {
        if (speechSynthRef.current) {
            speechSynthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    return (
        <div className="text-processor">
            <div className="processor-container">
                <form onSubmit={handleSubmit} className="text-form">
                    <div className="input-section">
                        <label htmlFor="input-text">
                            Введите текст для анализа:
                        </label>
                        <textarea
                            id="input-text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Вставьте сюда текст, который нужно проанализировать..."
                            rows="12"
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {saveStatus && (
                        <div
                            className={`save-status ${
                                saveStatus.includes("✅") ? "success" : "info"
                            }`}
                        >
                            {saveStatus}
                        </div>
                    )}

                    <div className="controls">
                        <button
                            type="submit"
                            disabled={loading || !inputText.trim()}
                            className="process-btn"
                        >
                            {loading
                                ? "📊 Анализируем..."
                                : "📊 Анализировать текст"}
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="clear-btn"
                        >
                            🗑️ Очистить
                        </button>
                    </div>
                </form>

                <div className="output-section">
                    <div className="output-header">
                        <label>Результат анализа:</label>
                        {outputText && speechSupported && (
                            <div className="speech-controls">
                                <button
                                    onClick={speakText}
                                    className={`speak-btn ${
                                        isSpeaking ? "speaking" : ""
                                    }`}
                                    type="button"
                                >
                                    {isSpeaking ? (
                                        <span className="speaking-indicator">
                                            🔇 Остановить
                                            <div className="wave">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </span>
                                    ) : (
                                        "🔊 Озвучить"
                                    )}
                                </button>

                                {audioPermission !== "granted" && (
                                    <button
                                        onClick={requestAudioPermission}
                                        className="permission-btn"
                                        type="button"
                                    >
                                        🎵 Разрешить звук
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {speechError && (
                        <div
                            className={`speech-message ${
                                audioPermission === "granted"
                                    ? "success"
                                    : "error"
                            }`}
                        >
                            {speechError}
                        </div>
                    )}

                    <div className="output-content">
                        {loading ? (
                            <LoadingSpinner />
                        ) : outputText ? (
                            <div className="summary-result">
                                <h3>🎯 Основные мысли:</h3>
                                <p>{outputText}</p>
                                <div className="lecture-saved-info">
                                    ✅ Эта лекция сохранена в вашей истории
                                </div>
                            </div>
                        ) : (
                            <div className="placeholder">
                                ✨ Здесь появится выжимка основных мыслей из
                                вашего текста
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TextProcessor;
