import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface Patient {
  id: number;
  username: string;
}

interface AddPatientFormProps {
  onPatientAdded: () => void;
}

const AddPatientForm = ({ onPatientAdded }: AddPatientFormProps) => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["usersPatients"],
    queryFn: async () => {
      const res = await axios.get("https://gossamer-lilac-fog.glitch.me/api/users/patients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
  });

  const handleAddPatient = async () => {
    try {
      const response = await fetch("https://gossamer-lilac-fog.glitch.me/api/caretaker/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ patientId: parseInt(selectedPatientId) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add patient");
      }

      toast({ title: "Success", description: data.message });
      setSelectedPatientId("");

      // 👇 Refresh patients list in CaretakerDashboard
      onPatientAdded?.();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 mt-4">
      <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select a patient to add" />
        </SelectTrigger>
        <SelectContent>
          {patients.length > 0 ? (
            patients.map((patient) => (
              <SelectItem key={patient.id} value={String(patient.id)}>
                {patient.username}
              </SelectItem>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              No patients available
            </div>
          )}
        </SelectContent>
      </Select>
      <Button onClick={handleAddPatient} disabled={!selectedPatientId}>
        Add Patient
      </Button>
    </div>
  );
};

export default AddPatientForm;
