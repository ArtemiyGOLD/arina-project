import axios from 'axios';
import { supabase } from './supabaseApi.js';

const API_BASE_URL = 'https://openrouter.ai/api/v1';
const API_KEY = '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';

// Создаем экземпляр axios для OpenRouter
const openRouterAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Функции для работы с пользователями - используем Supabase
export const registerUser = async (userData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: userData.email,
          password: userData.password,
          name: userData.name,
        }
      ])
      .select();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Пользователь с таким email уже существует');
      }
      throw error;
    }

    const token = btoa(JSON.stringify({
      id: data[0].id,
      email: data[0].email
    }));

    return {
      data: {
        token,
        user: {
          id: data[0].id,
          email: data[0].email,
          name: data[0].name
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (userData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', userData.email)
      .single();

    if (error) throw new Error('Пользователь не найден');
    if (data.password !== userData.password) throw new Error('Неверный пароль');

    const token = btoa(JSON.stringify({
      id: data.id,
      email: data.email
    }));

    return {
      data: {
        token,
        user: {
          id: data.id,
          email: data.email,
          name: data.name
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

// Функции для работы с лекциями
export const saveLecture = async (lectureData, token) => {
  try {
    const user = JSON.parse(atob(token));
    
    const { data, error } = await supabase
      .from('lectures')
      .insert([
        {
          user_id: user.id,
          title: lectureData.title,
          original_text: lectureData.originalText,
          summary: lectureData.summary,
        }
      ])
      .select();

    if (error) throw error;
    return { data: data[0] };
  } catch (error) {
    throw error;
  }
};

export const getUserLectures = async (token) => {
  try {
    const user = JSON.parse(atob(token));
    
    const { data, error } = await supabase
      .from('lectures')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

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
    throw error;
  }
};

export const deleteLecture = async (lectureId, token) => {
  try {
    const { error } = await supabase
      .from('lectures')
      .delete()
      .eq('id', lectureId);

    if (error) throw error;
    return { data: {} };
  } catch (error) {
    throw error;
  }
};

// Функция для обработки текста с помощью нейросети
// api.js - для разработки без реального API
export const processTextWithAI = async (text, modelType = 'DEEPSEEK') => {
  // Имитация задержки API
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const models = {
    'DEEPSEEK': 'DeepSeek-R1-Distill-Llama-70B',
    'GPT': 'GPT OSS 120B',
    'GIGACHAT': 'GigaChat 2 Max'
  };
  
  const modelName = models[modelType] || models.DEEPSEEK;
  
  // Генерация реалистичного демо-ответа
  const demoResponse = `Анализ текста с использованием ${modelName} 
  
Дата анализа: ${new Date().toLocaleString('ru-RU')}
Длина текста: ${text.length} символов

 Ключевые мысли: 
1. Текст содержит важную информацию для анализа
2. Основная тема прослеживается в нескольких аспектах
3. Представлены аргументы и примеры

 Структурированная выжимка: 
• Первый ключевой пункт: ${text.substring(0, 50)}...
• Второй важный аспект: ${text.substring(50, 100)}...
• Основной вывод: Текст требует внимательного изучения

 Рекомендации: 
- Обратить внимание на основные тезисы
- Рассмотреть практическое применение
- Сопоставить с дополнительными источниками
`;

  return {
    data: {
      summary: demoResponse,
      model: modelName
    }
  };
};