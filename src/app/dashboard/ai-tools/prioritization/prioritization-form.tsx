'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { prioritizeTask, PrioritizeTaskOutput } from '@/ai/flows/ai-task-prioritization';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, LoaderCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

export function PrioritizationForm() {
  const [result, setResult] = useState<PrioritizeTaskOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setResult(null);
    setError(null);
    
    const taskDescription = formData.get('taskDescription') as string;
    if (!taskDescription) {
      setError("Task description cannot be empty.");
      setLoading(false);
      return;
    }
    
    const response = await prioritizeTask({ taskDescription });
    
    if (response && response.priority) {
      setResult(response);
    } else {
      setError("Failed to get a priority from the AI. Please try again.");
    }
    setLoading(false);
  }

  const priorityBadgeVariant = {
    'High': 'destructive',
    'Medium': 'secondary',
    'Low': 'outline',
  } as const;

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <form action={handleSubmit} className="space-y-4">
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
        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
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
            {loading ? (
              <div className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-32" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Priority</h3>
                  <Badge variant={priorityBadgeVariant[result.priority as keyof typeof priorityBadgeVariant]} className="text-lg">
                    {result.priority}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Reason</h3>
                  <p className="text-foreground">{result.reason}</p>
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
