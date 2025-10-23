// App.js - добавляем CookieConsent
import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm.js';
import Dashboard from './components/Dashboard.js';
import CookieConsent from './components/CookieConsent.js';
import { cookieService } from './services/api.js';
import './styles/App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      const userObj = JSON.parse(userData);
      setUser(userObj);
      
      // Сохраняем сессию при загрузке если пользователь авторизован
      if (userObj.id && cookieService.hasConsentFor('analytics')) {
        cookieService.saveSession(userObj.id);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (authData) => {
    const userInfo = {
      id: authData.user.id,
      token: authData.token,
      email: authData.user.email,
      name: authData.user.name
    };
    
    setIsAuthenticated(true);
    setUser(userInfo);
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(userInfo));

    // Сохраняем сессию после логина
    if (cookieService.hasConsentFor('analytics')) {
      cookieService.saveSession(userInfo.id);
    }
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
        <>
          <AuthForm onLogin={handleLogin} />
          <CookieConsent userId={null} />
        </>
      ) : (
        <>
          <Dashboard user={user} onLogout={handleLogout} />
          <CookieConsent userId={user.id} />
        </>
      )}
    </div>
  );
}

export default App;