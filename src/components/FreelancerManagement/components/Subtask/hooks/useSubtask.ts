import { useCallback } from 'react';

interface IUseSubtaskProps {
  subtaskId: string;
  clientId: string;
  projectId: string;
  completed: boolean;
  onToggleCompletion: (clientId: string, projectId: string, subtaskId: string) => void;
  onDelete: (clientId: string, projectId: string, subtaskId: string) => void;
}

export const useSubtask = ({
  subtaskId,
  clientId,
  projectId,
  completed,
  onToggleCompletion,
  onDelete,
}: IUseSubtaskProps) => {
  const handleToggle = useCallback(() => {
    onToggleCompletion(clientId, projectId, subtaskId);
  }, [clientId, projectId, subtaskId, onToggleCompletion]);

  const handleDelete = useCallback(() => {
    onDelete(clientId, projectId, subtaskId);
  }, [clientId, projectId, subtaskId, onDelete]);

  return {
    handleToggle,
    handleDelete,
    isCompleted: completed,
  };
};
