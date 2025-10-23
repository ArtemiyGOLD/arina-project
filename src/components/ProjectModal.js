import React, { useState } from 'react';
import { generateTextFromPrompt, saveProject } from '../services/api.js';

const ProjectModal = ({ isOpen, onClose, onProjectCreated, token }) => {
  const [formData, setFormData] = useState({
    title: '',
    prompt: ''
  });
  const [generatedText, setGeneratedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 - форма, 2 - предпросмотр

  const handleGenerate = async () => {
    if (!formData.prompt.trim()) return;
    
    setLoading(true);
    try {
      const result = await generateTextFromPrompt(formData.prompt);
      setGeneratedText(result.data.generatedText);
      setStep(2);
    } catch (error) {
      alert('Ошибка генерации: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !generatedText) return;

    try {
      await saveProject({
        title: formData.title,
        prompt: formData.prompt,
        generatedText: generatedText
      }, token);

      onProjectCreated();
      handleClose();
    } catch (error) {
      alert('Ошибка сохранения: ' + error.message);
    }
  };

  const handleClose = () => {
    setFormData({ title: '', prompt: '' });
    setGeneratedText('');
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>🆕 Создать проект</h2>
          <button onClick={handleClose} className="close-btn">✕</button>
        </div>

        {step === 1 && (
          <div className="modal-body">
            <div className="form-group">
              <label>Название проекта:</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Введите название проекта"
              />
            </div>
            
            <div className="form-group">
              <label>Промт для генерации:</label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData({...formData, prompt: e.target.value})}
                placeholder="Опишите, какой текст нужно сгенерировать..."
                rows="6"
              />
            </div>

            <div className="modal-actions">
              <button onClick={handleClose} className="btn-secondary">Отмена</button>
              <button 
                onClick={handleGenerate}
                disabled={!formData.prompt.trim() || loading}
                className="btn-primary"
              >
                {loading ? 'Генерируем...' : 'Сгенерировать текст'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="modal-body">
            <div className="preview-section">
              <h3>Сгенерированный текст:</h3>
              <div className="generated-text">
                {generatedText}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setStep(1)} className="btn-secondary">
                ← Назад
              </button>
              <button onClick={handleSave} className="btn-primary">
                ✅ Сохранить проект
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectModal;