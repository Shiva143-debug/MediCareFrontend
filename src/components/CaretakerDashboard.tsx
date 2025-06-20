import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Users, Bell, Mail, Camera, CalendarIcon } from "lucide-react";
import NotificationSettings from "./NotificationSettings";
import { format, isToday, startOfDay, subDays, isBefore, isSameDay, eachDayOfInterval, endOfMonth } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import AddPatientForm from "./AddPatientForm";

const CaretakerDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { token } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const {
    data: patients = [],
    refetch,
  } = useQuery({
    queryKey: ["caretakerPatients"],
    queryFn: async () => {
      const res = await axios.get("https://gossamer-lilac-fog.glitch.me/api/caretaker/patients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (!selectedPatientId && patients.length > 0) {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients]);

  const { data: patientLogs = [] } = useQuery({
    queryKey: ["patientLogs", selectedPatientId],
    queryFn: async () => {
      const res = await axios.get(
        `https://gossamer-lilac-fog.glitch.me/api/caretaker/patients/${selectedPatientId}/logs`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    enabled: !!token && !!selectedPatientId,
    refetchInterval: 60000,
  });


  console.log("patientLogs,", patientLogs);
  // Format logs
  const takenDates = new Set(
    patientLogs.map((log: any) => format(new Date(log.taken_at), "yyyy-MM-dd"))
  );

  // Month-based metrics
  const today = new Date();
  const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfCurrentMonth = endOfMonth(today);
  const allDaysThisMonth = eachDayOfInterval({
    start: startOfCurrentMonth,
    end: endOfCurrentMonth
  });

  let takenCount = 0;
  let missedCount = 0;
  let remainingCount = 0;

  allDaysThisMonth.forEach((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (isBefore(date, today) || isSameDay(date, today)) {
      if (takenDates.has(dateStr)) {
        takenCount++;
      } else {
        missedCount++;
      }
    } else {
      remainingCount++;
    }
  });

  const adherenceRate = Math.round((takenCount / allDaysThisMonth.length) * 100);

  const currentStreak = (() => {
    let streak = 0;
    let date = new Date();
    while (takenDates.has(format(date, "yyyy-MM-dd"))) {
      streak++;
      date.setDate(date.getDate() - 1);
    }
    return streak;
  })();

  const takenThisWeek = patientLogs.filter((log: any) => {
    const date = new Date(log.taken_at);
    return date >= subDays(today, 7);
  }).length;

  const patientName = patients.find(p => p.id === selectedPatientId)?.username || "Patient";

  const handleSendReminderEmail = () => {
    console.log("Sending reminder email to patient...");
    // Here you would implement email sending functionality
    alert("Reminder email sent to " + patientName);
  };

  const handleConfigureNotifications = () => {
    setActiveTab("notifications");
  };

  const handleViewCalendar = () => {
    setActiveTab("calendar");
  };

  const recentDays = Array.from({ length: 7 }, (_, i) =>
    subDays(new Date(), i)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Caretaker Dashboard</h2>
            <p className="text-white/90 text-lg">Monitoring {patientName}'s medication adherence</p>
          </div>
        </div>
        {selectedPatientId && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{adherenceRate}%</div>
              <div className="text-white/80">Adherence Rate</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{currentStreak}</div>
              <div className="text-white/80">Current Streak</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{missedCount}</div>
              <div className="text-white/80">Missed This Month</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{takenThisWeek}</div>
              <div className="text-white/80">Taken This Week</div>
            </div>
          </div>
        )}
      </div>

      {/* Patient Switcher */}
<div className="flex flex-wrap justify-between items-center gap-4">
  {/* Patient Buttons */}
  <div className="flex flex-wrap gap-2">
    {patients.map((p: any) => (
      <Button
        key={p.id}
        onClick={() => setSelectedPatientId(p.id)}
        variant={p.id === selectedPatientId ? "default" : "outline"}
      >
        {p.username}
      </Button>
    ))}
  </div>

  {/* Link a Patient Form */}
    {/* <h3 className="text-lg font-semibold hidden md:block self-center">Link a Patient</h3> */}
  <div className="flex flex-col md:flex-row gap-2">
    <AddPatientForm onPatientAdded={refetch} />
  </div>
</div>

<hr/>


      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Today's Status</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between p-4">
                <span>{format(today, "PPPP")}</span>
                <Badge className={takenDates.has(format(today, "yyyy-MM-dd")) ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                  {takenDates.has(format(today, "yyyy-MM-dd")) ? "Completed" : "Pending"}
                </Badge>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={handleSendReminderEmail}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Reminder Email
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={handleConfigureNotifications}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Configure Notifications
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={handleViewCalendar}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  View Full Calendar
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Adherence Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={adherenceRate} />
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-green-600">{takenCount} days Taken</span>
                <span className="text-red-600">{missedCount} days Missed</span>
                <span className="text-blue-600">{remainingCount} days Remaining</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Medication Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentDays.map((day) => {
                const logsForDay = patientLogs.filter((log: any) =>
                  format(new Date(log.taken_at), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
                );

                const formattedDate = format(day, "EEEE, MMMM d");
                const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

                return logsForDay.length > 0 ? (
                  logsForDay.map((log: any, i: number) => (
                    <div key={`${log.taken_at}-${i}`} className="flex justify-between items-center border p-2 rounded">
                      <div>
                        <div className="font-semibold">{formattedDate}</div>
                        <div className="text-sm text-muted-foreground">
                          {log.name} at {format(new Date(log.taken_at), "h:mm a")}
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        {log.proof_image && <Camera className="w-4 h-4" />}
                        <Badge className="bg-green-500 text-white">Completed</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div key={formattedDate} className="flex justify-between items-center border p-2 rounded">
                    <div>
                      <div className="font-semibold">{formattedDate}</div>
                      <div className="text-sm text-muted-foreground">Medication missed</div>
                    </div>
                    <Badge className="bg-red-500 text-white">Missed</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Medication Calendar Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Calendar Section */}
                <div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="w-full"
                    components={{
                      DayContent: ({ date }) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const isTaken = takenDates.has(dateStr);
                        const isPast = isBefore(date, startOfDay(new Date()));
                        const isCurrentDay = isToday(date);

                        return (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <span>{date.getDate()}</span>
                            {isTaken && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />}
                            {!isTaken && isPast && !isCurrentDay && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full" />}
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
                </div>

                {/* Details Section */}
                <div>
                  <div className="text-lg font-semibold mb-3">
                    Details for {format(selectedDate, "MMMM d, yyyy")}
                  </div>

                  {patientLogs
                    .filter(
                      (log: any) =>
                        format(new Date(log.taken_at), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                    )
                    .map((log: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-green-50 text-green-800 border border-green-300 p-4 rounded-lg mb-3">
                        <div>
                          <div className="font-bold">{log.name}</div>
                          <div className="text-sm">{log.dosage} - {log.frequency}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {log.time}
                          </div>
                        </div>
                      </div>
                    ))}

                  {patientLogs.filter(
                    (log: any) =>
                      format(new Date(log.taken_at), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                  ).length === 0 && (
                      <div className="text-muted-foreground text-sm border border-dashed p-4 rounded bg-blue-50 text-blue-700">
                        <div className="font-semibold mb-1">No medication taken</div>
                        <p>Monitor {patientName}'s medication status for this day.</p>
                      </div>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CaretakerDashboard;
