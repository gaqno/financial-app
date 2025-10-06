import { useState, useCallback, useMemo } from 'react';
import { IClient } from '../../../types';

interface IUseClientProps {
  client: IClient;
  onCalculateTotal: (client: IClient) => number;
  onGetServicesCount: (client: IClient) => number;
}

export const useClient = ({ client, onCalculateTotal, onGetServicesCount }: IUseClientProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const clientTotal = useMemo(() => {
    return onCalculateTotal(client);
  }, [client, onCalculateTotal]);

  const servicesCount = useMemo(() => {
    return onGetServicesCount(client);
  }, [client, onGetServicesCount]);

  const handleWhatsAppClick = useCallback(() => {
    const cleanNumber = client.whatsappNumber.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanNumber}`;
    window.open(whatsappUrl, '_blank');
  }, [client.whatsappNumber]);

  return {
    isExpanded,
    toggleExpanded,
    clientTotal,
    servicesCount,
    handleWhatsAppClick,
  };
};
