import React from 'react';
import { IClient, IProject } from '../../types';
import { useClient } from './hooks/useClient';
import { Project } from '../Project';

interface IClientProps {
  client: IClient;
  hourlyRate: number;
  onAddProject: (clientId: string) => void;
  onAddSubtask: (clientId: string, projectId: string) => void;
  onToggleSubtaskCompletion: (clientId: string, projectId: string, subtaskId: string) => void;
  onDeleteClient: (clientId: string) => void;
  onDeleteProject: (clientId: string, projectId: string) => void;
  onDeleteSubtask: (clientId: string, projectId: string, subtaskId: string) => void;
  onCalculateClientTotal: (client: IClient) => number;
  onCalculateProjectTotal: (project: IProject) => number;
  onGetServicesCount: (client: IClient) => number;
}

export const Client: React.FC<IClientProps> = ({
  client,
  hourlyRate,
  onAddProject,
  onAddSubtask,
  onToggleSubtaskCompletion,
  onDeleteClient,
  onDeleteProject,
  onDeleteSubtask,
  onCalculateClientTotal,
  onCalculateProjectTotal,
  onGetServicesCount,
}) => {
  const { isExpanded, toggleExpanded, clientTotal, servicesCount, handleWhatsAppClick } =
    useClient({
      client,
      onCalculateTotal: onCalculateClientTotal,
      onGetServicesCount,
    });

  return (
    <div
      style={{
        marginBottom: '1.5rem',
        border: '2px solid #3b82f6',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div
        style={{
          padding: '1.5rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          cursor: 'pointer',
        }}
        onClick={toggleExpanded}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <span style={{ fontSize: '1.5rem' }}>{isExpanded ? '▼' : '▶'}</span>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{client.clientName}</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                {servicesCount} serviços
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                R$ {clientTotal.toFixed(2)}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleWhatsAppClick();
              }}
              style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: '#25d366',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              📱 WhatsApp
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddProject(client.id);
              }}
              style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              + Projeto
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClient(client.id);
              }}
              style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              Excluir
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '1.5rem', backgroundColor: 'white' }}>
          {client.projects.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '3rem', fontSize: '1.1rem' }}>
              Nenhum projeto adicionado
            </p>
          ) : (
            client.projects.map((project) => (
              <Project
                key={project.id}
                project={project}
                clientId={client.id}
                hourlyRate={hourlyRate}
                onAddSubtask={onAddSubtask}
                onToggleSubtaskCompletion={onToggleSubtaskCompletion}
                onDeleteProject={onDeleteProject}
                onDeleteSubtask={onDeleteSubtask}
                onCalculateTotal={onCalculateProjectTotal}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

Client.displayName = 'Client';
