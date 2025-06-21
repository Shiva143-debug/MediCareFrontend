
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Image, Camera, Clock, Info } from "lucide-react";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MedicationTrackerProps {
  medicationId: number;
  medicationName:string;
  date: string;
  isTaken: boolean;
  onMarkTaken: (medicationId: number,date: string, imageFile?: File) => void;
  isToday: boolean;
}

const MedicationTracker = ({
  medicationId,
  medicationName,
  date,
  isTaken,
  onMarkTaken,
  isToday,
}: MedicationTrackerProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dailyMedication = {
    name: `Daily Medication Set of ${medicationName}`,
    time: "8:00 AM",
    description: "Complete set of daily tablets",
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();

      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };

      reader.onerror = () => {
        alert("Failed to read image file. Please try another.");
        setSelectedImage(null);
        setImagePreview(null);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleMarkTaken = () => {
    onMarkTaken(medicationId, date, selectedImage || undefined); 

    setSelectedImage(null);
    setImagePreview(null);
  };

  if (isTaken) {
    return (
      <div className="space-y-4">
        <div
          className="flex items-center justify-center p-8 bg-green-50 rounded-xl border-2 border-green-200"
          role="status"
          aria-label="Medication marked as taken"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" aria-label="Checkmark icon" />
            </div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              Medication Completed!
            </h3>
            <p className="text-green-600">
              Great job! You’ve taken your medication for {format(new Date(date), "MMMM d, yyyy")}.
            </p>
          </div>
        </div>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-white" aria-label="Completed icon" />
              </div>
              <div>
                <h4 className="font-medium text-green-800">{dailyMedication.name}</h4>
                <p className="text-sm text-green-600">{dailyMedication.description}</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">
              <Clock className="w-3 h-3 mr-1" aria-label="Clock icon" />
              {dailyMedication.time}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Medication Card */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium">1</span>
            </div>
            <div>
              <h4 className="font-medium">{dailyMedication.name}</h4>
              <p className="text-sm text-muted-foreground">{dailyMedication.description}</p>
            </div>
          </div>
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" aria-label="Clock" />
            {dailyMedication.time}
          </Badge>
        </CardContent>
      </Card>

      {/* Image Upload Section */}
      <Card className="border-dashed border-2 border-border/50">
        <CardContent className="p-6">
          <div className="text-center">
            <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-label="Image upload icon" />
            <h3 className="font-medium mb-2">Add Proof Photo (Optional)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Take a photo of your medication or pill organizer as confirmation
            </p>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              ref={fileInputRef}
              className="hidden"
              aria-label="Upload proof image"
            />

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="mb-4"
            >
              <Camera className="w-4 h-4 mr-2" aria-hidden="true" />
              {selectedImage ? "Change Photo" : "Take Photo"}
            </Button>

            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Medication proof"
                  className="max-w-full h-32 object-cover rounded-lg mx-auto border-2 border-border"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Photo selected: {selectedImage?.name}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mark As Taken Button */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleMarkTaken}
          className="w-full py-4 text-lg bg-green-600 hover:bg-green-700 text-white"
          disabled={!isToday}
          aria-label="Mark medication as taken"
        >
          <Check className="w-5 h-5 mr-2" />
          {isToday ? "Mark as Taken" : "Cannot mark future dates"}
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Only today's medication can be marked as taken.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {!isToday && (
        <p className="text-center text-sm text-muted-foreground">
          You can only mark today's medication as taken
        </p>
      )}
    </div>
  );
};

export default MedicationTracker;
