import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Supabase клиент
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// OpenRouter API
const API_BASE_URL = 'https://openrouter.ai/api/v1';
const API_KEY = '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';
const openRouterAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Регистрация
export const registerUser = async (userData) => {
  try {
    // Проверяем есть ли пользователь
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      throw new Error('Пользователь с таким email уже существует');
    }

    // Создаем пользователя
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: userData.email,
        password: userData.password,
        name: userData.name,
      }])
      .select();

    if (error) throw error;

    const token = btoa(JSON.stringify({ id: data[0].id, email: data[0].email }));

    return {
      data: {
        token,
        user: { id: data[0].id, email: data[0].email, name: data[0].name }
      }
    };
  } catch (error) {
    throw error;
  }
};

// Вход
export const loginUser = async (userData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', userData.email)
      .single();

    if (error) throw new Error('Пользователь не найден');
    if (data.password !== userData.password) throw new Error('Неверный пароль');

    const token = btoa(JSON.stringify({ id: data.id, email: data.email }));

    return {
      data: {
        token,
        user: { id: data.id, email: data.email, name: data.name }
      }
    };
  } catch (error) {
    throw error;
  }
};

// Сохранение лекции
export const saveLecture = async (lectureData, token) => {
  try {
    const user = JSON.parse(atob(token));
    
    const { data, error } = await supabase
      .from('lectures')
      .insert([{
        user_id: user.id,
        title: lectureData.title,
        original_text: lectureData.originalText,
        summary: lectureData.summary,
      }])
      .select();

    if (error) throw error;
    
    // Форматируем ответ
    const formattedData = {
      id: data[0].id,
      userId: data[0].user_id,
      title: data[0].title,
      originalText: data[0].original_text,
      summary: data[0].summary,
      createdAt: data[0].created_at
    };

    return { data: formattedData };
  } catch (error) {
    console.error('Save lecture error:', error);
    throw error;
  }
};

// Получение лекций
export const getUserLectures = async (token) => {
  try {
    const user = JSON.parse(atob(token));
    
    const { data, error } = await supabase
      .from('lectures')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Форматируем данные
    const formattedData = data.map(lecture => ({
      id: lecture.id,
      userId: lecture.user_id,
      title: lecture.title,
      originalText: lecture.original_text,
      summary: lecture.summary,
      createdAt: lecture.created_at
    }));

    return { data: formattedData };
  } catch (error) {
    console.error('Get lectures error:', error);
    throw error;
  }
};

// Удаление лекции
export const deleteLecture = async (lectureId, token) => {
  try {
    const { error } = await supabase
      .from('lectures')
      .delete()
      .eq('id', lectureId);

    if (error) throw error;
    return { data: {} };
  } catch (error) {
    console.error('Delete lecture error:', error);
    throw error;
  }
};

// Анализ текста AI
export const processTextWithAI = async (text) => {
  const prompt = `Проанализируй следующий текст и выдели основные мысли и ключевые идеи. Представь результат в виде краткой выжимки:

${text}

Выжимка основных мыслей:`;

  try {
    const response = await openRouterAPI.post('/chat/completions', {
      model: "deepseek/deepseek-chat",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    return {
      data: {
        summary: response.data.choices[0].message.content
      }
    };
  } catch (error) {
    console.error('AI API error:', error);
    throw new Error('Ошибка при анализе текста');
  }
};