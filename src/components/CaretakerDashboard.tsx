
// import { useEffect, useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Progress } from "@/components/ui/progress";
// import { Calendar } from "@/components/ui/calendar";
// import { Users, Bell, Calendar as CalendarIcon, Mail, AlertTriangle, Check, Clock, Camera } from "lucide-react";
// import NotificationSettings from "./NotificationSettings";
// import { format, isToday, isBefore, startOfDay } from "date-fns";
// import { useQuery } from "@tanstack/react-query";
// import axios from "axios";
// import { useAuth } from "@/contexts/AuthContext";
// import AddPatientForm from "./AddPatientForm";


// const CaretakerDashboard = () => {
//   const [activeTab, setActiveTab] = useState("overview");
//   const [selectedDate, setSelectedDate] = useState<Date>(new Date());
//   const { token, user } = useAuth();
//   const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

//   // // Get patients
//   // const { data: patients = [] } = useQuery({
//   //   queryKey: ["caretakerPatients"],
//   //   queryFn: async () => {
//   //     const res = await axios.get("http://localhost:5000/api/caretaker/patients", {
//   //       headers: { Authorization: `Bearer ${token}` }
//   //     });
//   //     console.log("patients Data", res.data)
//   //     return res.data;
//   //   },
//   //   enabled: !!token
//   // });

//   // Get patients
//   const {
//     data: patients = [],
//     refetch, // ✅ this enables refresh after adding a patient
//   } = useQuery({
//     queryKey: ["caretakerPatients"],
//     queryFn: async () => {
//       const res = await axios.get("http://localhost:5000/api/caretaker/patients", {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       console.log("patients Data", res.data);
//       return res.data;
//     },
//     enabled: !!token
//   });

//   // Select first patient by default
//   useEffect(() => {
//     if (!selectedPatientId && patients.length > 0) {
//       setSelectedPatientId(patients[0].id);
//     }
//   }, [patients]);

//   // Get logs for selected patient
//   const { data: patientLogs = [] } = useQuery({
//     queryKey: ["patientLogs", selectedPatientId],
//     queryFn: async () => {
//       const res = await axios.get(`http://localhost:5000/api/caretaker/patients/${selectedPatientId}/logs`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       return res.data;
//     },
//     enabled: !!token && !!selectedPatientId,
//     refetchInterval: 60000 // real-time updates
//   });

//   const takenDates = new Set(
//     patientLogs.map((log: any) => new Date(log.taken_at).toISOString().split("T")[0])
//   );

//   const recentActivity = patientLogs.slice(0, 5).map((log: any) => ({
//     date: log.taken_at.split("T")[0],
//     taken: true,
//     time: format(new Date(log.taken_at), "h:mm a"),
//     hasPhoto: !!log.proof_image,
//     proof_image: log.proof_image,
//     name: log.name
//   }));

//   const adherenceRate = Math.round((takenDates.size / 30) * 100);
//   const currentStreak = (() => {
//     let streak = 0;
//     let date = new Date();
//     while (takenDates.has(format(date, "yyyy-MM-dd"))) {
//       streak++;
//       date.setDate(date.getDate() - 1);
//     }
//     return streak;
//   })();

//   const missedDoses = 30 - takenDates.size;
//   const patientName = patients.find(p => p.id === selectedPatientId)?.username || "Patient";

//   return (
//     <div className="space-y-6">
//       {/* Header Section */}
//       <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-8 text-white">
//         <div className="flex items-center gap-4 mb-6">
//           <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
//             <Users className="w-8 h-8" />
//           </div>
//           <div>
//             <h2 className="text-3xl font-bold">Caretaker Dashboard</h2>
//             <p className="text-white/90 text-lg">Monitoring {patientName}'s medication adherence</p>
//           </div>
//         </div>
//       </div>

//       {/* Patient Selector */}
//       {patients.length > 1 && (
//         <div className="space-x-2">
//           {patients.map((p: any) => (
//             <Button
//               key={p.id}
//               onClick={() => setSelectedPatientId(p.id)}
//               variant={p.id === selectedPatientId ? "default" : "outline"}
//             >
//               {p.username}
//             </Button>
//           ))}
//         </div>
//       )}
//       <h3 className="text-lg font-semibold">Link a Patient</h3>
//       <AddPatientForm onPatientAdded={refetch} />

//       <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
//         <TabsList className="grid w-full grid-cols-4">
//           <TabsTrigger value="overview">Overview</TabsTrigger>
//           <TabsTrigger value="activity">Recent Activity</TabsTrigger>
//           <TabsTrigger value="calendar">Calendar View</TabsTrigger>
//           <TabsTrigger value="notifications">Notifications</TabsTrigger>
//         </TabsList>

//         <TabsContent value="overview" className="space-y-6">
//           <div className="grid lg:grid-cols-2 gap-6">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Today's Status</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex justify-between">
//                   <span>{format(new Date(), "PPPP")}</span>

//                   <Badge
//                     variant="outline"
//                     className={
//                       takenDates.has(format(new Date(), "yyyy-MM-dd"))
//                         ? "bg-green-500 text-white"
//                         : "bg-red-500 text-white"
//                     }
//                   >
//                     {takenDates.has(format(new Date(), "yyyy-MM-dd")) ? "Completed" : "Pending"}
//                   </Badge>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle>Quick Actions</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 <Button className="w-full justify-start" variant="outline">
//                   <Mail className="w-4 h-4 mr-2" />
//                   Send Reminder Email
//                 </Button>
//                 <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab("notifications")}>
//                   <Bell className="w-4 h-4 mr-2" />
//                   Configure Notifications
//                 </Button>
//               </CardContent>
//             </Card>
//           </div>

//           <Card>
//             <CardHeader>
//               <CardTitle>Adherence Progress</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <Progress value={adherenceRate} />
//               <div className="flex justify-between mt-2 text-sm">
//                 <span>{adherenceRate}% Adherence</span>
//                 <span>{currentStreak} day streak</span>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="activity">
//           <Card>
//             <CardHeader>
//               <CardTitle>Recent Logs</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-3">
//               {recentActivity.map((a, i) => (
//                 <div key={i} className="flex justify-between items-center border p-2 rounded">
//                   <div>
//                     <div className="font-semibold">{format(new Date(a.date), "PPP")}</div>
//                     <div className="text-sm text-muted-foreground">{a.name} at {a.time}</div>
//                   </div>
//                   <div className="flex gap-2 items-center">
//                     {a.hasPhoto && <Camera className="w-4 h-4" />}
//                     <Badge variant="secondary">Taken</Badge>
//                   </div>
//                 </div>
//               ))}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="calendar">
//           <Card>
//             <CardHeader>
//               <CardTitle>Calendar Overview</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <Calendar
//                 mode="single"
//                 selected={selectedDate}
//                 onSelect={(date) => date && setSelectedDate(date)}
//                 className="w-full"
//                 components={{
//                   DayContent: ({ date }) => {
//                     const dateStr = format(date, 'yyyy-MM-dd');
//                     const isTaken = takenDates.has(dateStr);
//                     const isPast = isBefore(date, startOfDay(new Date()));
//                     const isCurrentDay = isToday(date);

//                     return (
//                       <div className="relative w-full h-full flex items-center justify-center">
//                         <span>{date.getDate()}</span>
//                         {isTaken && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />}
//                         {!isTaken && isPast && !isCurrentDay && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full" />}
//                       </div>
//                     );
//                   }
//                 }}
//               />
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="notifications">
//           <NotificationSettings />
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// };

// export default CaretakerDashboard;


import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Users, Bell, Calendar as CalendarIcon, Mail, Camera } from "lucide-react";
import NotificationSettings from "./NotificationSettings";
import { format, isToday, isBefore, startOfDay, subDays } from "date-fns";
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
      const res = await axios.get("http://localhost:5000/api/caretaker/patients", {
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
        `http://localhost:5000/api/caretaker/patients/${selectedPatientId}/logs`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    enabled: !!token && !!selectedPatientId,
    refetchInterval: 60000,
  });

  const takenDates = new Set(
    patientLogs.map((log: any) => new Date(log.taken_at).toISOString().split("T")[0])
  );

  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const daysInMonth = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(monthStart);
    d.setDate(d.getDate() + i);
    return format(d, "yyyy-MM-dd");
  });

  const adherenceRate = Math.round((takenDates.size / daysInMonth.length) * 100);

  const currentStreak = (() => {
    let streak = 0;
    let date = new Date();
    while (takenDates.has(format(date, "yyyy-MM-dd"))) {
      streak++;
      date.setDate(date.getDate() - 1);
    }
    return streak;
  })();

  const missedDoses = daysInMonth.filter((d) => !takenDates.has(d)).length;

  const takenThisWeek = patientLogs.filter((log: any) => {
    const date = new Date(log.taken_at);
    return date >= subDays(new Date(), 7);
  }).length;

  const patientName = patients.find(p => p.id === selectedPatientId)?.username || "Patient";

  return (
    <div className="space-y-6">
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
              <div className="text-2xl font-bold">{missedDoses}</div>
              <div className="text-white/80">Missed This Month</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{takenThisWeek}</div>
              <div className="text-white/80">Taken This Week</div>
            </div>
          </div>
        )}
      </div>

      {patients.length > 1 && (
        <div className="space-x-2">
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
      )}

      <h3 className="text-lg font-semibold">Link a Patient</h3>
      <AddPatientForm onPatientAdded={refetch} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Today's Status</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between p-4">
              <span>{format(new Date(), "PPPP")}</span>
              <Badge className={
                takenDates.has(today) ? "bg-green-500 text-white" : "bg-red-500 text-white"
              }>
                {takenDates.has(today) ? "Completed" : "Pending"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adherence Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={adherenceRate} />
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-green-600">{takenDates.size} days Taken</span>
                <span className="text-red-600">{missedDoses} days Missed</span>
                <span className="text-blue-600">{30 - takenDates.size - missedDoses} days Remaining</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {patientLogs.slice(0, 5).map((log: any, i: number) => (
                <div key={i} className="flex justify-between items-center border p-2 rounded">
                  <div>
                    <div className="font-semibold">{format(new Date(log.taken_at), "PPP")}</div>
                    <div className="text-sm text-muted-foreground">{log.name} at {format(new Date(log.taken_at), "h:mm a")}</div>
                  </div>
                  <div className="flex gap-2 items-center">
                    {log.proof_image && <Camera className="w-4 h-4" />}
                    <Badge variant="secondary">Taken</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendar Overview</CardTitle>
            </CardHeader>
            <CardContent>
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
