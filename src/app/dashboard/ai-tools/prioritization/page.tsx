import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PrioritizationForm } from "./prioritization-form";
import { BotMessageSquare } from "lucide-react";

export default function AiTaskPrioritizationPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center gap-4">
        <BotMessageSquare className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-headline text-2xl font-bold">AI Task Prioritization</h1>
          <p className="text-muted-foreground">
            Let our AI assistant help you prioritize tasks efficiently.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>New Task</CardTitle>
            <CardDescription>
              Enter a detailed description of the task, and the AI will assign a priority and provide a reason.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PrioritizationForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
