import React, { useState } from 'react';
import { Group as GroupType } from '@/types/database'; // Renamed to avoid conflict
import GroupList from './GroupList';
import CreateGroupForm from './CreateGroupForm';
import GroupView from './GroupView';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useGroups, UserGroup } from '@/hooks/useGroups'; // UserGroup now exported from useGroups
import { useGroupDetails } from '@/hooks/useGroupDetails';

const GroupsPage: React.FC = () => {
  const { profile: currentUser, authUser, loading: isLoadingUser, error: userProfileError } = useUserProfile();
  // Pass authUser to useGroups hook
  const { groups, loading: isLoadingGroups, error: groupsError, createGroup, refetch: refetchGroups } = useGroups(authUser);

  type ViewState =
    | { type: 'list' }
    | { type: 'create' }
    | { type: 'view_group'; groupId: string; initialGroupData?: UserGroup }; // Store groupId, fetch details with useGroupDetails

  const [viewState, setViewState] = useState<ViewState>({ type: 'list' });

  // Hook for fetching details when viewState.type is 'view_group'
  const {
    groupDetails,
    loading: isLoadingGroupDetails,
    error: groupDetailsError,
    refetch: refetchGroupDetails
  } = useGroupDetails(viewState.type === 'view_group' ? viewState.groupId : undefined);


  const handleGroupCreated = async (groupData: Omit<GroupType, 'id' | 'created_at' | 'updated_at' | 'created_by_user_id'>) => {
    if (!currentUser) {
        toast.error("Current user not found. Cannot create group.");
        return;
    }
    try {
      await createGroup(groupData); // createGroup from useGroups handles adding creator as admin
      toast.success(`Group "${groupData.name}" created successfully!`);
      refetchGroups(); // Refetch the list of groups
      setViewState({ type: 'list' });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to create group.';
      toast.error(errorMessage);
      console.error(e);
    }
  };

  const handleSelectGroup = (group: UserGroup) => {
    setViewState({ type: 'view_group', groupId: group.id, initialGroupData: group });
  };

  const handleBackToList = () => {
    setViewState({ type: 'list' });
  };

  if (isLoadingUser) {
    return <p className="p-4 text-center">Loading user data...</p>;
  }

  if (userProfileError || !currentUser) {
    return <p className="p-4 text-red-500 text-center">Error loading user data: {userProfileError || 'User not found.'} Please ensure you are logged in.</p>;
  }

  const renderContent = () => {
    switch (viewState.type) {
      case 'list': {
        if (isLoadingGroups) return <p className="p-4 text-center">Loading groups...</p>;
        if (groupsError) return <p className="p-4 text-red-500 text-center">Error loading groups: {groupsError}</p>;
        return (
          <GroupList
            groups={groups}
            onSelectGroup={handleSelectGroup}
            onRequestCreateGroup={() => setViewState({ type: 'create' })}
          />
        );
      }
      case 'create': {
        return (
          <div>
            <Button variant="outline" onClick={handleBackToList} className="mb-4">
              Back to Group List
            </Button>
            <CreateGroupForm onGroupCreated={handleGroupCreated} />
          </div>
        );
      }
      case 'view_group': {
        if (isLoadingGroupDetails) return <p className="p-4 text-center">Loading group details...</p>;
        if (groupDetailsError) return <p className="p-4 text-red-500 text-center">Error loading group details: {groupDetailsError}</p>;

        const groupToView = groupDetails || viewState.initialGroupData;
        if (!groupToView) return <p className="p-4 text-red-500 text-center">Group not found.</p>;

        // Ensure members array exists, even if empty
        const members = groupDetails?.members || viewState.initialGroupData?.members || [];
        const currentRoleInGroup = members.find(m => m.id === currentUser.id)?.role || viewState.initialGroupData?.role || 'member';

        // Construct the group object for GroupView ensuring members is always an array
        const displayGroup = {
            ...groupToView, // groupToView is (groupDetails || viewState.initialGroupData)
            members: members,
            role: currentRoleInGroup
        };
        // Use displayGroup which correctly merges initial data with fetched details
        return (
          <GroupView
            group={displayGroup}
            currentUser={currentUser}
            onBackToList={handleBackToList}
            refreshDetails={refetchGroupDetails}
          />
        );
      }
      default:
        return null;
    }
  }

  return (
    <div className="container mx-auto p-4">
      {renderContent()}
      {/* TODO: Add functionality for joining existing groups */}
      {/* TODO: Integrate group-based stats comparison */}
    </div>
  );
};

export default GroupsPage;
