import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { subtaskSchema, ISubtaskFormValues } from '../schemas';

interface IUseSubtaskFormProps {
  onSubmit: (data: ISubtaskFormValues) => void;
}

export const useSubtaskForm = ({ onSubmit }: IUseSubtaskFormProps) => {
  const form = useForm<ISubtaskFormValues>({
    resolver: zodResolver(subtaskSchema),
    defaultValues: {
      taskName: '',
      projectedHours: 0,
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
