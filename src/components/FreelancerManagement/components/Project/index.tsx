import React from 'react';
import { IProject } from '../../types';
import { useProject } from './hooks/useProject';
import { Subtask } from '../Subtask';

interface IProjectProps {
  project: IProject;
  clientId: string;
  hourlyRate: number;
  onAddSubtask: (clientId: string, projectId: string) => void;
  onToggleSubtaskCompletion: (clientId: string, projectId: string, subtaskId: string) => void;
  onDeleteProject: (clientId: string, projectId: string) => void;
  onDeleteSubtask: (clientId: string, projectId: string, subtaskId: string) => void;
  onCalculateTotal: (project: IProject) => number;
}

export const Project: React.FC<IProjectProps> = ({
  project,
  clientId,
  hourlyRate,
  onAddSubtask,
  onToggleSubtaskCompletion,
  onDeleteProject,
  onDeleteSubtask,
  onCalculateTotal,
}) => {
  const { isExpanded, toggleExpanded, projectTotal, subtasksCount } = useProject({
    project,
    hourlyRate,
    onCalculateTotal,
  });

  return (
    <div
      style={{
        marginLeft: '2rem',
        marginBottom: '1rem',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '1rem',
          backgroundColor: '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={toggleExpanded}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <span style={{ fontSize: '1.25rem' }}>{isExpanded ? '▼' : '▶'}</span>
          <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{project.projectName}</h4>
          <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            ({subtasksCount} tarefas)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
            R$ {projectTotal.toFixed(2)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddSubtask(clientId, project.id);
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            + Tarefa
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteProject(clientId, project.id);
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Excluir
          </button>
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '1rem' }}>
          {project.subtasks.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
              Nenhuma tarefa adicionada
            </p>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 80px 60px',
                  gap: '1rem',
                  padding: '0.75rem',
                  borderBottom: '2px solid #d1d5db',
                  fontWeight: 600,
                  backgroundColor: '#f3f4f6',
                }}
              >
                <div>Nome da Tarefa</div>
                <div>Horas Projetadas</div>
                <div>Preço Total</div>
                <div>Concluída</div>
                <div>Ações</div>
              </div>
              {project.subtasks.map((subtask) => (
                <Subtask
                  key={subtask.id}
                  subtask={subtask}
                  clientId={clientId}
                  projectId={project.id}
                  hourlyRate={hourlyRate}
                  onToggleCompletion={onToggleSubtaskCompletion}
                  onDelete={onDeleteSubtask}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

Project.displayName = 'Project';
