import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

export interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  created_at: string;
}

export interface MedicationLog {
  id: number;
  medication_id: number;
  user_id: number;
  taken_at: string;
  proof_image: string | null;
  name?: string;
  dosage?: string;
  time?: string;
}

interface MedicationContextType {
  medications: Medication[];
  medicationLogs: MedicationLog[];
  isLoadingMedications: boolean;
  isLoadingLogs: boolean;
  errorMedications: Error | null;
  errorLogs: Error | null;
  addMedication: (medication: Omit<Medication, 'id' | 'created_at'>) => Promise<Medication>;
  updateMedication: (id: number, medication: Omit<Medication, 'id' | 'created_at'>) => Promise<Medication>;
  deleteMedication: (id: number) => Promise<void>;
  logMedication: (medicationId: number, proofImage?: File) => Promise<MedicationLog>;
  getMedicationLogs: (startDate?: string, endDate?: string) => Promise<MedicationLog[]>;
  getAdherenceRate: () => number;
  getCurrentStreak: () => number;
}

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

export const useMedication = () => {
  const context = useContext(MedicationContext);
  if (context === undefined) {
    throw new Error('useMedication must be used within a MedicationProvider');
  }
  return context;
};

interface MedicationProviderProps {
  children: ReactNode;
}

export const MedicationProvider = ({ children }: MedicationProviderProps) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // Fetch medications
  const {
    data: medications = [],
    isLoading: isLoadingMedications,
    error: errorMedications,
  } = useQuery({
    queryKey: ['medications'],
    queryFn: async () => {
      if (!token) return [];
      
      const response = await fetch('http://localhost:5000/api/medications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch medications');
      }
      
      return response.json();
    },
    enabled: !!token,
  });

  // Fetch medication logs
  const {
    data: medicationLogs = [],
    isLoading: isLoadingLogs,
    error: errorLogs,
  } = useQuery({
    queryKey: ['medicationLogs'],
    queryFn: async () => {
      if (!token) return [];
      
      const response = await fetch('http://localhost:5000/api/medication-logs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch medication logs');
      }
      
      return response.json();
    },
    enabled: !!token,
  });

  // Add medication mutation
  const addMedicationMutation = useMutation({
    mutationFn: async (medication: Omit<Medication, 'id' | 'created_at'>) => {
      const response = await fetch('http://localhost:5000/api/medications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(medication),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add medication');
      }
      
      const data = await response.json();
      return data.medication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });

  // Update medication mutation
  const updateMedicationMutation = useMutation({
    mutationFn: async ({ id, medication }: { id: number; medication: Omit<Medication, 'id' | 'created_at'> }) => {
      const response = await fetch(`http://localhost:5000/api/medications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(medication),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update medication');
      }
      
      const data = await response.json();
      return data.medication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });

  // Delete medication mutation
  const deleteMedicationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`http://localhost:5000/api/medications/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete medication');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['medicationLogs'] });
    },
  });

  // Log medication mutation
  const logMedicationMutation = useMutation({
    mutationFn: async ({ medicationId, proofImage }: { medicationId: number; proofImage?: File }) => {
      const formData = new FormData();
      if (proofImage) {
        formData.append('proof_image', proofImage);
      }
      
      const response = await fetch(`http://localhost:5000/api/medications/${medicationId}/log`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to log medication');
      }
      
      const data = await response.json();
      return data.log;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicationLogs'] });
    },
  });

  // Helper function to get medication logs for a specific date range
  const getMedicationLogs = async (startDate?: string, endDate?: string) => {
    if (!token) return [];
    
    let url = 'http://localhost:5000/api/medication-logs';
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch medication logs');
    }
    
    return response.json();
  };

  // Calculate adherence rate
  const getAdherenceRate = () => {
    if (!medications.length || !medicationLogs.length) return 0;
    
    // Get logs from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentLogs = medicationLogs.filter(log => {
      const logDate = new Date(log.taken_at);
      return logDate >= thirtyDaysAgo;
    });
    
    // Calculate total expected logs (medications * days)
    const totalExpected = medications.length * 30;
    
    // Calculate adherence rate
    return Math.round((recentLogs.length / totalExpected) * 100);
  };

  // Calculate current streak
  const getCurrentStreak = () => {
    if (!medicationLogs.length) return 0;
    
    // Sort logs by date (newest first)
    const sortedLogs = [...medicationLogs].sort((a, b) => {
      return new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime();
    });
    
    // Group logs by date
    const logsByDate = sortedLogs.reduce<Record<string, MedicationLog[]>>((acc, log) => {
      const date = new Date(log.taken_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(log);
      return acc;
    }, {});
    
    // Check if all medications were taken each day
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date(today);
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const logsForDate = logsByDate[dateStr] || [];
      
      // If no logs for this date or not all medications were taken, break
      if (!logsForDate.length || logsForDate.length < medications.length) {
        break;
      }
      
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  };

  const value = {
    medications,
    medicationLogs,
    isLoadingMedications,
    isLoadingLogs,
    errorMedications,
    errorLogs,
    addMedication: (medication) => addMedicationMutation.mutateAsync(medication),
    updateMedication: (id, medication) => updateMedicationMutation.mutateAsync({ id, medication }),
    deleteMedication: (id) => deleteMedicationMutation.mutateAsync(id),
    logMedication: (medicationId, proofImage) => logMedicationMutation.mutateAsync({ medicationId, proofImage }),
    getMedicationLogs,
    getAdherenceRate,
    getCurrentStreak,
  };

  return <MedicationContext.Provider value={value}>{children}</MedicationContext.Provider>;
};