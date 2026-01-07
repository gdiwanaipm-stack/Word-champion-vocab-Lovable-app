import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SessionFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SessionFeedbackDialog({ open, onClose }: SessionFeedbackDialogProps) {
  const [likes, setLikes] = useState("");
  const [improvements, setImprovements] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!likes.trim() && !improvements.trim()) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("session_feedback").insert({
        likes: likes.trim() || null,
        improvements: improvements.trim() || null,
      });

      if (error) throw error;
      
      toast.success("Thanks for your feedback!");
      setLikes("");
      setImprovements("");
      onClose();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setLikes("");
    setImprovements("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleSkip()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How was your practice session?</DialogTitle>
          <DialogDescription>
            Your feedback helps us improve! This is optional.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="likes">What did you like? 😊</Label>
            <Textarea
              id="likes"
              placeholder="I liked..."
              value={likes}
              onChange={(e) => setLikes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="improvements">What could be improved? 💡</Label>
            <Textarea
              id="improvements"
              placeholder="I wish..."
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleSkip} disabled={isSubmitting}>
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
