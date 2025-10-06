import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, IProjectFormValues } from '../schemas';

interface IUseProjectFormProps {
  onSubmit: (data: IProjectFormValues) => void;
}

export const useProjectForm = ({ onSubmit }: IUseProjectFormProps) => {
  const form = useForm<IProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      projectName: '',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
    form.reset();
  });

  return {
    form,
    handleSubmit,
  };
};
