import { useState, useCallback, useMemo } from 'react';
import { IProject } from '../../../types';

interface IUseProjectProps {
  project: IProject;
  hourlyRate: number;
  onCalculateTotal: (project: IProject) => number;
}

export const useProject = ({ project, hourlyRate, onCalculateTotal }: IUseProjectProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const projectTotal = useMemo(() => {
    return onCalculateTotal(project);
  }, [project, onCalculateTotal]);

  const subtasksCount = useMemo(() => {
    return project.subtasks.length;
  }, [project.subtasks]);

  return {
    isExpanded,
    toggleExpanded,
    projectTotal,
    subtasksCount,
  };
};
