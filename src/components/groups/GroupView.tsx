import React, { useState, useEffect } from 'react';
import { Profile, QuestionBank } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, UserCheck, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { GroupDetails } from '@/hooks/useGroupDetails';
import GroupStatsComparison from './GroupStatsComparison';
import { supabase } from '@/lib/supabase'; // For fetching default QB
import { toast } from 'sonner';

interface GroupViewProps {
  group: GroupDetails & { role: string };
  currentUser: Profile;
  onBackToList: () => void;
  refreshDetails?: () => void;
}

const GroupView: React.FC<GroupViewProps> = ({ group, currentUser, onBackToList, refreshDetails }) => {
  const [defaultQuestionBank, setDefaultQuestionBank] = useState<QuestionBank | null>(null);
  const [isQbLoading, setIsQbLoading] = useState(true);

  useEffect(() => {
    async function fetchDefaultQB() {
      setIsQbLoading(true);
      try {
        const { data: qbData, error: qbError } = await supabase
          .from('question_banks')
          .select('*')
          .eq('name', 'Default QBank')
          .single();
        if (qbError) throw qbError;
        setDefaultQuestionBank(qbData);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to load default question bank for group stats.";
        toast.error(errorMessage);
        console.error("Failed to load default question bank:", e);
      } finally {
        setIsQbLoading(false);
      }
    }
    fetchDefaultQB();
  }, []);

  const members = group.members || [];
  const currentUserIsAdmin = group.role === 'admin';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-6 w-6" /> {group.name}
            </CardTitle>
            <CardDescription>{group.description || 'No description provided.'}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onBackToList}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Groups
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Your role: <span className="font-semibold">{group.role}</span></p>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-semibold mb-3">Members ({members.length})</h3>
        {members.length === 0 ? (
          <p>This group has no members yet.</p>
        ) : (
          <ul className="space-y-2">
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center">
                  {/* Placeholder for avatar */}
                  <div className="w-8 h-8 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                    {member.avatar_url ? <img src={member.avatar_url} alt={member.username} className="rounded-full w-full h-full object-cover" /> : <User className="h-5 w-5 text-gray-500" />}
                  </div>
                  <div>
                    <p className="font-medium">{member.full_name || member.username}</p>
                    <p className="text-xs text-gray-500">{member.username}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  {member.role === 'admin' ? <ShieldCheck className="h-5 w-5 text-blue-600 mr-1" /> : <UserCheck className="h-5 w-5 text-gray-500 mr-1" />}
                  {member.role}
                </div>
              </li>
            ))}
          </ul>
        )}
        {/* Placeholder for future actions like "Invite Member" or "Leave Group" */}
        {currentUserIsAdmin && (
            <div className="mt-4">
                <Button variant="outline" disabled>Manage Members (Admin)</Button> {/* TODO */}
            </div>
        )}
         <div className="mt-4">
            <Button variant="destructive" disabled>Leave Group</Button> {/* TODO */}
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupView;
