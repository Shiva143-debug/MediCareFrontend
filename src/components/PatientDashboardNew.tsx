import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Check, Calendar as CalendarIcon, PlusCircle, User } from "lucide-react";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import { useMedication } from "@/contexts/MedicationContext";
import { useAuth } from "@/contexts/AuthContext";
import MedicationList from "./Medications/MedicationList";
import AddMedicationForm from "./Medications/AddMedicationForm";
import MedicationTracker from "./MedicationTracker";
import { useToast } from "@/hooks/use-toast";

const PatientDashboardNew = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false);
  const [medAddedTrigger, setMedAddedTrigger] = useState(0);
  const [recentlyMarked, setRecentlyMarked] = useState<number[]>([]);
  const { medications } = useMedication();
  const { toast } = useToast();
  const { user, token } = useAuth();
  const {
    medicationLogs,
    isLoadingLogs,
    // refetch,
    getCurrentStreak,
    getAdherenceRate,
  } = useMedication();

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const isTodaySelected = isToday(selectedDate);

  const isMedicationTakenOnDate = (dateStr: string) => {
    return medicationLogs.some((log) => {
      const logDate = new Date(log.taken_at).toISOString().split("T")[0];
      return logDate === dateStr;
    });
  };

  const getLogsForDate = (dateStr: string) => {
    return medicationLogs.filter((log) => {
      const logDate = new Date(log.taken_at).toISOString().split("T")[0];
      return logDate === dateStr;
    });
  };

  const selectedDateLogs = getLogsForDate(selectedDateStr);
  // const isMedicationTakenToday = isMedicationTakenOnDate(todayStr);

  const takenDates = new Set(
    medicationLogs.map((log) =>
      new Date(log.taken_at).toISOString().split("T")[0]
    )
  );

  const adherenceRate = getAdherenceRate();
  const currentStreak = getCurrentStreak();

  const addMedicationLog = async ({
    medicationId,
    date,
    image,
  }: {
    medicationId: number;
    date: string;
    image?: File;
  }) => {
    try {
      const formData = new FormData();
      formData.append("taken_at", date);
      if (image) formData.append("image", image);

      await fetch(`https://gossamer-lilac-fog.glitch.me/api/medications/${medicationId}/log`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // await refetch();
      setRecentlyMarked((prev) => [...prev, medicationId]);

      toast({
        title: "Marked as Taken",
        description: "Medication successfully marked with optional photo.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark medication. Try again.",
        variant: "destructive",
      });
    }
  };



  const isMedicationTakenToday = (medicationId: number) => {
    const takenViaLogs = medicationLogs.some((log) => {
      const logDate = new Date(log.taken_at).toISOString().split("T")[0];
      return log.medication_id === medicationId && logDate === todayStr;
    });

    const takenJustNow = recentlyMarked.includes(medicationId);
    return takenViaLogs || takenJustNow; // ✅ Include local state
  };


  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
          </div>
          <div>
            <h2 className="text-3xl font-bold">
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"},{" "}
              {user?.username}!
            </h2>
            <p className="text-white/90 text-lg">Ready to stay on track with your medication?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{currentStreak}</div>
            <div className="text-white/80">Day Streak</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">
              {isMedicationTakenToday ? "✓" : "○"}
            </div>
            <div className="text-white/80">Today's Status</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-2xl font-bold">{adherenceRate}%</div>
            <div className="text-white/80">Monthly Rate</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Medications + Tracker */}
        <div className="lg:col-span-2 space-y-6">
          {/* Medication List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
                {isTodaySelected
                  ? "Today's Medication"
                  : `Medication for ${format(selectedDate, "MMMM d, yyyy")}`}
              </CardTitle>
              <Button
                onClick={() => {
                  if (user?.role === "caretaker") {
                    toast({
                      title: "Access Denied",
                      description: "Caretakers cannot add medications.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setIsAddMedicationOpen(true);
                }}
                variant="outline"
                size="sm"
                disabled={!isTodaySelected}
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Medication
              </Button>
            </CardHeader>
            <CardContent>
              <MedicationList
                key={medAddedTrigger}
                onAddMedication={() => setIsAddMedicationOpen(true)}
              />

            </CardContent>
          </Card>

          {user?.role !== "caretaker" &&
            isTodaySelected &&
            medications.map((med) => (
              <MedicationTracker
                // key={medAddedTrigger}
                key={med.id}
                medicationId={med.id}
                 medicationName={med.name} 
                date={todayStr}
                isTaken={isMedicationTakenToday(med.id)} 
                isToday={true}
                onMarkTaken={(medicationId, date, image) => {
                  addMedicationLog({ medicationId, date, image });
                }}
              />
            ))}

        </div>

        {/* Right Column: Calendar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Medication Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (!date) return;
                  if (!isToday(date)) {
                    toast({
                      title: "Only today's date is interactive",
                      description: "You can only manage medication for today.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setSelectedDate(date);
                }}
                className="w-full"
                modifiersClassNames={{
                  selected: "bg-blue-600 text-white hover:bg-blue-700",
                }}
                components={{
                  DayContent: ({ date }) => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    const isTaken = takenDates.has(dateStr);
                    const isPast = isBefore(date, startOfDay(today));
                    const isCurrentDay = isToday(date);

                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <span>{date.getDate()}</span>
                        {isTaken && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-2 h-2 text-white" />
                          </div>
                        )}
                        {!isTaken && isPast && !isCurrentDay && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full" />
                        )}
                      </div>
                    );
                  },
                }}
              />

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>Medication taken</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <span>Missed medication</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>Today</span>
                </div>
              </div>

              {selectedDateLogs.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">
                    Medications taken on {format(selectedDate, "MMMM d, yyyy")}
                  </h4>
                  <div className="space-y-2">
                    {selectedDateLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2 bg-green-50 rounded border border-green-200 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-medium">{log.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {log.dosage}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          {format(new Date(log.taken_at), "h:mm a")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <AddMedicationForm
        isOpen={isAddMedicationOpen}
        onClose={() => setIsAddMedicationOpen(false)}
        onAdded={() => setMedAddedTrigger((prev) => prev + 1)}
      />
    </div>
  );
};

export default PatientDashboardNew;
