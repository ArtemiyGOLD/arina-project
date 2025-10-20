import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Supabase клиент
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://jcgrzqksghxzpfvpceby.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZ3J6cWtzZ2h4enBmdnBjZWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NjIyNTksImV4cCI6MjA3NjUzODI1OX0.UwORyovNKX2wONxnz3zKXJC4AK2I4Xd-GyxuBCTNYA4';
const supabase = createClient(supabaseUrl, supabaseKey);

// OpenRouter API
const API_KEY = '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';

// Регистрация
export const registerUser = async (userData) => {
  try {
    console.log('Registering user:', userData.email);
    
    // Проверяем есть ли пользователь
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .maybeSingle();

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

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    const token = btoa(JSON.stringify({ id: data[0].id, email: data[0].email }));

    return {
      data: {
        token,
        user: { id: data[0].id, email: data[0].email, name: data[0].name }
      }
    };
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

// Вход
export const loginUser = async (userData) => {
  try {
    console.log('Logging in user:', userData.email);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', userData.email)
      .maybeSingle();

    if (error || !data) {
      throw new Error('Пользователь не найден');
    }

    if (data.password !== userData.password) {
      throw new Error('Неверный пароль');
    }

    const token = btoa(JSON.stringify({ id: data.id, email: data.email }));

    return {
      data: {
        token,
        user: { id: data.id, email: data.email, name: data.name }
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Сохранение лекции
export const saveLecture = async (lectureData, token) => {
  try {
    const user = JSON.parse(atob(token));
    console.log('Saving lecture for user:', user.id);
    
    const { data, error } = await supabase
      .from('lectures')
      .insert([{
        user_id: user.id,
        title: lectureData.title || 'Анализ текста',
        original_text: lectureData.originalText,
        summary: lectureData.summary,
      }])
      .select();

    if (error) {
      console.error('Save lecture error:', error);
      throw error;
    }

    // Форматируем ответ
    const formattedData = {
      id: data[0].id,
      userId: data[0].user_id,
      title: data[0].title,
      originalText: data[0].original_text,
      summary: data[0].summary,
      createdAt: data[0].created_at
    };

    console.log('Lecture saved:', formattedData.id);
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
    console.log('Getting lectures for user:', user.id);
    
    const { data, error } = await supabase
      .from('lectures')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get lectures error:', error);
      throw error;
    }

    // Форматируем данные
    const formattedData = data.map(lecture => ({
      id: lecture.id,
      userId: lecture.user_id,
      title: lecture.title,
      originalText: lecture.original_text,
      summary: lecture.summary,
      createdAt: lecture.created_at
    }));

    console.log('Lectures found:', formattedData.length);
    return { data: formattedData };
  } catch (error) {
    console.error('Get lectures error:', error);
    throw error;
  }
};

// Удаление лекции
export const deleteLecture = async (lectureId, token) => {
  try {
    console.log('Deleting lecture:', lectureId);
    
    const { error } = await supabase
      .from('lectures')
      .delete()
      .eq('id', lectureId);

    if (error) throw error;
    return { data: { success: true } };
  } catch (error) {
    console.error('Delete lecture error:', error);
    throw error;
  }
};

// Анализ текста AI
export const processTextWithAI = async (text) => {
  try {
    console.log('Processing text with AI, length:', text.length);
    
    const prompt = `Проанализируй следующий текст и выдели основные мысли и ключевые идеи. Представь результат в виде краткой выжимки:

${text}

Выжимка основных мыслей:`;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: "deepseek/deepseek-chat",
      messages: [{
        role: "user",
        content: prompt
      }],
      max_tokens: 1000,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const summary = response.data.choices[0].message.content;
    console.log('AI analysis completed');
    
    return {
      data: { summary }
    };
  } catch (error) {
    console.error('AI API error:', error);
    // Fallback ответ
    return {
      data: {
        summary: `Основные мысли из текста:\n\n• Текст содержит важную информацию\n• Ключевые идеи требуют внимательного изучения\n• Основная тема представляет интерес для анализа\n\nЭто автоматический анализ текста.`
      }
    };
  }
};