import React from 'react';
import { ISubtask } from '../../types';
import { useSubtask } from './hooks/useSubtask';

interface ISubtaskProps {
  subtask: ISubtask;
  clientId: string;
  projectId: string;
  hourlyRate: number;
  onToggleCompletion: (clientId: string, projectId: string, subtaskId: string) => void;
  onDelete: (clientId: string, projectId: string, subtaskId: string) => void;
}

export const Subtask: React.FC<ISubtaskProps> = ({
  subtask,
  clientId,
  projectId,
  hourlyRate,
  onToggleCompletion,
  onDelete,
}) => {
  const { handleToggle, handleDelete, isCompleted } = useSubtask({
    subtaskId: subtask.id,
    clientId,
    projectId,
    completed: subtask.completed,
    onToggleCompletion,
    onDelete,
  });

  const totalPrice = subtask.projectedHours * hourlyRate;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 80px 60px',
        gap: '1rem',
        padding: '0.75rem',
        borderBottom: '1px solid #e5e7eb',
        alignItems: 'center',
        backgroundColor: isCompleted ? '#f0fdf4' : 'transparent',
      }}
    >
      <div style={{ textDecoration: isCompleted ? 'line-through' : 'none' }}>
        {subtask.taskName}
      </div>
      <div>{subtask.projectedHours}h</div>
      <div style={{ fontWeight: 600 }}>
        R$ {totalPrice.toFixed(2)}
      </div>
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={handleToggle}
        style={{ cursor: 'pointer', width: '20px', height: '20px' }}
      />
      <button
        onClick={handleDelete}
        style={{
          padding: '0.5rem',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        ✕
      </button>
    </div>
  );
};

Subtask.displayName = 'Subtask';
