import React, { useState, useRef } from "react";
import {
    generateTextFromPrompt,
    saveProject,
    processTextWithAI,
} from "../services/api.js";

const ProjectModal = ({ isOpen, onClose, onProjectCreated, token }) => {
    const [formData, setFormData] = useState({
        title: "",
        prompt: "",
    });
    const [generatedText, setGeneratedText] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState("");
    const [uploadMethod, setUploadMethod] = useState("text");
    const fileInputRef = useRef(null);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        console.log("Selected file:", file.name, file.type, file.size);

        // Проверка типа файла
        const allowedTypes = [
            "text/plain",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        const fileExtension = file.name.split(".").pop().toLowerCase();
        const isAllowedType =
            allowedTypes.includes(file.type) ||
            ["txt", "pdf", "doc", "docx"].includes(fileExtension);

        if (!isAllowedType) {
            alert("Пожалуйста, выберите файл в формате TXT, PDF или DOC/DOCX");
            return;
        }

        // Проверка размера файла (максимум 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert("Файл слишком большой. Максимальный размер - 10MB");
            return;
        }

        setSelectedFile(file);
        readFileContent(file);
    };

    const readFileContent = (file) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            if (
                file.type === "application/pdf" ||
                file.name.toLowerCase().endsWith(".pdf")
            ) {
                // Для PDF файлов просто показываем имя файла
                setFileContent(`Файл PDF: ${file.name}`);
                setFormData((prev) => ({
                    ...prev,
                    prompt: `Обработай содержимое PDF файла: ${file.name}`,
                }));
            } else {
                // Для текстовых файлов читаем содержимое
                const content = e.target.result;
                setFileContent(
                    content.substring(0, 500) +
                        (content.length > 500 ? "..." : "")
                );
                setFormData((prev) => ({
                    ...prev,
                    prompt: content.substring(0, 2000), // Ограничиваем длину промта
                }));
            }
        };

        reader.onerror = () => {
            alert("Ошибка при чтении файла");
            setSelectedFile(null);
            setFileContent("");
        };

        if (
            file.type === "application/pdf" ||
            file.name.toLowerCase().endsWith(".pdf")
        ) {
            // Для PDF просто используем имя файла
            setFileContent(`Файл PDF: ${file.name}`);
            setFormData((prev) => ({
                ...prev,
                prompt: `Обработай содержимое PDF файла: ${file.name}`,
            }));
        } else {
            reader.readAsText(file, "UTF-8");
        }
    };

    const handleGenerate = async () => {
        if (uploadMethod === "text" && !formData.prompt.trim()) {
            alert("Введите промт или загрузите файл");
            return;
        }

        if (uploadMethod === "file" && !selectedFile) {
            alert("Пожалуйста, выберите файл");
            return;
        }

        setLoading(true);
        try {
            let result;

            if (uploadMethod === "file" && selectedFile) {
                // Для файлов используем существующую функцию обработки текста
                if (
                    selectedFile.type === "text/plain" ||
                    selectedFile.name.toLowerCase().endsWith(".txt")
                ) {
                    // Для TXT файлов читаем содержимое и обрабатываем
                    const text = await readFileAsText(selectedFile);
                    result = await processTextWithAI(text);
                } else {
                    // Для PDF и DOC - используем промт с именем файла
                    result = await generateTextFromPrompt(
                        `Создай подробную лекцию на основе содержимого файла "${selectedFile.name}". 
                        Структурируй информацию логически, выдели основные темы и ключевые моменты.`
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
            alert("Ошибка генерации: " + error.message);
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
            reader.readAsText(file, "UTF-8");
        });
    };

    const handleSave = async () => {
        console.log("Save button clicked");
        console.log("Form data:", formData);
        console.log("Generated text:", generatedText);
        console.log("Selected file:", selectedFile);
        console.log("Token:", token);

        if (!formData.title.trim() || !generatedText) {
            console.log("Validation failed - missing title or generated text");
            alert("Заполните название проекта");
            return;
        }

        try {
            console.log("Starting save process...");

            const projectData = {
                title: formData.title,
                prompt:
                    uploadMethod === "file"
                        ? `Файл: ${selectedFile?.name}`
                        : formData.prompt,
                generatedText: generatedText,
                fileType: selectedFile?.type || null,
                fileName: selectedFile?.name || null,
                fileSize: selectedFile?.size || null,
            };

            console.log("Project data to save:", projectData);

            const result = await saveProject(projectData, token);
            console.log("Save successful:", result);

            onProjectCreated();
            handleClose();
        } catch (error) {
            console.error("Save error:", error);
            alert("Ошибка сохранения: " + error.message);
        }
    };

    const handleClose = () => {
        setFormData({ title: "", prompt: "" });
        setGeneratedText("");
        setSelectedFile(null);
        setFileContent("");
        setUploadMethod("text");
        setStep(1);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        onClose();
    };

    const removeFile = () => {
        setSelectedFile(null);
        setFileContent("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Функция для клика по области загрузки
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

                        {/* Переключатель метода ввода */}
                        <div className="upload-method-selector">
                            <label>Способ ввода:</label>
                            <div className="method-buttons">
                                <button
                                    type="button"
                                    className={`method-btn ${
                                        uploadMethod === "text" ? "active" : ""
                                    }`}
                                    onClick={() => setUploadMethod("text")}
                                >
                                    📝 Текст
                                </button>
                                <button
                                    type="button"
                                    className={`method-btn ${
                                        uploadMethod === "file" ? "active" : ""
                                    }`}
                                    onClick={() => setUploadMethod("file")}
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
                            </div>
                        ) : (
                            <div className="file-upload-section">
                                <label>Загрузите файл:</label>

                                {/* Скрытый input file */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".txt,.pdf,.doc,.docx"
                                    onChange={handleFileSelect}
                                    style={{ display: "none" }}
                                />

                                {/* Область для загрузки файла */}
                                <div
                                    className="file-upload-area"
                                    onClick={handleUploadAreaClick}
                                    style={{ cursor: "pointer" }}
                                >
                                    {selectedFile ? (
                                        <div className="file-info">
                                            <div className="file-name">
                                                📄 {selectedFile.name}
                                            </div>
                                            <div className="file-size">
                                                {(
                                                    selectedFile.size / 1024
                                                ).toFixed(2)}{" "}
                                                KB
                                            </div>
                                            {fileContent && (
                                                <div className="file-preview">
                                                    <strong>
                                                        Предпросмотр:
                                                    </strong>
                                                    <p>{fileContent}</p>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Предотвращаем открытие диалога
                                                    removeFile();
                                                }}
                                                className="remove-file-btn"
                                            >
                                                Удалить файл
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="upload-prompt">
                                            <div className="upload-icon">
                                                📎
                                            </div>
                                            <p>
                                                Нажмите здесь чтобы выбрать файл
                                            </p>
                                            <small>
                                                Поддерживаемые форматы: TXT,
                                                PDF, DOC, DOCX (до 10MB)
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
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={
                                    (uploadMethod === "text" &&
                                        !formData.prompt.trim()) ||
                                    (uploadMethod === "file" &&
                                        !selectedFile) ||
                                    loading
                                }
                                className="btn-primary"
                            >
                                {loading
                                    ? "Генерируем..."
                                    : uploadMethod === "file"
                                    ? "Обработать файл"
                                    : "Сгенерировать текст"}
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="modal-body">
                        <div className="preview-section">
                            <h3>Сгенерированный текст:</h3>
                            <div className="generated-text">
                                {generatedText}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                onClick={() => setStep(1)}
                                className="btn-secondary"
                            >
                                ← Назад
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn-primary"
                            >
                                ✅ Сохранить проект
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectModal;
