'use client';

import type { User, Announcement, AnnouncementComment, AnnouncementReaction, PollVote } from "@/types";
import { useState } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import AnnouncementForm from "../announcement-form";
import { AnnouncementCard } from "./announcement-card";

interface AnnouncementsClientProps {
    currentUser: User;
    initialAnnouncements: Announcement[];
    users: User[];
    initialComments: AnnouncementComment[];
    initialReactions: AnnouncementReaction[];
    initialPollVotes: PollVote[];
}

export default function AnnouncementsClient({ 
    currentUser,
    initialAnnouncements,
    users,
    initialComments,
    initialReactions,
    initialPollVotes
}: AnnouncementsClientProps) {

    const [announcements, setAnnouncements] = useState(initialAnnouncements);
    const canPost = ['Co-founder', 'Secretary', 'Chair of Directors'].includes(currentUser.role);
    const userMap = new Map(users.map(u => [u.id, u]));

    const enrichedAnnouncements = announcements.map(announcement => {
        const author = userMap.get(announcement.authorId);
        const comments = initialComments.filter(c => c.announcementId === announcement.id);
        const reactions = initialReactions.filter(r => r.announcementId === announcement.id);
        const pollVotes = initialPollVotes.filter(v => v.announcementId === announcement.id);
        
        return {
            ...announcement,
            author,
            comments,
            reactions,
            pollVotes,
        }
    })

    const handleAnnouncementCreated = () => {
        // This is a simple way to refresh data. A more robust solution might
        // involve adding the new announcement to the state without a full reload.
        window.location.reload(); 
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
             <Card className="glass">
                <CardHeader>
                <CardTitle>Announcements</CardTitle>
                <CardDescription>
                    Stay up-to-date with the latest news and updates from the organization.
                </CardDescription>
                </CardHeader>
            </Card>
            
            {canPost && <AnnouncementForm onAnnouncementCreated={handleAnnouncementCreated} />}

            <div className="space-y-6">
                {enrichedAnnouncements.map(item => (
                    <AnnouncementCard 
                        key={item.id}
                        announcement={item}
                        currentUser={currentUser}
                        userMap={userMap}
                    />
                ))}
            </div>

             {enrichedAnnouncements.length === 0 && (
                <Card className="glass">
                    <CardHeader>
                        <p className="text-center text-muted-foreground">No announcements yet.</p>
                    </CardHeader>
                </Card>
            )}
        </div>
    )
}
