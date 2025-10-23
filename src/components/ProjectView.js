import React, { useState } from "react";
import { generateSpeech } from "../services/api.js";

const ProjectView = ({ project, onBack }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioError, setAudioError] = useState("");

    const handlePlayAudio = async () => {
        if (!project.generatedText) {
            setAudioError("Нет текста для озвучки");
            return;
        }

        setIsPlaying(true);
        setAudioError("");

        try {
            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(
                    project.generatedText
                );

                utterance.lang = "ru-RU";
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;

                utterance.onend = () => {
                    setIsPlaying(false);
                };

                utterance.onerror = (event) => {
                    console.error("Speech synthesis error:", event);
                    setAudioError("Ошибка воспроизведения аудио");
                    setIsPlaying(false);
                };

                window.speechSynthesis.speak(utterance);
            } else {
                setAudioError("Ваш браузер не поддерживает озвучку текста");
                setIsPlaying(false);
            }
        } catch (error) {
            console.error("Audio playback error:", error);
            setAudioError("Ошибка при воспроизведении аудио");
            setIsPlaying(false);
        }
    };

    const handleStopAudio = () => {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        }
    };

    const handleCopyText = () => {
        navigator.clipboard
            .writeText(project.generatedText)
            .then(() => {
                alert("Текст скопирован в буфер обмена!");
            })
            .catch((err) => {
                console.error("Failed to copy text: ", err);
            });
    };

    return (
        <div className="project-view">
            <div className="project-view-header">
                <button onClick={onBack} className="back-btn">
                    ← Назад к проектам
                </button>

                <div className="header-actions">
                    <h1>{project.title}</h1>

                    <div className="action-buttons">
                        <button
                            onClick={handleCopyText}
                            className="action-btn copy-btn"
                            title="Скопировать текст"
                        >
                            📋
                        </button>

                        {isPlaying ? (
                            <button
                                onClick={handleStopAudio}
                                className="action-btn stop-btn"
                                title="Остановить воспроизведение"
                            >
                                ⏹️ Стоп
                            </button>
                        ) : (
                            <button
                                onClick={handlePlayAudio}
                                disabled={!project.generatedText}
                                className="action-btn play-btn"
                                title="Озвучить текст"
                            >
                                🔈 Озвучить
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {audioError && (
                <div className="error-message audio-error">{audioError}</div>
            )}

            <div className="project-content">
                <div className="project-section">
                    <div className="section-header">
                        <h3>🎯 Исходный промт:</h3>
                        <span className="section-badge">Вводные данные</span>
                    </div>
                    <div className="prompt-text">{project.prompt}</div>
                </div>

                <div className="project-section">
                    <div className="section-header">
                        <h3>📄 Сгенерированный текст:</h3>
                        <span className="section-badge">Результат AI</span>
                    </div>
                    <div className="generated-content">
                        {project.generatedText ? (
                            <div className="text-content">
                                {project.generatedText}
                            </div>
                        ) : (
                            <div className="no-content">
                                <div className="no-content-icon">📝</div>
                                <p>Текст не сгенерирован</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="project-meta">
                    <div className="meta-item">
                        <span className="meta-label">Создан:</span>
                        <span className="meta-value">
                            {new Date(project.createdAt).toLocaleDateString(
                                "ru-RU",
                                {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                }
                            )}
                        </span>
                    </div>

                    {project.generatedText && (
                        <div className="meta-item">
                            <span className="meta-label">Длина текста:</span>
                            <span className="meta-value">
                                {project.generatedText.length} символов
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .project-view {
                    padding: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .project-view-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                    gap: 15px;
                }

                .back-btn {
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background 0.3s;
                }

                .back-btn:hover {
                    background: #5a6268;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    flex-wrap: wrap;
                }

                .header-actions h1 {
                    margin: 0;
                    color: #333;
                    font-size: 28px;
                }

                .action-buttons {
                    display: flex;
                    gap: 10px;
                }

                .action-btn {
                    padding: 10px 15px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .play-btn {
                    background: #28a745;
                    color: white;
                }

                .play-btn:hover:not(:disabled) {
                    background: #218838;
                }

                .play-btn:disabled {
                    background: #6c757d;
                    cursor: not-allowed;
                }

                .stop-btn {
                    background: #dc3545;
                    color: white;
                }

                .stop-btn:hover {
                    background: #c82333;
                }

                .copy-btn {
                    background: #17a2b8;
                    color: white;
                }

                .copy-btn:hover {
                    background: #138496;
                }

                .audio-error {
                    background: #f8d7da;
                    color: #721c24;
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    border: 1px solid #f5c6cb;
                }

                .project-content {
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                }

                .project-section {
                    background: white;
                    border-radius: 12px;
                    padding: 25px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e9ecef;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .section-header h3 {
                    margin: 0;
                    color: #495057;
                    font-size: 18px;
                }

                .section-badge {
                    background: #e9ecef;
                    color: #495057;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                }

                .prompt-text {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #007bff;
                    line-height: 1.6;
                    color: #495057;
                    white-space: pre-wrap;
                }

                .generated-content {
                    min-height: 200px;
                }

                .text-content {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #28a745;
                    line-height: 1.6;
                    color: #495057;
                    white-space: pre-wrap;
                }

                .no-content {
                    text-align: center;
                    padding: 40px 20px;
                    color: #6c757d;
                }

                .no-content-icon {
                    font-size: 48px;
                    margin-bottom: 10px;
                }

                .project-meta {
                    display: flex;
                    gap: 30px;
                    flex-wrap: wrap;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border: 1px solid #e9ecef;
                }

                .meta-item {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .meta-label {
                    font-size: 12px;
                    color: #6c757d;
                    font-weight: 500;
                    text-transform: uppercase;
                }

                .meta-value {
                    font-size: 14px;
                    color: #495057;
                    font-weight: 500;
                }

                @media (max-width: 768px) {
                    .project-view {
                        padding: 15px;
                    }

                    .project-view-header {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .header-actions {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .action-buttons {
                        justify-content: center;
                    }

                    .project-meta {
                        flex-direction: column;
                        gap: 15px;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProjectView;
