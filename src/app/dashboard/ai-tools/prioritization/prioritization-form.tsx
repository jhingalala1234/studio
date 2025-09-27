'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { prioritizeTask, PrioritizeTaskOutput } from '@/ai/flows/ai-task-prioritization';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, LoaderCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
      {pending ? (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Prioritizing...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Prioritize Task
        </>
      )}
    </Button>
  );
}

type State = {
  result: PrioritizeTaskOutput | null;
  error: string | null;
}

async function handlePrioritize(prevState: State, formData: FormData): Promise<State> {
    const taskDescription = formData.get('taskDescription') as string;
    if (!taskDescription) {
      return { ...prevState, error: "Task description cannot be empty." };
    }
    
    try {
        const response = await prioritizeTask({ taskDescription });
        
        if (response && response.priority) {
          return { result: response, error: null };
        } else {
          return { ...prevState, error: "Failed to get a priority from the AI. Please try again."};
        }
    } catch (e) {
        return { ...prevState, error: "An unexpected error occurred. Please try again."};
    }
}


export function PrioritizationForm() {
  const initialState: State = { result: null, error: null };
  const [state, formAction] = useActionState(handlePrioritize, initialState);

  const priorityBadgeVariant = {
    'High': 'destructive',
    'Medium': 'secondary',
    'Low': 'outline',
  } as const;

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="taskDescription" className="text-base">Task Description</Label>
          <Textarea
            id="taskDescription"
            name="taskDescription"
            placeholder="e.g., Implement a new feature for user profile customization, including avatar uploads and bio editing..."
            rows={8}
            required
          />
        </div>
        {state.error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
            </Alert>
        )}
        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </form>
      
      <div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>AI Prioritization Result</CardTitle>
          </CardHeader>
          <CardContent>
            {state.result ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Priority</h3>
                  <Badge variant={priorityBadgeVariant[state.result.priority as keyof typeof priorityBadgeVariant]} className="text-lg">
                    {state.result.priority}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Reason</h3>
                  <p className="text-foreground">{state.result.reason}</p>
                </div>
              </div>
            ) : (
                <div className="flex h-full min-h-[150px] items-center justify-center text-center">
                    <p className="text-muted-foreground">The AI-generated priority will appear here.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
