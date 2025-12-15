import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Star, Trophy } from "lucide-react";
import goldTrophy from "@/assets/gold-trophy.png";

interface DailyLimitCardProps {
  wordsPracticed: number;
}

export function DailyLimitCard({ wordsPracticed }: DailyLimitCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="max-w-2xl mx-auto text-center">
      <CardHeader>
        <div className="flex justify-center mb-4">
          <img src={goldTrophy} alt="Champion Trophy" className="w-32 h-32 object-contain" />
        </div>
        <CardTitle className="text-3xl">You're a Vocabulary Champion!</CardTitle>
        <CardDescription className="text-lg mt-2">
          You've practiced {wordsPracticed} words today!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-primary/10 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-5 h-5 text-primary fill-primary" />
            <span className="font-medium text-primary">Daily Goal Reached!</span>
            <Star className="w-5 h-5 text-primary fill-primary" />
          </div>
          <p className="text-muted-foreground text-sm">
            Taking breaks helps your brain remember new words. Come back tomorrow for more practice!
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate('/review')} size="lg">
            Review Your Words
          </Button>
          <Button onClick={() => navigate('/progress')} variant="outline">
            Check Progress
          </Button>
          <Button onClick={() => navigate('/dashboard')} variant="ghost">
            Back to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
