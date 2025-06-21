import React from 'react';
// Removed supabase, Profile, toast imports as data is passed down or handled by parent/hooks
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Users } from 'lucide-react';
import { UserGroup } from '@/hooks/useGroups'; // Import UserGroup type from the hook

interface GroupListProps {
  groups: UserGroup[]; // Groups are now passed as a prop
  onSelectGroup: (group: UserGroup) => void;
  onRequestCreateGroup: () => void;
  // isLoading and error states are handled by the parent using the useGroups hook
}

const GroupList: React.FC<GroupListProps> = ({ groups, onSelectGroup, onRequestCreateGroup }) => {
  // isLoading and error are handled by the parent component (GroupsPage)
  // which uses the useGroups hook.
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Your Study Groups</CardTitle>
          <CardDescription>Select a group to view details or create a new one.</CardDescription>
        </div>
        <Button onClick={onRequestCreateGroup} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Create Group
        </Button>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <p>You are not a member of any groups yet.</p>
        ) : (
          <ul className="space-y-3">
            {groups.map((group) => (
              <li key={group.id} className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer flex justify-between items-center" onClick={() => onSelectGroup(group)}>
                <div>
                  <h3 className="font-semibold">{group.name} <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">{group.role}</span></h3>
                  {group.description && <p className="text-sm text-gray-600">{group.description}</p>}
                </div>
                <Users className="h-5 w-5 text-gray-400" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default GroupList;
