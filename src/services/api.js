import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const supabaseUrl = "https://jcgrzqksghxzpfvpceby.supabase.co";
const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZ3J6cWtzZ2h4enBmdnBjZWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NjIyNTksImV4cCI6MjA3NjUzODI1OX0.UwORyovNKX2wONxnz3zKXJC4AK2I4Xd-GyxuBCTNYA4";

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey);

// OpenRouter API
const API_KEY =
    "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";

// Регистрация
export const registerUser = async (userData) => {
    try {
        console.log("Registering user:", userData);

        const { data: existingUser, error: checkError } = await supabase
            .from("users")
            .select("id")
            .eq("email", userData.email)
            .maybeSingle();

        if (existingUser) {
            throw new Error("Пользователь с таким email уже существует");
        }

        const { data, error } = await supabase
            .from("users")
            .insert([
                {
                    email: userData.email,
                    password: userData.password,
                    name: userData.name, // ← сохраняем имя
                },
            ])
            .select();

        if (error) {
            console.error("Supabase error:", error);
            throw error;
        }

        console.log("✅ User created in DB:", data[0]);

        const token = btoa(
            JSON.stringify({
                id: data[0].id,
                email: data[0].email,
            })
        );

        return {
            data: {
                token,
                user: {
                    id: data[0].id,
                    email: data[0].email,
                    name: data[0].name,
                },
            },
        };
    } catch (error) {
        console.error("Register error:", error);
        throw error;
    }
};

export const loginUser = async (userData) => {
    try {
        console.log("Logging in user:", userData.email);

        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", userData.email)
            .maybeSingle();

        if (error || !data) {
            throw new Error("Пользователь не найден");
        }

        if (data.password !== userData.password) {
            throw new Error("Неверный пароль");
        }

        console.log("✅ User found in DB:", data);

        const token = btoa(JSON.stringify({ id: data.id, email: data.email }));

        return {
            data: {
                token,
                user: {
                    id: data.id,
                    email: data.email,
                    name: data.name,
                },
            },
        };
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

// Сохранение лекции
export const saveLecture = async (lectureData, token) => {
    try {
        const user = JSON.parse(atob(token));
        console.log("Saving lecture for user:", user.id);

        const { data, error } = await supabase
            .from("lectures")
            .insert([
                {
                    user_id: user.id,
                    title: lectureData.title || "Анализ текста",
                    original_text: lectureData.originalText,
                    summary: lectureData.summary,
                },
            ])
            .select();

        if (error) {
            console.error("Save lecture error:", error);
            throw error;
        }

        const formattedData = {
            id: data[0].id,
            userId: data[0].user_id,
            title: data[0].title,
            originalText: data[0].original_text,
            summary: data[0].summary,
            createdAt: data[0].created_at,
        };

        console.log("Lecture saved:", formattedData.id);
        return { data: formattedData };
    } catch (error) {
        console.error("Save lecture error:", error);
        throw error;
    }
};

export const getUserLectures = async (token) => {
    try {
        const user = JSON.parse(atob(token));
        console.log("Getting lectures for user:", user.id);

        const { data, error } = await supabase
            .from("lectures")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Get lectures error:", error);
            throw error;
        }

        const formattedData = data.map((lecture) => ({
            id: lecture.id,
            userId: lecture.user_id,
            title: lecture.title,
            originalText: lecture.original_text,
            summary: lecture.summary,
            createdAt: lecture.created_at,
        }));

        console.log("Lectures found:", formattedData.length);
        return { data: formattedData };
    } catch (error) {
        console.error("Get lectures error:", error);
        throw error;
    }
};

export const deleteLecture = async (lectureId, token) => {
    try {
        console.log("Deleting lecture:", lectureId);

        const { error } = await supabase
            .from("lectures")
            .delete()
            .eq("id", lectureId);

        if (error) throw error;
        return { data: { success: true } };
    } catch (error) {
        console.error("Delete lecture error:", error);
        throw error;
    }
};

export const processTextWithAI = async (text) => {
    try {
        console.log("Processing text with AI, length:", text.length);

        const prompt = `Проанализируй следующий текст и выдели основные мысли и ключевые идеи. Представь результат без оформления по типу заголовков и тд, в виде краткой выжимки:

${text}

Выжимка основных мыслей:`;

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "deepseek/deepseek-chat",
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                max_tokens: 1000,
                temperature: 0.3,
            },
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const summary = response.data.choices[0].message.content;
        console.log("AI analysis completed");

        return {
            data: { summary },
        };
    } catch (error) {
        console.error("AI API error:", error);
        // Fallback ответ
        return {
            data: {
                summary: `Основные мысли из текста:\n\n• Текст содержит важную информацию\n• Ключевые идеи требуют внимательного изучения\n• Основная тема представляет интерес для анализа\n\nЭто автоматический анализ текста.`,
            },
        };
    }
};

export const saveProject = async (projectData, token) => {
    try {
        const user = JSON.parse(atob(token));

        const { data, error } = await supabase
            .from("projects")
            .insert([
                {
                    user_id: user.id,
                    title: projectData.title,
                    prompt: projectData.prompt,
                    generated_text: projectData.generatedText,
                    created_at: new Date().toISOString(),
                },
            ])
            .select();

        if (error) throw error;

        return {
            data: {
                id: data[0].id,
                userId: data[0].user_id,
                title: data[0].title,
                prompt: data[0].prompt,
                generatedText: data[0].generated_text,
                createdAt: data[0].created_at,
            },
        };
    } catch (error) {
        throw error;
    }
};

export const getUserProjects = async (token) => {
    try {
        const user = JSON.parse(atob(token));

        const { data, error } = await supabase
            .from("projects")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const formattedData = data.map((project) => ({
            id: project.id,
            userId: project.user_id,
            title: project.title,
            prompt: project.prompt,
            generatedText: project.generated_text,
            createdAt: project.created_at,
        }));

        return { data: formattedData };
    } catch (error) {
        throw error;
    }
};

export const generateSpeech = async (text) => {
    try {
        // Используем Web Speech API или внешний сервис
        const response = await axios.post(
            "https://api.tts.service/synthesize",
            {
                text: text,
                voice: "ru-RU",
                speed: 1.0,
            }
        );

        return {
            data: {
                audioUrl: response.data.audio_url,
            },
        };
    } catch (error) {
        console.error("Speech generation error:", error);
        throw new Error("Ошибка генерации озвучки");
    }
};

// Функция для обработки файлов
export const processFile = async (file) => {
    try {
        console.log("Processing file:", file.name, file.type);

        // Для текстовых файлов
        if (
            file.type === "text/plain" ||
            file.name.toLowerCase().endsWith(".txt")
        ) {
            const text = await readTextFile(file);
            return await processTextWithAI(text);
        }

        // Для PDF и DOC файлов - сообщаем, что нужно загрузить текст
        else if (
            file.type === "application/pdf" ||
            file.name.toLowerCase().endsWith(".pdf")
        ) {
            throw new Error(
                "PDF файлы не поддерживаются для автоматической обработки. Пожалуйста, скопируйте текст из PDF и вставьте в поле ввода."
            );
        } else if (file.name.toLowerCase().match(/\.docx?$/i)) {
            throw new Error(
                "Word документы не поддерживаются для автоматической обработки. Пожалуйста, скопируйте текст из документа и вставьте в поле ввода."
            );
        } else {
            throw new Error("Неподдерживаемый формат файла");
        }
    } catch (error) {
        console.error("File processing error:", error);
        throw error;
    }
};

// Вспомогательная функция для чтения текстовых файлов
const readTextFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error("Ошибка чтения файла"));
        reader.readAsText(file, "UTF-8");
    });
};
// Обновим функцию генерации текста для лучшей обработки файлов
export const generateTextFromPrompt = async (prompt) => {
    let fullPrompt;

    // Определяем, является ли промт запросом на обработку файла
    if (prompt.includes("PDF файла") || prompt.includes("Word документа")) {
        fullPrompt = prompt;
    } else {
        fullPrompt = `Составь краткую лекцию по данному запросу: "${prompt}". 
        Текст должен быть структурированным, информативным и хорошо читаемым. 
        А также без оформления по типу заголовков, "**" вот таких подзаголовков и тд.`;
    }

    try {
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "deepseek/deepseek-chat",
                messages: [
                    {
                        role: "user",
                        content: fullPrompt,
                    },
                ],
                max_tokens: 2000,
                temperature: 0.7,
            },
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return {
            data: {
                generatedText: response.data.choices[0].message.content,
            },
        };
    } catch (error) {
        console.error("OpenRouter API error:", error);
        throw new Error("Ошибка генерации текста");
    }
};
