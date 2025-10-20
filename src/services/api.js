import axios from 'axios';

const API_BASE_URL = 'https://openrouter.ai/api/v1';
const DB_API_URL = 'http://localhost:3001';
const API_KEY = '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';

// Создаем экземпляр axios для OpenRouter
const openRouterAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Создаем экземпляр axios для JSON Server
const dbAPI = axios.create({
  baseURL: DB_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Функции для работы с пользователями
export const registerUser = async (userData) => {
  try {
    // Проверяем, нет ли уже пользователя с таким email
    const existingUsers = await dbAPI.get('/users', {
      params: { email: userData.email }
    });

    if (existingUsers.data.length > 0) {
      throw new Error('Пользователь с таким email уже существует');
    }

    // Создаем нового пользователя
    const response = await dbAPI.post('/users', {
      ...userData,
      createdAt: new Date().toISOString()
    });

    // Генерируем простой токен (в реальном приложении используйте JWT)
    const token = btoa(JSON.stringify({
      id: response.data.id,
      email: response.data.email
    }));

    return {
      data: {
        token,
        user: {
          id: response.data.id,
          email: response.data.email,
          name: response.data.name
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (userData) => {
  try {
    // Ищем пользователя по email
    const response = await dbAPI.get('/users', {
      params: { email: userData.email }
    });

    if (response.data.length === 0) {
      throw new Error('Пользователь не найден');
    }

    const user = response.data[0];

    // В реальном приложении здесь должно быть хеширование пароля
    if (user.password !== userData.password) {
      throw new Error('Неверный пароль');
    }

    // Генерируем токен
    const token = btoa(JSON.stringify({
      id: user.id,
      email: user.email
    }));

    return {
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
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
    
    const response = await dbAPI.post('/lectures', {
      ...lectureData,
      userId: user.id,
      createdAt: new Date().toISOString()
    });

    return response;
  } catch (error) {
    throw error;
  }
};

export const getUserLectures = async (token) => {
  try {
    const user = JSON.parse(atob(token));
    
    const response = await dbAPI.get('/lectures', {
      params: { userId: user.id, _sort: 'createdAt', _order: 'desc' }
    });

    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteLecture = async (lectureId, token) => {
  try {
    const response = await dbAPI.delete(`/lectures/${lectureId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Функция для обработки текста с помощью нейросети
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
      max_tokens: 1000,
      temperature: 0.3
    });

    return {
      data: {
        summary: response.data.choices[0].message.content
      }
    };
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || 'Ошибка API');
  }
};