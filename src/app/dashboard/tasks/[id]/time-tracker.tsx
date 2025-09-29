"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { startTimer, stopTimer } from "../actions";
import type { TimeLog } from "@/types";
import {
  Clock,
  PlayCircle,
  PauseCircle,
  List,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, formatDistance } from "date-fns";

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.round(seconds % 60);

  let result = "";
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (remainingSeconds > 0 || result === "") result += `${remainingSeconds}s`;

  return result.trim();
}

export default function TimeTracker({
  taskId,
  initialTimeLogs,
}: {
  taskId: string;
  initialTimeLogs: TimeLog[];
}) {
  const [timeLogs, setTimeLogs] = useState(initialTimeLogs);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [elapsedTime, setElapsedTime] = useState(0);

  const activeLog = useMemo(
    () => timeLogs.find(log => !log.endTime),
    [timeLogs]
  );
  const totalTime = useMemo(
    () =>
      timeLogs.reduce((acc, log) => {
        if (log.endTime) {
          const start = new Date(log.startTime);
          const end = new Date(log.endTime);
          return acc + (end.getTime() - start.getTime()) / 1000;
        }
        return acc;
      }, 0) + elapsedTime,
    [timeLogs, elapsedTime]
  );

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeLog) {
      interval = setInterval(() => {
        setElapsedTime(
          (new Date().getTime() - new Date(activeLog.startTime).getTime()) /
            1000
        );
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeLog]);

  const handleStart = () => {
    startTransition(async () => {
      try {
        const newLog = await startTimer(taskId);
        if (newLog) {
          setTimeLogs(prev => [...prev, newLog]);
          setElapsedTime(0);
        } else {
          throw new Error("Failed to start timer.");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to start timer.",
        });
      }
    });
  };

  const handleStop = () => {
    if (!activeLog) return;
    startTransition(async () => {
      try {
        const updatedLog = await stopTimer(activeLog.id);
        if (updatedLog) {
          setTimeLogs(prev =>
            prev.map(log => (log.id === updatedLog.id ? updatedLog : log))
          );
          setElapsedTime(0);
        } else {
          throw new Error("Failed to stop timer.");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to stop timer.",
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="font-mono text-lg font-semibold">
            {formatDuration(totalTime)}
          </span>
        </div>
        {!activeLog ? (
          <Button size="sm" onClick={handleStart} disabled={isPending}>
            <PlayCircle className="mr-2 h-4 w-4" /> Start
          </Button>
        ) : (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleStop}
            disabled={isPending}
          >
            <PauseCircle className="mr-2 h-4 w-4" /> Stop
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          <List className="h-4 w-4" /> Logged Sessions
        </h4>
        <div className="max-h-48 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Start</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeLogs
                .filter(log => log.endTime)
                .sort(
                  (a, b) =>
                    new Date(b.startTime).getTime() -
                    new Date(a.startTime).getTime()
                )
                .map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">
                      {format(new Date(log.startTime), "PPp")}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {formatDuration(
                        (new Date(log.endTime!).getTime() -
                          new Date(log.startTime).getTime()) /
                          1000
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          {timeLogs.filter(log => log.endTime).length === 0 && (
            <p className="p-4 text-center text-xs text-muted-foreground">No completed sessions.</p>
          )}
        </div>
      </div>
    </div>
  );
}
