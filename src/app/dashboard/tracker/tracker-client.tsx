
'use client';

import { useState, useMemo } from 'react';
import type { User, Team } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

type TrackingStatus = 'submitted' | 'not_submitted';
type TrackingResult = {
  user: User;
  status: TrackingStatus;
};

const TEAMS: Team[] = ['Technology', 'Corporate', 'Creatives'];

export default function TrackerClient({ allUsers }: { allUsers: User[] }) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Team | 'All'>('All');
  const { toast } = useToast();

  const handleTrackSubmissions = async () => {
    if (!sheetUrl.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please provide a Google Sheet CSV URL.',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setTrackingData(null);

    try {
      const response = await fetch(sheetUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch the CSV data. Please check the URL and sharing settings.');
      }
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const submittedEmails = new Set(
            results.data
              .map((row: any) => {
                const emailKey = Object.keys(row).find(key => key.toLowerCase().includes('email'));
                return emailKey ? (row[emailKey] as string)?.trim().toLowerCase() : null;
              })
              .filter(Boolean)
          );

          if (submittedEmails.size === 0) {
            throw new Error("No valid email addresses found in the sheet. Make sure there's an 'Email Address' column.");
          }

          const data = allUsers
            .filter(user => user.role !== 'Co-founder' && user.role !== 'Secretary') // Exclude Presidium from tracking
            .map(user => {
              const status: TrackingStatus = submittedEmails.has(user.email.toLowerCase()) ? 'submitted' : 'not_submitted';
              return { user, status };
            });
          
          setTrackingData(data);
          toast({
            title: 'Tracking Complete',
            description: `Found ${submittedEmails.size} submissions.`,
          });
        },
        error: (err: any) => {
          throw new Error(`CSV Parsing Error: ${err.message}`);
        }
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Tracking Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!trackingData) return { submitted: [], not_submitted: [] };

    const filtered = activeFilter === 'All'
      ? trackingData
      : trackingData.filter(item => item.user.team === activeFilter);
    
    return {
      submitted: filtered.filter(item => item.status === 'submitted'),
      not_submitted: filtered.filter(item => item.status === 'not_submitted'),
    };
  }, [trackingData, activeFilter]);


  const renderUserList = (users: TrackingResult[]) => (
     <ScrollArea className="h-96">
      <div className="space-y-4 pr-4">
        {users.map(({ user }) => (
          <div key={user.id} className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
              <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            {user.team && <p className="text-sm text-muted-foreground">{user.team}</p>}
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <label htmlFor="sheet-url" className="text-sm font-medium">
              Google Sheet Publish URL (CSV)
            </label>
            <div className="flex gap-2">
              <Input
                id="sheet-url"
                placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                disabled={isLoading}
              />
              <Button onClick={handleTrackSubmissions} disabled={isLoading}>
                {isLoading ? 'Tracking...' : 'Track Submissions'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              In Google Sheets, go to File &gt; Share &gt; Publish to web. Publish as a CSV file and paste the link here.
            </p>
          </div>
          {error && (
             <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {trackingData && (
        <>
          <div className="flex items-center justify-center">
            <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as Team | 'All')}>
              <TabsList>
                <TabsTrigger value="All">All</TabsTrigger>
                {TEAMS.map(team => (
                  <TabsTrigger key={team} value={team}>{team}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
             <Card className="glass">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-6 w-6 text-green-500" />
                            <CardTitle>Submitted ({filteredData.submitted.length})</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredData.submitted.length > 0 ? (
                        renderUserList(filteredData.submitted)
                    ) : (
                        <div className="flex items-center justify-center h-40 text-muted-foreground">
                           <p>No submitted users in this filter.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card className="glass">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <XCircle className="h-6 w-6 text-destructive" />
                            <CardTitle>Not Submitted ({filteredData.not_submitted.length})</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredData.not_submitted.length > 0 ? (
                        renderUserList(filteredData.not_submitted)
                    ) : (
                        <div className="flex items-center justify-center h-40 text-muted-foreground">
                           <p>All users in this filter have submitted!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
