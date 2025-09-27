// This is a server-side file.
'use server';

/**
 * @fileOverview An AI-powered task prioritization tool for administrators.
 *
 * - prioritizeTask - A function that prioritizes tasks based on a description.
 * - PrioritizeTaskInput - The input type for the prioritizeTask function.
 * - PrioritizeTaskOutput - The return type for the prioritizeTask function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrioritizeTaskInputSchema = z.object({
  taskDescription: z
    .string()
    .describe('A detailed description of the task to be prioritized.'),
});
export type PrioritizeTaskInput = z.infer<typeof PrioritizeTaskInputSchema>;

const PrioritizeTaskOutputSchema = z.object({
  priority: z
    .string()
    .describe(
      'The priority of the task, choosing from High, Medium, or Low.'
    ),
  reason: z
    .string()
    .describe('The detailed reason for the assigned priority.'),
});
export type PrioritizeTaskOutput = z.infer<typeof PrioritizeTaskOutputSchema>;

export async function prioritizeTask(input: PrioritizeTaskInput): Promise<PrioritizeTaskOutput> {
  return prioritizeTaskFlow(input);
}

const prioritizeTaskPrompt = ai.definePrompt({
  name: 'prioritizeTaskPrompt',
  input: {schema: PrioritizeTaskInputSchema},
  output: {schema: PrioritizeTaskOutputSchema},
  prompt: `You are an AI assistant helping administrators prioritize tasks.

  Based on the task description provided, determine the priority of the task and provide a detailed reason for your decision.

  Task Description: {{{taskDescription}}}

  Consider these guidelines when assigning the priority:
  - High: Task is critical, urgent, and has a significant impact on the organization's goals.
  - Medium: Task is important but not urgent, and has a moderate impact on the organization's goals.
  - Low: Task is less important and can be done later, with a minimal impact on the organization's goals.

  Provide the priority as a single word (High, Medium, or Low) and then the reasoning.
  `,
});

const prioritizeTaskFlow = ai.defineFlow(
  {
    name: 'prioritizeTaskFlow',
    inputSchema: PrioritizeTaskInputSchema,
    outputSchema: PrioritizeTaskOutputSchema,
  },
  async input => {
    const {output} = await prioritizeTaskPrompt(input);
    return output!;
  }
);
