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
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result; // ← ИЗМЕНИЛИ НА result
      if (isLogin) {
        result = await loginUser(formData);
      } else {
        result = await registerUser(formData);
      }
      
      console.log('API Response:', result);
      console.log('User data:', result.data.user); 
      
      onLogin(result.data); 
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Произошла ошибка при авторизации'); 
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