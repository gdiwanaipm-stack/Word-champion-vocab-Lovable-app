import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProgressionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  newDifficulty: string;
}

export function ProgressionDialog({ isOpen, onClose, newDifficulty }: ProgressionDialogProps) {
  const navigate = useNavigate();

  const handleGenerateWords = () => {
    onClose();
    navigate('/ai-vocabulary');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Level Up! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Congratulations! Your accuracy and dedication have earned you a progression to{' '}
            <span className="font-bold text-primary capitalize">
              {newDifficulty.replace('-', ' ')}
            </span>{' '}
            difficulty!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-4">
          <Button 
            onClick={handleGenerateWords} 
            className="w-full" 
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate New Words
          </Button>
          <Button 
            onClick={onClose} 
            variant="outline" 
            className="w-full"
            size="lg"
          >
            Continue Practicing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
