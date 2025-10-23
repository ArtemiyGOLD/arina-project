import React, { useState, useEffect } from 'react';
import ProjectList from './ProjectList.js';
import ProjectModal from './ProjectModal.js';
import ProjectView from './ProjectView.js';
import { getUserProjects } from '../services/api.js';

const Dashboard = ({ user, onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await getUserProjects(user.token);
      setProjects(response.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = () => {
    loadProjects();
    setShowModal(false);
  };

  if (loading) {
    return <div className="loading">Загрузка проектов...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🚀 Lector-App</h1>
          <div className="user-info">
            <span>👋 {user.name}</span>
            <button onClick={onLogout} className="logout-btn">Выйти</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {selectedProject ? (
          <ProjectView 
            project={selectedProject} 
            onBack={() => setSelectedProject(null)} 
          />
        ) : (
          <ProjectList
            projects={projects}
            onProjectSelect={setSelectedProject}
            onNewProject={() => setShowModal(true)}
          />
        )}
      </main>

      <ProjectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onProjectCreated={handleProjectCreated}
        token={user.token}
      />
    </div>
  );
};

export default Dashboard;