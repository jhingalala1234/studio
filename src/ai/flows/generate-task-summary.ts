'use server';

/**
 * @fileOverview An AI agent for summarizing task logs.
 *
 * - generateTaskSummary - A function that generates a summary of task logs.
 * - GenerateTaskSummaryInput - The input type for the generateTaskSummary function.
 * - GenerateTaskSummaryOutput - The return type for the generateTaskSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTaskSummaryInputSchema = z.object({
  taskLogs: z
    .string()
    .describe('A comprehensive log of tasks, updates, and assignments, in JSON format. Each task has a title, description, status, priority, urgency, due date, and assignee.'),
  role: z
    .string()
    .describe(
      'The role of the user requesting the summary (e.g., Co-founder, Chair of Directors, Lead). This is used to tailor the summary appropriately.'
    ),
  areaOfResponsibility: z
    .string()
    .describe(
      'The specific area or department for which the task logs are relevant (e.g., Tech Domain, Corp, Creatives, or Presidium for organization-wide).'
    ),
});
export type GenerateTaskSummaryInput = z.infer<typeof GenerateTaskSummaryInputSchema>;

const GenerateTaskSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A concise summary of the task logs, highlighting progress, potential issues, urgent items, and key updates relevant to the user role and area of responsibility.'
    ),
});
export type GenerateTaskSummaryOutput = z.infer<typeof GenerateTaskSummaryOutputSchema>;

export async function generateTaskSummary(
  input: GenerateTaskSummaryInput
): Promise<GenerateTaskSummaryOutput> {
  return generateTaskSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTaskSummaryPrompt',
  input: {schema: GenerateTaskSummaryInputSchema},
  output: {schema: GenerateTaskSummaryOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing task logs for different roles within CloudX. 

You will be provided with task logs, the user's role, and their area of responsibility. Your goal is to generate a concise and informative summary that highlights progress, potential issues, and key updates relevant to the user. Pay special attention to tasks marked as 'urgent' and upcoming deadlines.

Task Logs (JSON format):
{{taskLogs}}

User Role: {{role}}
Area of Responsibility: {{areaOfResponsibility}}

Generate a summary based on the provided data.
Summary:`,
});

const generateTaskSummaryFlow = ai.defineFlow(
  {
    name: 'generateTaskSummaryFlow',
    inputSchema: GenerateTaskSummaryInputSchema,
    outputSchema: GenerateTaskSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
