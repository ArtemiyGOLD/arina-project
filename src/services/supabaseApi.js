import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

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