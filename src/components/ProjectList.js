import React from 'react';

const ProjectList = ({ projects, onProjectSelect, onNewProject }) => {
  return (
    <div className="project-list">
      <div className="projects-header">
        <h2>📁 Мои проекты</h2>
        <button onClick={onNewProject} className="new-project-btn">
          ➕ Новый проект
        </button>
      </div>

      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="empty-projects">
            <div className="empty-icon">📝</div>
            <h3>Проектов пока нет</h3>
            <p>Создайте первый проект, нажав на кнопку выше</p>
          </div>
        ) : (
          projects.map(project => (
            <div 
              key={project.id} 
              className="project-card"
              onClick={() => onProjectSelect(project)}
            >
              <h3>{project.title}</h3>
              <p className="project-preview">
                {project.prompt.substring(0, 100)}...
              </p>
              <span className="project-date">
                {new Date(project.createdAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectList;