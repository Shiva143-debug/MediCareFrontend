
import { useState } from "react";
import { useMedication, Medication } from "@/contexts/MedicationContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Edit, Trash2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditMedicationForm from "./EditMedicationForm";

interface MedicationListProps {
  onAddMedication: () => void;
}

const MedicationList = ({ onAddMedication }: MedicationListProps) => {
  const { user } = useAuth();
  const { medications, medicationLogs, deleteMedication, logMedication, isLoadingMedications } = useMedication();
  const { toast } = useToast();

  const [medicationToDelete, setMedicationToDelete] = useState<Medication | null>(null);
  const [medicationToEdit, setMedicationToEdit] = useState<Medication | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const isMedicationTakenToday = (medicationId: number) => {
    return medicationLogs.some(log => {
      const logDate = new Date(log.taken_at).toISOString().split('T')[0];
      return log.medication_id === medicationId && logDate === today;
    });
  };

  const handleMarkTaken = async (medication: Medication) => {
    try {
      await logMedication(medication.id);
      toast({
        title: "Success",
        description: `${medication.name} marked as taken for today`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark medication as taken",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMedication = async () => {
    if (!medicationToDelete) return;

    try {
      await deleteMedication(medicationToDelete.id);
      toast({
        title: "Success",
        description: `${medicationToDelete.name} deleted successfully`,
      });
      setMedicationToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete medication",
        variant: "destructive",
      });
    }
  };

  const handleEditMedication = (medication: Medication) => {
    setMedicationToEdit(medication);
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setMedicationToEdit(null);
  };

  const handleAddClick = () => {
    if (user?.role === "caretaker") {
      toast({
        title: "Access Denied",
        description: "Caretakers are not allowed to add medications.",
        variant: "destructive",
      });
      return;
    }
    onAddMedication();
  };

  if (isLoadingMedications) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (medications.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-medium mb-2">No medications added yet</h3>
        <p className="text-muted-foreground mb-4">
          {user?.role === "caretaker"
            ? "Caretakers cannot add medications. Ask the patient to add them."
            : "Start tracking your medications by adding your first one."}
        </p>
        <Button onClick={handleAddClick}>Add Medication</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {medications.map((medication) => {
        const taken = isMedicationTakenToday(medication.id);
        return (
          <Card
            key={medication.id}
            className={`hover:shadow-md transition-shadow ${taken ? 'border-green-200 bg-green-50/50' : ''}`}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    taken ? 'bg-green-500' : 'bg-blue-100'
                  }`}
                >
                  {taken ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-blue-600 font-medium">{medication.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h4 className={`font-medium ${taken ? 'text-green-800' : ''}`}>{medication.name}</h4>
                  <p className={`text-sm ${taken ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {medication.dosage} - {formatFrequency(medication.frequency)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={taken ? "secondary" : "outline"} className={taken ? 'bg-green-100 text-green-800' : ''}>
                  <Clock className="w-3 h-3 mr-1" />
                  {medication.time}
                </Badge>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditMedication(medication)}
                    aria-label="Edit medication"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMedicationToDelete(medication)}
                    aria-label="Delete medication"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  {!taken && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() => handleMarkTaken(medication)}
                      aria-label="Mark as taken"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Take
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Delete Dialog */}
      <AlertDialog open={!!medicationToDelete} onOpenChange={(open) => !open && setMedicationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {medicationToDelete?.name} and all its history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMedication} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <EditMedicationForm medication={medicationToEdit} isOpen={isEditDialogOpen} onClose={closeEditDialog} />
    </div>
  );
};

function formatFrequency(freq: string) {
  switch (freq) {
    case "daily":
      return "Daily";
    case "twice_daily":
      return "Twice Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "as_needed":
      return "As Needed";
    default:
      return freq;
  }
}

export default MedicationList;
