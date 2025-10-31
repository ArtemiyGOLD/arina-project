import React, { useState, useRef } from "react";
import { generateTextFromPrompt, saveProject, processTextWithAI } from "../services/api.js";

const ProjectModal = ({ isOpen, onClose, onProjectCreated, token }) => {
    const [formData, setFormData] = useState({
        title: "",
        prompt: "",
    });
    const [generatedText, setGeneratedText] = useState("");
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState("");
    const [uploadMethod, setUploadMethod] = useState("text");
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        console.log("Selected file:", file.name, file.type, file.size);
        setError("");

        // Проверка типа файла
        const allowedExtensions = ['txt', 'pdf', 'doc', 'docx'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
            setError("Пожалуйста, выберите файл в формате TXT, PDF или DOC/DOCX");
            return;
        }

        // Проверка размера файла (максимум 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError("Файл слишком большой. Максимальный размер - 10MB");
            return;
        }

        setSelectedFile(file);
        
        // Для разных типов файлов разная логика
        if (fileExtension === 'txt') {
            readTextFileContent(file);
        } else {
            // Для PDF и DOC файлов просто показываем информацию о файле
            setFileContent(`Файл ${fileExtension.toUpperCase()}: ${file.name}\n\nЭтот формат файла не поддерживает предпросмотр текста. Вы можете обработать файл, но текст будет сгенерирован на основе названия файла.`);
            setFormData(prev => ({
                ...prev,
                prompt: `Создай лекцию на тему связанную с файлом: ${file.name}`
            }));
        }
    };

    const readTextFileContent = (file) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const content = e.target.result;
            setFileContent(content.substring(0, 1000) + (content.length > 1000 ? "\n\n..." : ""));
            setFormData(prev => ({
                ...prev,
                prompt: content.substring(0, 3000) // Ограничиваем длину промта
            }));
        };

        reader.onerror = () => {
            setError("Ошибка при чтении файла");
            setSelectedFile(null);
            setFileContent("");
        };

        reader.readAsText(file, 'UTF-8');
    };

    const handleGenerate = async () => {
        if (uploadMethod === "text" && !formData.prompt.trim()) {
            setError("Введите промт для генерации");
            return;
        }

        if (uploadMethod === "file" && !selectedFile) {
            setError("Пожалуйста, выберите файл");
            return;
        }

        setLoading(true);
        setError("");

        try {
            let result;
            
            if (uploadMethod === "file" && selectedFile) {
                const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
                
                if (fileExtension === 'txt') {
                    // Для TXT файлов обрабатываем содержимое
                    const text = await readFileAsText(selectedFile);
                    result = await processTextWithAI(text);
                } else {
                    // Для PDF и DOC - генерируем на основе названия файла
                    result = await generateTextFromPrompt(
                        `Создай подробную образовательную лекцию на тему, связанную с файлом "${selectedFile.name}". 
                        Лекция должна быть структурированной, информативной и полезной для обучения.
                        Раскрой основные концепции, предоставьте примеры и объясните ключевые моменты.`
                    );
                }
            } else {
                // Генерируем из текстового промта
                result = await generateTextFromPrompt(formData.prompt);
            }
            
            setGeneratedText(result.data.generatedText || result.data.summary);
            setStep(2);
        } catch (error) {
            console.error("Generation error:", error);
            setError("Ошибка генерации: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Вспомогательная функция для чтения файла как текст
    const readFileAsText = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error("Ошибка чтения файла"));
            reader.readAsText(file, 'UTF-8');
        });
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            setError("Введите название проекта");
            return;
        }

        if (!generatedText) {
            setError("Нет сгенерированного текста для сохранения");
            return;
        }

        setSaveLoading(true);

        try {
            const projectData = {
                title: formData.title.trim(),
                prompt: uploadMethod === "file" ? 
                    `Файл: ${selectedFile?.name || "неизвестный файл"}` : 
                    formData.prompt.trim(),
                generatedText: generatedText,
                fileType: selectedFile?.type || null,
                fileName: selectedFile?.name || null,
                fileSize: selectedFile?.size || null,
            };

            await saveProject(projectData, token);

            if (onProjectCreated) {
                onProjectCreated();
            }
            
            handleClose();
            
        } catch (error) {
            console.error("Save error:", error);
            setError("Ошибка сохранения: " + (error.message || "Неизвестная ошибка"));
        } finally {
            setSaveLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ title: "", prompt: "" });
        setGeneratedText("");
        setSelectedFile(null);
        setFileContent("");
        setUploadMethod("text");
        setStep(1);
        setError("");
        setSaveLoading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        if (onClose) {
            onClose();
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        setFileContent("");
        setError("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleUploadAreaClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>🆕 Создать проект</h2>
                    <button onClick={handleClose} className="close-btn">
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="error-message" style={{
                        background: "#f8d7da",
                        color: "#721c24",
                        padding: "12px",
                        borderRadius: "6px",
                        marginBottom: "15px",
                        border: "1px solid #f5c6cb"
                    }}>
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Название проекта:</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        title: e.target.value,
                                    })
                                }
                                placeholder="Введите название проекта"
                            />
                        </div>

                        <div className="upload-method-selector">
                            <label>Способ ввода:</label>
                            <div className="method-buttons">
                                <button
                                    type="button"
                                    className={`method-btn ${uploadMethod === "text" ? "active" : ""}`}
                                    onClick={() => {
                                        setUploadMethod("text");
                                        setError("");
                                    }}
                                >
                                    📝 Текст
                                </button>
                                <button
                                    type="button"
                                    className={`method-btn ${uploadMethod === "file" ? "active" : ""}`}
                                    onClick={() => {
                                        setUploadMethod("file");
                                        setError("");
                                    }}
                                >
                                    📎 Файл
                                </button>
                            </div>
                        </div>

                        {uploadMethod === "text" ? (
                            <div className="form-group">
                                <label>Промт для генерации:</label>
                                <textarea
                                    value={formData.prompt}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            prompt: e.target.value,
                                        })
                                    }
                                    placeholder="Опишите, какой текст нужно сгенерировать..."
                                    rows="6"
                                />
                                <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                                    Например: "Объясни основы квантовой физики" или "Расскажи о Второй мировой войне"
                                </div>
                            </div>
                        ) : (
                            <div className="file-upload-section">
                                <label>Загрузите файл:</label>
                                
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".txt,.pdf,.doc,.docx"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                                
                                <div 
                                    className="file-upload-area"
                                    onClick={handleUploadAreaClick}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {selectedFile ? (
                                        <div className="file-info">
                                            <div className="file-name">📄 {selectedFile.name}</div>
                                            <div className="file-size">
                                                {(selectedFile.size / 1024).toFixed(2)} KB
                                            </div>
                                            <div className="file-type">
                                                Тип: {selectedFile.name.split('.').pop().toUpperCase()}
                                            </div>
                                            {fileContent && (
                                                <div className="file-preview">
                                                    <strong>Информация:</strong>
                                                    <p style={{ whiteSpace: 'pre-wrap' }}>{fileContent}</p>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFile();
                                                }}
                                                className="remove-file-btn"
                                            >
                                                Удалить файл
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="upload-prompt">
                                            <div className="upload-icon">📎</div>
                                            <p>Нажмите здесь чтобы выбрать файл</p>
                                            <small>
                                                Поддерживаемые форматы: TXT, PDF, DOC, DOCX (до 10MB)<br/>
                                                TXT файлы будут обработаны полностью, PDF/DOC - по названию файла
                                            </small>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                onClick={handleClose}
                                className="btn-secondary"
                                disabled={loading}
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={
                                    (uploadMethod === "text" && !formData.prompt.trim()) ||
                                    (uploadMethod === "file" && !selectedFile) ||
                                    loading
                                }
                                className="btn-primary"
                            >
                                {loading
                                    ? "🔄 Генерируем..."
                                    : uploadMethod === "file" 
                                        ? "📄 Обработать файл" 
                                        : "🤖 Сгенерировать текст"}
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="modal-body">
                        <div className="preview-section">
                            <h3>📝 Сгенерированный текст:</h3>
                            <div className="generated-text">
                                {generatedText}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                onClick={() => {
                                    setStep(1);
                                    setError("");
                                }}
                                className="btn-secondary"
                                disabled={saveLoading}
                            >
                                ← Назад к редактированию
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn-primary"
                                disabled={saveLoading || !generatedText}
                            >
                                {saveLoading ? "⏳ Сохранение..." : "✅ Сохранить проект"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectModal;