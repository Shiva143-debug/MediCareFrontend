import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const AddPatientForm = () => {
  const { token } = useAuth();
  const [patientId, setPatientId] = useState("");
  const { toast } = useToast();

  const handleAddPatient = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/caretaker/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ patientId: parseInt(patientId) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add patient");
      }

      toast({ title: "Success", description: data.message });
      setPatientId("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2 mt-4">
      <Input
        type="number"
        placeholder="Enter Patient ID"
        value={patientId}
        onChange={(e) => setPatientId(e.target.value)}
        className="w-64"
      />
      <Button onClick={handleAddPatient}>Add Patient</Button>
    </div>
  );
};

export default AddPatientForm;
