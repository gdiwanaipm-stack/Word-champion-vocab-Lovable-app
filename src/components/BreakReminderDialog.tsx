import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Coffee } from "lucide-react";

interface BreakReminderDialogProps {
  isOpen: boolean;
  onDismiss: () => void;
  wordsPracticed: number;
}

export function BreakReminderDialog({ isOpen, onDismiss, wordsPracticed }: BreakReminderDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onDismiss}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Coffee className="w-8 h-8 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-center">Time for a Quick Break!</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Great job! You've practiced {wordsPracticed} words. Taking short breaks helps your brain 
            remember new words better. Stretch, drink some water, and come back refreshed!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction onClick={onDismiss}>
            Continue Learning
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
