import React from 'react';
import { useClientForm } from '../../hooks/useClientForm';
import { IClientFormValues } from '../../schemas';

interface IAddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IClientFormValues) => void;
}

export const AddClientModal: React.FC<IAddClientModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { form, handleSubmit } = useClientForm({
    onSubmit: (data) => {
      onSubmit(data);
      onClose();
    },
  });

  const {
    register,
    formState: { errors },
  } = form;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Adicionar Cliente</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="clientName"
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
            >
              Nome do Cliente
            </label>
            <input
              id="clientName"
              {...register('clientName')}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
              }}
            />
            {errors.clientName && (
              <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.clientName.message}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="whatsappNumber"
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
            >
              Número do WhatsApp
            </label>
            <input
              id="whatsappNumber"
              {...register('whatsappNumber')}
              placeholder="Ex: 5511999999999"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
              }}
            />
            {errors.whatsappNumber && (
              <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.whatsappNumber.message}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

AddClientModal.displayName = 'AddClientModal';
