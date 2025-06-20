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
import { useToast } from "@/hooks/use-toast";

const PatientDashboardNew = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();
  const {
    medicationLogs,
    isLoadingLogs,
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
  const isMedicationTakenToday = isMedicationTakenOnDate(todayStr);

  const takenDates = new Set(
    medicationLogs.map((log) =>
      new Date(log.taken_at).toISOString().split("T")[0]
    )
  );

  const adherenceRate = getAdherenceRate();
  const currentStreak = getCurrentStreak();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"},{" "}
              {user?.username}!
            </h2>
            <p className="text-white/90 text-lg">
              Ready to stay on track with your medication?
            </p>
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
        {/* Today's Medication */}
        <div className="lg:col-span-2">
          <Card className="h-fit">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
                {isTodaySelected
                  ? "Today's Medication"
                  : `Medication for ${format(selectedDate, "MMMM d, yyyy")}`}
              </CardTitle>
              <Button
                onClick={() => setIsAddMedicationOpen(true)}
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
                onAddMedication={() => setIsAddMedicationOpen(true)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
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
                      title: "You can't select a different day.",
                      description:
                        "You can only interact with today's medication.",
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
      />
    </div>
  );
};

export default PatientDashboardNew;

