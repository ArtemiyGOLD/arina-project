import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/api.js';

const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Очищаем ошибку при вводе
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      if (isLogin) {
        response = await loginUser(formData);
      } else {
        response = await registerUser(formData);
      }
      
      onLogin(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Произошла ошибка при авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form fade-in">
        <h2>{isLogin ? '🔐 Вход' : '👤 Регистрация'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Имя пользователя:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Введите ваше имя"
                required
                disabled={loading}
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Email адрес:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Пароль:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Введите пароль"
              required
              minLength="6"
              disabled={loading}
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? '⏳ Загрузка...' : (isLogin ? 'Войти' : 'Создать аккаунт')}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          {isLogin ? 'Еще нет аккаунта? ' : 'Уже есть аккаунт? '}
          <span 
            className="toggle-link" 
            onClick={() => {
              if (!loading) {
                setIsLogin(!isLogin);
                setError('');
              }
            }}
          >
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;