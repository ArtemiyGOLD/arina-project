import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm.js';
import Dashboard from './components/Dashboard.js';
import './styles/App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем, авторизован ли пользователь при загрузке
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (authData) => {
    console.log('🔑 App: Login data received:', authData);
    
    // ИСПРАВЛЕНИЕ: authData содержит { token, user }, а не сам user
    const userInfo = {
      token: authData.token,
      email: authData.user.email,
      name: authData.user.name  // ← ВОТ ОНО!
    };
    
    console.log('👤 App: Setting user to:', userInfo);
    
    setIsAuthenticated(true);
    setUser(userInfo);
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(userInfo));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="App">
      {!isAuthenticated ? (
        <AuthForm onLogin={handleLogin} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;