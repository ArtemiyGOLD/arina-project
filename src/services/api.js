import axios from 'axios';

const API_BASE_URL = 'https://openrouter.ai/api/v1';
const API_KEY = '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';

const openRouterAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Простая имитация БД через localStorage для Vercel
export const registerUser = async (userData) => {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find(u => u.email === userData.email)) {
      throw new Error('Пользователь с таким email уже существует');
    }

    const newUser = {
      id: Date.now(),
      ...userData,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    const token = btoa(JSON.stringify({ id: newUser.id, email: newUser.email }));

    return {
      data: {
        token,
        user: { id: newUser.id, email: newUser.email, name: newUser.name }
      }
    };
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (userData) => {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === userData.email && u.password === userData.password);
    
    if (!user) throw new Error('Неверный email или пароль');

    const token = btoa(JSON.stringify({ id: user.id, email: user.email }));

    return {
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name }
      }
    };
  } catch (error) {
    throw error;
  }
};

export const saveLecture = async (lectureData, token) => {
  try {
    const user = JSON.parse(atob(token));
    const lectures = JSON.parse(localStorage.getItem('lectures') || '[]');
    
    const newLecture = {
      id: Date.now(),
      userId: user.id,
      ...lectureData,
      createdAt: new Date().toISOString()
    };

    lectures.push(newLecture);
    localStorage.setItem('lectures', JSON.stringify(lectures));

    return { data: newLecture };
  } catch (error) {
    console.error('Save lecture error:', error);
    return { data: { id: Date.now() } };
  }
};

export const getUserLectures = async (token) => {
  try {
    const user = JSON.parse(atob(token));
    const lectures = JSON.parse(localStorage.getItem('lectures') || '[]');
    
    const userLectures = lectures
      .filter(lecture => lecture.userId === user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { data: userLectures };
  } catch (error) {
    console.error('Get lectures error:', error);
    return { data: [] };
  }
};

export const deleteLecture = async (lectureId, token) => {
  try {
    const lectures = JSON.parse(localStorage.getItem('lectures') || '[]');
    const filteredLectures = lectures.filter(lecture => lecture.id !== parseInt(lectureId));
    
    localStorage.setItem('lectures', JSON.stringify(filteredLectures));
    return { data: {} };
  } catch (error) {
    console.error('Delete lecture error:', error);
    return { data: {} };
  }
};

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
    // Fallback ответ
    return {
      data: {
        summary: `Основные мысли из текста:\n\n1. Текст содержит важную информацию\n2. Ключевые идеи представлены в структурированном виде\n3. Основная тема требует внимательного изучения\n\nЭто тестовый ответ.`
      }
    };
  }
};