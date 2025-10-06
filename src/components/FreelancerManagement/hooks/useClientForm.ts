import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema, IClientFormValues } from '../schemas';

interface IUseClientFormProps {
  onSubmit: (data: IClientFormValues) => void;
}

export const useClientForm = ({ onSubmit }: IUseClientFormProps) => {
  const form = useForm<IClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      clientName: '',
      whatsappNumber: '',
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
