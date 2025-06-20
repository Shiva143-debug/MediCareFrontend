import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MedicationList from './MedicationList';
import { MedicationContext } from '@/contexts/MedicationContext';

// Mock the medication context
const mockMedicationContext = {
  medications: [
    {
      id: 1,
      name: 'Aspirin',
      dosage: '100mg',
      frequency: 'daily',
      time: '08:00',
      created_at: '2023-01-01T08:00:00.000Z',
    },
    {
      id: 2,
      name: 'Vitamin D',
      dosage: '1000 IU',
      frequency: 'daily',
      time: '09:00',
      created_at: '2023-01-01T09:00:00.000Z',
    },
  ],
  medicationLogs: [],
  isLoadingMedications: false,
  isLoadingLogs: false,
  errorMedications: null,
  errorLogs: null,
  addMedication: vi.fn(),
  updateMedication: vi.fn(),
  deleteMedication: vi.fn(),
  logMedication: vi.fn(),
  getMedicationLogs: vi.fn(),
  getAdherenceRate: vi.fn(),
  getCurrentStreak: vi.fn(),
};

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('MedicationList', () => {
  const onAddMedication = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the medication list correctly', () => {
    render(
      <MedicationContext.Provider value={mockMedicationContext}>
        <MedicationList onAddMedication={onAddMedication} />
      </MedicationContext.Provider>
    );

    // Check if medications are rendered
    expect(screen.getByText('Aspirin')).toBeInTheDocument();
    expect(screen.getByText('Vitamin D')).toBeInTheDocument();
    expect(screen.getByText('100mg - Daily')).toBeInTheDocument();
    expect(screen.getByText('1000 IU - Daily')).toBeInTheDocument();
  });

  it('shows empty state when no medications', () => {
    const emptyContext = {
      ...mockMedicationContext,
      medications: [],
    };

    render(
      <MedicationContext.Provider value={emptyContext}>
        <MedicationList onAddMedication={onAddMedication} />
      </MedicationContext.Provider>
    );

    expect(screen.getByText('No medications added yet')).toBeInTheDocument();
    
    // Check if the add button is rendered
    const addButton = screen.getByRole('button', { name: /add medication/i });
    expect(addButton).toBeInTheDocument();
    
    // Click the add button
    fireEvent.click(addButton);
    expect(onAddMedication).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when loading medications', () => {
    const loadingContext = {
      ...mockMedicationContext,
      isLoadingMedications: true,
    };

    render(
      <MedicationContext.Provider value={loadingContext}>
        <MedicationList onAddMedication={onAddMedication} />
      </MedicationContext.Provider>
    );

    // Check if loading spinner is rendered
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});