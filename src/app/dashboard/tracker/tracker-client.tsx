
'use client';

import { useState, useMemo } from 'react';
import type { User, Team } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle, Users, FileDiff, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type TrackingStatus = 'submitted' | 'not_submitted';
type TrackingResult = {
  user: User;
  status: TrackingStatus;
};

const TEAMS: Team[] = ['Technology', 'Corporate', 'Creatives'];


function SubmissionTracker({ allUsers }: { allUsers: User[] }) {
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
          const sheetData = results.data as any[];

          if (sheetData.length === 0) {
            throw new Error("CSV is empty or could not be parsed correctly.");
          }

          const headerMap: { [key: string]: string } = {};
          const headers = Object.keys(sheetData[0]);
          const possibleEmailHeaders = ['email', 'email address'];
          const possibleNameHeaders = ['name', 'full name'];
          const possiblePhoneHeaders = ['phone', 'phone number'];
          const possibleRegNoHeaders = ['regno', 'reg no', 'registration no', 'registration number'];

          headerMap.email = headers.find(h => possibleEmailHeaders.includes(h.toLowerCase())) || '';
          headerMap.name = headers.find(h => possibleNameHeaders.includes(h.toLowerCase())) || '';
          headerMap.phone = headers.find(h => possiblePhoneHeaders.includes(h.toLowerCase())) || '';
          headerMap.regNo = headers.find(h => possibleRegNoHeaders.includes(h.toLowerCase())) || '';

          const submittedIdentifiers = new Set<string>();

          sheetData.forEach(row => {
            if (headerMap.email && row[headerMap.email]) submittedIdentifiers.add(String(row[headerMap.email]).trim().toLowerCase());
            if (headerMap.name && row[headerMap.name]) submittedIdentifiers.add(String(row[headerMap.name]).trim().toLowerCase());
            if (headerMap.phone && row[headerMap.phone]) submittedIdentifiers.add(String(row[headerMap.phone]).trim().replace(/\s/g, ''));
            if (headerMap.regNo && row[headerMap.regNo]) submittedIdentifiers.add(String(row[headerMap.regNo]).trim().toLowerCase());
          });
          
          if (submittedIdentifiers.size === 0) {
            throw new Error("No identifying data (Email, Name, Phone, RegNo) found in the sheet. Please check your column headers.");
          }

          const data = allUsers
            .filter(user => user.team !== 'Presidium')
            .map(user => {
              const isSubmitted = 
                submittedIdentifiers.has(user.email.toLowerCase()) ||
                submittedIdentifiers.has(user.name.toLowerCase()) ||
                (user.phone && submittedIdentifiers.has(user.phone.replace(/\s/g, ''))) ||
                (user.regNo && submittedIdentifiers.has(user.regNo.toLowerCase()));

              const status: TrackingStatus = isSubmitted ? 'submitted' : 'not_submitted';
              return { user, status };
            });
          
          setTrackingData(data);
          toast({
            title: 'Tracking Complete',
            description: `Found ${submittedIdentifiers.size} unique entries in the sheet.`,
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
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="sheet-url"
                placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                disabled={isLoading}
              />
              <Button onClick={handleTrackSubmissions} disabled={isLoading} className="w-full sm:w-auto">
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
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
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

type SheetInfo = { name: string; gid: string };
type Stage = 'URLS' | 'SHEETS' | 'COLUMNS' | 'RESULTS';

function SheetComparator() {
  const [stage, setStage] = useState<Stage>('URLS');

  // Stage 1: URLs
  const [sheetAUrl, setSheetAUrl] = useState('');
  const [sheetBUrl, setSheetBUrl] = useState('');

  // Stage 2: Sheets
  const [sheetAList, setSheetAList] = useState<SheetInfo[]>([]);
  const [sheetBList, setSheetBList] = useState<SheetInfo[]>([]);
  const [selectedGidA, setSelectedGidA] = useState('');
  const [selectedGidB, setSelectedGidB] = useState('');

  // Stage 3: Columns
  const [sheetAColumns, setSheetAColumns] = useState<string[]>([]);
  const [sheetBColumns, setSheetBColumns] = useState<string[]>([]);
  const [selectedColumnsA, setSelectedColumnsA] = useState<string[]>([]);
  const [selectedColumnsB, setSelectedColumnsB] = useState<string[]>([]);

  // Stage 4: Results
  const [missingEntries, setMissingEntries] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const resetState = (toStage: Stage = 'URLS') => {
    setError(null);
    if (toStage === 'URLS') {
        setSheetAUrl('');
        setSheetBUrl('');
    }
    setSheetAList([]);
    setSheetBList([]);
    setSelectedGidA('');
    setSelectedGidB('');
    setSheetAColumns([]);
    setSheetBColumns([]);
    setSelectedColumnsA([]);
    setSelectedColumnsB([]);
    setMissingEntries([]);
    setStage(toStage);
  };

  const handleFetchSheets = async () => {
    if (!sheetAUrl.trim() || !sheetBUrl.trim()) {
      setError('Please provide both sheet URLs.');
      return;
    }
    setIsLoading(true);
    setError(null);

    const parseSheetList = async (url: string): Promise<SheetInfo[]> => {
        const response = await fetch(url.replace('/pub?output=csv', '/pubhtml'));
        if (!response.ok) throw new Error(`Failed to fetch sheet list from ${url}`);
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const sheetLinks = doc.querySelectorAll('#sheet-menu li a');
        if (sheetLinks.length === 0) {
            // Fallback for single-sheet documents
            return [{ name: 'Default Sheet', gid: '0' }];
        }
        return Array.from(sheetLinks).map(link => ({
            name: link.textContent || 'Unnamed Sheet',
            gid: new URLSearchParams(link.getAttribute('href') || '').get('gid') || '0',
        }));
    };

    try {
      const [sheetsA, sheetsB] = await Promise.all([parseSheetList(sheetAUrl), parseSheetList(sheetBUrl)]);
      setSheetAList(sheetsA);
      setSheetBList(sheetsB);
      setSelectedGidA(sheetsA[0]?.gid || '');
      setSelectedGidB(sheetsB[0]?.gid || '');
      setStage('SHEETS');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not fetch sheet details. Check URLs and publish settings.';
      setError(msg);
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchColumns = async () => {
    if (!selectedGidA || !selectedGidB) {
        setError('Please select a sheet from both documents.');
        return;
    }
    setIsLoading(true);
    setError(null);

    const getBaseUrl = (url: string) => url.split('/pub?')[0];
    
    const parseColumns = async (baseUrl: string, gid: string): Promise<string[]> => {
        const url = `${baseUrl}/pub?gid=${gid}&single=true&output=csv`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch data for sheet gid ${gid}`);
        const csvText = await response.text();
        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                preview: 1,
                complete: (results) => {
                    if (results.meta.fields) {
                        resolve(results.meta.fields);
                    } else {
                        reject(new Error('Could not parse column headers.'));
                    }
                },
            });
        });
    };

    try {
        const [colsA, colsB] = await Promise.all([
            parseColumns(getBaseUrl(sheetAUrl), selectedGidA),
            parseColumns(getBaseUrl(sheetBUrl), selectedGidB)
        ]);
        setSheetAColumns(colsA);
        setSheetBColumns(colsB);
        setStage('COLUMNS');
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Could not fetch column data.';
        setError(msg);
        toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
        setIsLoading(false);
    }
  };

  const handleCompare = async () => {
     if (selectedColumnsA.length === 0 || selectedColumnsB.length === 0) {
        setError('Please select at least one column from each sheet to compare.');
        return;
    }
    setIsLoading(true);
    setError(null);

    const getBaseUrl = (url: string) => url.split('/pub?')[0];
    
    const parseData = (baseUrl: string, gid: string): Promise<any[]> => {
        const url = `${baseUrl}/pub?gid=${gid}&single=true&output=csv`;
        return new Promise(async (resolve, reject) => {
            const response = await fetch(url);
            if (!response.ok) return reject(new Error('Failed to fetch data.'));
            const csvText = await response.text();
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results.data),
                error: (err) => reject(new Error(`CSV Parsing Error: ${err.message}`)),
            });
        });
    };

    try {
        const [dataA, dataB] = await Promise.all([
            parseData(getBaseUrl(sheetAUrl), selectedGidA),
            parseData(getBaseUrl(sheetBUrl), selectedGidB)
        ]);
        
        const getRowIdentifiers = (row: any, columns: string[]) => {
            const ids = new Set<string>();
            columns.forEach(col => {
                const value = String(row[col] || '').trim().toLowerCase();
                if (value) ids.add(value);
            });
            return ids;
        };

        const identifiersB = dataB.map(row => getRowIdentifiers(row, selectedColumnsB));
        
        const missing = dataA.filter(rowA => {
            const idsA = getRowIdentifiers(rowA, selectedColumnsA);
            if (idsA.size === 0) return false;
            
            return !identifiersB.some(idsB => {
                for (const idA of idsA) {
                    if (idsB.has(idA)) return true;
                }
                return false;
            });
        });

        setMissingEntries(missing);
        setStage('RESULTS');

    } catch (e) {
        const msg = e instanceof Error ? e.message : 'An unknown error occurred during comparison.';
        setError(msg);
        toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
        setIsLoading(false);
    }
  };

  const renderColumnSelector = (title: string, columns: string[], selected: string[], setSelected: (cols: string[]) => void) => (
      <div className="space-y-2">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">Select columns to use for matching.</p>
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto rounded-md border p-2">
              {columns.map(col => (
                  <div key={col} className="flex items-center space-x-2">
                      <Checkbox
                          id={`${title}-${col}`}
                          checked={selected.includes(col)}
                          onCheckedChange={checked => {
                              const newSelection = checked
                                  ? [...selected, col]
                                  : selected.filter(c => c !== col);
                              setSelected(newSelection);
                          }}
                      />
                      <Label htmlFor={`${title}-${col}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {col}
                      </Label>
                  </div>
              ))}
          </div>
      </div>
  );

  return (
     <div className="space-y-6">
      <Card className="glass">
        <CardContent className="pt-6">
          {stage === 'URLS' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sheet-a-url">Main Sheet URL (Sheet A)</Label>
                <Input id="sheet-a-url" placeholder="URL for the primary sheet..." value={sheetAUrl} onChange={(e) => setSheetAUrl(e.target.value)} disabled={isLoading} />
                <p className="text-xs text-muted-foreground">The sheet to check entries from.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sheet-b-url">Reference Sheet URL (Sheet B)</Label>
                <Input id="sheet-b-url" placeholder="URL for the sheet to compare against..." value={sheetBUrl} onChange={(e) => setSheetBUrl(e.target.value)} disabled={isLoading} />
                <p className="text-xs text-muted-foreground">The sheet containing entries to check for existence.</p>
              </div>
              <Button onClick={handleFetchSheets} disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? 'Fetching...' : 'Next: Select Sheets'} <ArrowRight className='ml-2'/>
              </Button>
            </div>
          )}

          {stage === 'SHEETS' && (
             <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Select Sheet from Document A</Label>
                    <Select value={selectedGidA} onValueChange={setSelectedGidA}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {sheetAList.map(s => <SelectItem key={s.gid} value={s.gid}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Select Sheet from Document B</Label>
                    <Select value={selectedGidB} onValueChange={setSelectedGidB}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {sheetBList.map(s => <SelectItem key={s.gid} value={s.gid}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className='flex gap-2'>
                  <Button onClick={() => setStage('URLS')} variant="outline">Back</Button>
                  <Button onClick={handleFetchColumns} disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? 'Fetching...' : 'Next: Select Columns'} <ArrowRight className='ml-2'/>
                  </Button>
                </div>
            </div>
          )}
          
          {stage === 'COLUMNS' && (
              <div className="space-y-4">
                {renderColumnSelector('Sheet A Columns', sheetAColumns, selectedColumnsA, setSelectedColumnsA)}
                {renderColumnSelector('Sheet B Columns', sheetBColumns, selectedColumnsB, setSelectedColumnsB)}
                <div className='flex gap-2'>
                   <Button onClick={() => setStage('SHEETS')} variant="outline">Back</Button>
                   <Button onClick={handleCompare} disabled={isLoading} className="w-full sm:w-auto">
                      {isLoading ? 'Comparing...' : 'Compare Sheets'}
                   </Button>
                </div>
              </div>
          )}

          {error && (
             <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {stage === 'RESULTS' && (
         <Card className="glass">
            <CardHeader>
                <div className='flex justify-between items-start'>
                  <div>
                    <CardTitle>Missing Entries ({missingEntries.length})</CardTitle>
                    <CardDescription>Entries found in Sheet A but not in Sheet B.</CardDescription>
                  </div>
                  <Button onClick={() => resetState('URLS')} variant="outline">Start Over</Button>
                </div>
            </CardHeader>
            <CardContent>
              {missingEntries.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="space-y-2 pr-4">
                      {missingEntries.map((entry, index) => (
                          <div key={index} className="grid grid-flow-col auto-cols-fr gap-4 items-center rounded-md border p-2 text-xs sm:text-sm">
                              {Object.values(entry).map((val, i) => (
                                <p key={i} className="truncate" title={String(val)}>{String(val)}</p>
                              ))}
                          </div>
                      ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center h-20 text-muted-foreground">
                  <p>No missing entries found. All items in Sheet A are in Sheet B.</p>
                </div>
              )}
            </CardContent>
         </Card>
      )}
    </div>
  );
}


export default function TrackerClient({ allUsers }: { allUsers: User[] }) {
  return (
    <Tabs defaultValue="tracker" className="w-full">
      <div className="flex justify-center">
        <TabsList className="grid w-full grid-cols-1 sm:w-auto sm:grid-cols-2">
          <TabsTrigger value="tracker"><Users className="mr-2 h-4 w-4" />Submission Tracker</TabsTrigger>
          <TabsTrigger value="comparator"><FileDiff className="mr-2 h-4 w-4" />Sheet Comparator</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="tracker" className="mt-6">
        <SubmissionTracker allUsers={allUsers} />
      </TabsContent>
      <TabsContent value="comparator" className="mt-6">
        <SheetComparator />
      </TabsContent>
    </Tabs>
  );
}
