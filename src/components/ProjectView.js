import React from 'react';

const ProjectView = ({ project, onBack }) => {
  return (
    <div className="project-view">
      <div className="project-view-header">
        <button onClick={onBack} className="back-btn">← Назад к проектам</button>
        <h1>{project.title}</h1>
      </div>

      <div className="project-content">
        <div className="project-section">
          <h3>🎯 Исходный промт:</h3>
          <div className="prompt-text">{project.prompt}</div>
        </div>

        <div className="project-section">
          <h3>📄 Сгенерированный текст:</h3>
          <div className="generated-content">
            {project.generatedText}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectView;