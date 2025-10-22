import React, { useState } from 'react';
import TextProcessor from './TextProcessor.js';
import LectureHistory from './LectureHistory.js';

const Dashboard = ({ user, onLogout }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState(null);

  const handleSelectLecture = (lecture) => {
    setSelectedLecture(lecture);
    setShowHistory(false);
  };

  const handleNewAnalysis = () => {
    setSelectedLecture(null);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🤖 Lector App</h1>
            <span className="user-greeting">
              👋 Добро пожаловать, {user?.name || user?.email}!
            </span>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={() => setShowHistory(true)}
              className="history-btn"
            >
              📚 История
            </button>
            {selectedLecture && (
              <button 
                onClick={handleNewAnalysis}
                className="new-analysis-btn"
              >
                ➕ Новый анализ
              </button>
            )}
            <button onClick={onLogout} className="logout-btn">
              🚪 Выйти
            </button>
          </div>
        </div>
      </header>
      
      <main className="dashboard-main">
        {selectedLecture ? (
          <div className="lecture-view">
            <div className="lecture-view-header">
              <h2>{selectedLecture.title}</h2>
              <span className="lecture-view-date">
                Анализ от: {new Date(selectedLecture.createdAt).toLocaleString('ru-RU')}
              </span>
            </div>
            
            <div className="lecture-sections">
              <div className="lecture-section">
                <h3>📄 Исходный текст:</h3>
                <div className="original-text">
                  {selectedLecture.originalText}
                </div>
              </div>
              
              <div className="lecture-section">
                <h3>🎯 Основные мысли:</h3>
                <div className="summary-text">
                  {selectedLecture.summary}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <TextProcessor token={user.token} />
        )}
      </main>

      {showHistory && (
        <LectureHistory 
          token={user.token}
          onSelectLecture={handleSelectLecture}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;