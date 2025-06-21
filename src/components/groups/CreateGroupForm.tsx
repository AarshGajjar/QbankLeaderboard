import React, { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Assuming supabase is exported from here
import { NewGroupPayload } from '@/types/database';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Group } from '@/types/database';

interface CreateGroupFormProps {
  onGroupCreated: (newGroup: Group) => void;
}

const CreateGroupForm: React.FC<CreateGroupFormProps> = ({ onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!groupName.trim()) {
      setError('Group name is required.');
      return;
    }
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const payload: NewGroupPayload = {
        name: groupName,
        description: description || undefined, // Ensure optional fields are handled
        created_by_user_id: user.id, // This is set by RLS/trigger or apiService
      };

      // Using direct supabase call here, could also use apiService.createGroup
      const { data: newGroup, error: insertError } = await supabase
        .from('groups')
        .insert(payload)
        .select()
        .single();

      if (insertError) throw insertError;

      // After creating the group, the creator should automatically be an admin member.
      // This can be handled by a database trigger or explicitly here.
      // For simplicity, let's assume a trigger or that createGroup in apiService handles this.
      // If not, add user to group:
      // await supabase.from('group_memberships').insert({ group_id: newGroup.id, user_id: user.id, role: 'admin' });
      // It's generally better to handle this transactionally in a database function if possible.
      // For now, we rely on the backend logic (RLS or a db function via rpc) to make the creator an admin.
      // Or, if the `createGroup` in `apiService.ts` handles adding the creator as admin, that's fine.
      // The current `apiService.createGroup` doesn't explicitly add member, schema has `created_by_user_id`

      // Let's assume we need to add the creator as an admin member explicitly if not handled by trigger.
      // This is a common pattern.
      if (newGroup) {
        const { error: membershipError } = await supabase
          .from('group_memberships')
          .insert({ group_id: newGroup.id, user_id: user.id, role: 'admin' });
        if (membershipError) {
          // Potentially roll back group creation or log error
          console.error("Failed to add creator to group as admin:", membershipError);
          toast.error(`Group created, but failed to add you as admin: ${membershipError.message}`);
          // Fall through to onGroupCreated, but with a warning.
        }
      }


      toast.success(`Group "${newGroup.name}" created successfully!`);
      onGroupCreated(newGroup);
      setGroupName('');
      setDescription('');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to create group.';
      console.error('Error creating group:', e);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Study Group</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
              Group Name
            </label>
            <Input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Weekend Warriors"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., A group for focused study sessions on weekends."
              disabled={isSubmitting}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateGroupForm;
