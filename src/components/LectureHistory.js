import React, { useState, useEffect } from 'react';
import { getUserLectures, deleteLecture } from '../services/api.js';

const LectureHistory = ({ token, onSelectLecture, onClose }) => {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLectures();
  }, [token]);

  const loadLectures = async () => {
    try {
      setLoading(true);
      const response = await getUserLectures(token);
      setLectures(response.data);
    } catch (err) {
      setError('Ошибка при загрузке истории');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLecture = async (lectureId) => {
    if (!window.confirm('Удалить эту запись?')) return;

    try {
      await deleteLecture(lectureId, token);
      setLectures(lectures.filter(lecture => lecture.id !== lectureId));
    } catch (err) {
      setError('Ошибка при удалении');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  if (loading) {
    return (
      <div className="lecture-history-overlay">
        <div className="lecture-history-modal">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Загрузка истории...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lecture-history-overlay">
      <div className="lecture-history-modal">
        <div className="history-header">
          <h2>📚 История лекций</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="lectures-list">
          {lectures.length === 0 ? (
            <div className="empty-history">
              <div className="empty-icon">📝</div>
              <h3>История пуста</h3>
              <p>Здесь появятся все проанализированные вами тексты</p>
            </div>
          ) : (
            lectures.map(lecture => (
              <div key={lecture.id} className="lecture-card">
                <div className="lecture-header">
                  <h4>{lecture.title}</h4>
                  <span className="lecture-date">
                    {formatDate(lecture.createdAt)}
                  </span>
                </div>
                
                <div className="lecture-preview">
                  {lecture.summary.substring(0, 150)}...
                </div>

                <div className="lecture-actions">
                  <button 
                    onClick={() => onSelectLecture(lecture)}
                    className="action-btn view-btn"
                  >
                    👁️ Просмотреть
                  </button>
                  <button 
                    onClick={() => handleDeleteLecture(lecture.id)}
                    className="action-btn delete-btn"
                  >
                    🗑️ Удалить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LectureHistory;