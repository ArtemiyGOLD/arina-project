
import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm.js';
import Dashboard from './components/Dashboard.js';
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