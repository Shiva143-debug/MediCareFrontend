import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Mail, Bell } from "lucide-react";

interface NotificationSettingsProps {
  patientName: string;
  adherenceRate: number;
  currentStreak: number;
  isTodayTaken: boolean;
}

const NotificationSettings = ({ patientName ,adherenceRate,currentStreak,isTodayTaken}: NotificationSettingsProps) => {
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    emailAddress: "caretaker@example.com",
    reminderTime: "20:00",
    // 8 PM
    pushNotifications: true,
    criticalAlerts: true,
    missedMedNotification: true,
    missedMedDelay: "2" // hours
  });
  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const handleSaveSettings = () => {
    console.log("Notification settings saved:", settings);
    // Here you would typically save to backend
  };
  return <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive medication alerts via email
                </p>
              </div>
              <Switch checked={settings.emailNotifications} onCheckedChange={checked => handleSettingChange("emailNotifications", checked)} />
            </div>

            {settings.emailNotifications && <div className="ml-6 space-y-3">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={settings.emailAddress} onChange={e => handleSettingChange("emailAddress", e.target.value)} className="mt-1" />
                </div>
              </div>}
          </div>

          <Separator />

          {/* Missed Medication Alerts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Missed Medication Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when medication is not taken on time
                </p>
              </div>
              <Switch checked={settings.missedMedNotification} onCheckedChange={checked => handleSettingChange("missedMedNotification", checked)} />
            </div>

            {settings.missedMedNotification && <div className="ml-6 space-y-3">
                <div>
                  <Label>Alert me if medication isn't taken within</Label>
                  <Select value={settings.missedMedDelay} onValueChange={value => handleSettingChange("missedMedDelay", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="3">3 hours</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="6">6 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Daily reminder time</Label>
                  <Input type="time" value={settings.reminderTime} onChange={e => handleSettingChange("reminderTime", e.target.value)} className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Time to check if today's medication was taken
                  </p>
                </div>
              </div>}
          </div>

          

          {/* Critical Alerts */}
          <div className="space-y-4">
            
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-green-600" />
            Email Preview
          </CardTitle>
        </CardHeader>
<CardContent>
  <div className="bg-gray-50 p-4 rounded-lg border">
    <div className="text-sm">
      <div className="font-medium mb-2">
        Subject: Medication Alert - {patientName}
      </div>
      <div className="text-muted-foreground">
        <p className="mb-2">Hello,</p>
        {isTodayTaken ? (
          <>
            <p className="mb-2">
              This is to inform you that <strong>{patientName}</strong> has successfully taken their medication today.
            </p>
            <p className="mb-2">
              Great job! Keep supporting them on their journey to better health.
            </p>
          </>
        ) : (
          <>
            <p className="mb-2">
              This is a reminder that <strong>{patientName}</strong> has not taken their daily medication today.
            </p>
            <p className="mb-2">
              Please check with <strong>{patientName}</strong> to ensure they take their prescribed medication.
            </p>
          </>
        )}
        <p>
          Current adherence rate: {adherenceRate}% ({currentStreak}-day streak)
        </p>
      </div>
    </div>
  </div>
</CardContent>

      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} className="bg-green-600 hover:bg-green-700">
          Save Notification Settings
        </Button>
      </div>
    </div>;
};
export default NotificationSettings;