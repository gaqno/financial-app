import React from 'react';
import { useHourlyRateForm } from '../../hooks/useHourlyRateForm';
import { IHourlyRateFormValues } from '../../schemas';

interface IEditHourlyRateModalProps {
  isOpen: boolean;
  currentRate: number;
  onClose: () => void;
  onSubmit: (data: IHourlyRateFormValues) => void;
}

export const EditHourlyRateModal: React.FC<IEditHourlyRateModalProps> = ({
  isOpen,
  currentRate,
  onClose,
  onSubmit,
}) => {
  const { form, handleSubmit } = useHourlyRateForm({
    defaultRate: currentRate,
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
          maxWidth: '400px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Editar Valor da Hora</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="hourlyRate"
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
            >
              Valor por Hora (R$)
            </label>
            <input
              id="hourlyRate"
              type="number"
              step="0.01"
              {...register('hourlyRate', { valueAsNumber: true })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
              }}
            />
            {errors.hourlyRate && (
              <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors.hourlyRate.message}
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
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

EditHourlyRateModal.displayName = 'EditHourlyRateModal';
