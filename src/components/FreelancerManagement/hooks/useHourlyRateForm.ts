import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { hourlyRateSchema, IHourlyRateFormValues } from '../schemas';

interface IUseHourlyRateFormProps {
  defaultRate: number;
  onSubmit: (data: IHourlyRateFormValues) => void;
}

export const useHourlyRateForm = ({ defaultRate, onSubmit }: IUseHourlyRateFormProps) => {
  const form = useForm<IHourlyRateFormValues>({
    resolver: zodResolver(hourlyRateSchema),
    defaultValues: {
      hourlyRate: defaultRate,
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return {
    form,
    handleSubmit,
  };
};
