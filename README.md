# QBank Tracker - Production Version

## Overview

Welcome to the QBank Tracker! This application has been re-architected from its prototype stage into a scalable, production-ready solution designed to help users track their question bank progress, analyze performance, and collaborate within groups.

-   **Fresh Architecture**: This version is a significant rewrite, focusing on a robust multi-tenant backend using Supabase.
-   **Multi-user Support**: Features full user authentication, individual progress tracking, and the ability to create and join groups for comparative analytics and collaborative study.
-   **No Migration Required from Old Prototype**: This is effectively a new project. New users will start with a clean slate. The previous version was a prototype/demo. If you were a developer using the old prototype, a [developer-only migration script](#developer-data-migration-from-prototype) is available to transfer *test data*.

## Quick Start

Get up and running with QBank Tracker quickly:

1.  **Account Creation**:
    *   Navigate to the application.
    *   Click on "Sign Up" (or a similar option provided by the authentication interface).
    *   Register with your email and password, or use a supported social login.
2.  **First Login & Dashboard**:
    *   Upon successful login, you'll be directed to your personal QBank Tracker dashboard.
    *   Here you can start logging your question bank progress using the "Log New Progress" form.
    *   Your statistics, activity logs, and heatmap will populate as you add data.
3.  **Joining/Creating Groups**:
    *   Navigate to the "Groups" section (if a dedicated navigation item exists, or it might be part of your dashboard).
    *   **Create a Group**: Click "Create Group", fill in the name and an optional description. You'll automatically be an admin of this group.
    *   **Joining a Group**: (Current version primarily supports creation. Joining may be by future invite system or by direct addition by an admin. For now, if another user creates a group, they would need to add you.)
4.  **Group Comparisons**:
    *   Once in a group, navigate to the group's view.
    *   You'll see a "Group Statistics Comparison" table showing how you stack up against other members in terms of points, completion, accuracy, and streaks.

## Deployment Guide

This guide helps you deploy your own instance of QBank Tracker.

### 1. Supabase Project Setup

1.  **Create a Supabase Account/Project**:
    *   Go to [supabase.com](https://supabase.com) and sign up or log in.
    *   Create a new project. Choose a region close to your users.
    *   Note your project's **API URL** and **anon (public) key**. You'll find these in your Supabase project dashboard under `Project Settings` > `API`.
2.  **Database Setup**:
    *   In your Supabase project dashboard, go to the `SQL Editor`.
    *   Click on `+ New query`.
    *   **Execute `schema.sql`**: Copy the entire content of `schema.sql` (provided in this repository) into the query editor and run it. This will create all necessary tables, functions, and triggers for the application.
    *   **Execute `rls_policies.sql`**: After the schema is successfully created, open a new query tab. Copy the entire content of `rls_policies.sql` (provided in this repository) and run it. This will apply the Row-Level Security policies to your tables.
3.  **Authentication Providers (Optional but Recommended)**:
    *   In your Supabase project dashboard, go to `Authentication` > `Providers`.
    *   Enable and configure any third-party OAuth providers you want to support (e.g., Google, GitHub). Follow the Supabase documentation for each provider.

### 2. Application Code Setup

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd qbank-tracker-prod # Or your chosen directory name
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Variables Configuration**:
    *   Create a `.env.local` file in the root of your project.
    *   Add your Supabase project credentials:
        ```env
        VITE_SUPABASE_URL=YOUR_SUPABASE_API_URL
        VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```
    *   Replace `YOUR_SUPABASE_API_URL` and `YOUR_SUPABASE_ANON_KEY` with the actual values from your Supabase project.

### 3. Running Locally (Development)

```bash
npm run dev
```
The application should be accessible at `http://localhost:5173` (or another port if 5173 is busy).

### 4. Production Deployment (Example: Vercel)

1.  **Push to a Git Repository**: Push your configured project to a GitHub, GitLab, or Bitbucket repository.
2.  **Import Project on Vercel**:
    *   Sign up or log in to [vercel.com](https://vercel.com).
    *   Click "Add New..." > "Project".
    *   Import the Git repository you just pushed.
3.  **Configure Project Settings**:
    *   Vercel should automatically detect it as a Vite project.
    *   **Environment Variables**: Add the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in your Vercel project settings (Settings > Environment Variables).
4.  **Deploy**: Click the "Deploy" button. Vercel will build and deploy your application.

## Features

*   **Individual Progress Tracking**:
    *   Log completed and correct questions daily.
    *   View detailed personal statistics: total completed/correct, overall accuracy, daily average, consistency percentage, current and longest streaks, and points.
    *   Visualize daily activity on a heatmap.
    *   Browse historical activity logs with date filtering and a clock view.
*   **Group Functionality**:
    *   Create and name study groups.
    *   View members of a group and their roles (admin, member).
    *   (Future: Join existing groups, invite members, manage roles).
*   **Group Comparisons**:
    *   Within a group, view a statistical comparison table of all members.
    *   Compare based on points, questions completed, accuracy, streaks, and more.
*   **Authentication**: Secure user accounts with email/password and optional social logins via Supabase Auth.
*   **Responsive UI**: Designed to work on various screen sizes.
*   **Dark Mode**: Toggle between light and dark themes.

### Temporarily Disabled/Modified Features
*   **Advanced Email Notifications**: The previous prototype version had a detailed email notification system for two specific users. This has been commented out as it requires significant generalization for a multi-user environment (e.g., user-configurable notification preferences, email sending setup). Basic browser-based notifications for new activity logs are available if permission is granted.

## API & Hooks Documentation

The application uses custom React Hooks to manage data fetching and state related to Supabase.

*   **`useUserProfile()`**:
    *   Fetches and manages the currently authenticated user's profile from the `profiles` table.
    *   Returns: `{ profile, authUser, loading, error, updateProfile(), refetch() }`.
    *   Example: `const { profile, loading } = useUserProfile();`
*   **`useUserProgress(userId?: string, questionBankId?: string)`**:
    *   Fetches and manages `user_progress` records for a given user and question bank.
    *   Returns: `{ progress, loading, error, refetch(), addProgressEntry() }`.
    *   Example: `const { progress } = useUserProgress(currentUser.id, qb.id);`
*   **`useActivityLogs(userId?: string, questionBankId?: string, limit?: number)`**:
    *   Fetches and manages `activity_logs` for a user and question bank.
    *   Returns: `{ logs, loading, error, refetch(), addActivityLog() }`.
*   **`useGroups(authUser?: User | null)`**:
    *   Fetches groups the authenticated user is a member of.
    *   Returns: `{ groups, loading, error, refetch(), createGroup() }`.
    *   `createGroup(groupData)`: Creates a new group and adds the current user as an admin.
*   **`useGroupDetails(groupId?: string)`**:
    *   Fetches details for a specific group, including its members.
    *   Returns: `{ groupDetails, loading, error, refetch(), addMember(), removeMember(), updateMemberRole() }`.
*   **`useGroupMembersProgress(groupId?: string, questionBankId?: string)`**:
    *   Fetches all members of a group and their respective progress for a specific question bank.
    *   Used by `GroupStatsComparison.tsx`.
    *   Returns: `{ membersProgress, loading, error, refetch }`.

**Error Handling**: Hooks generally return `loading` and `error` states. Components should handle these to provide appropriate UI feedback (e.g., loading spinners, error messages). Mutations (like `createGroup`) will throw errors on failure, which should be caught in the component. `toast` notifications are used for user feedback on actions.

## Architecture Overview

*   **Frontend**: React (with Vite and TypeScript), Tailwind CSS, shadcn/ui.
*   **Backend**: Supabase (PostgreSQL database, Auth, Row-Level Security).
*   **State Management**: Primarily through React hooks.
*   **Multi-tenant Design**:
    *   User data (progress, logs) is tied to `user_id`.
    *   RLS policies ensure users can only access their own data or data shared with them through groups.
*   **Group-based Comparison**: Users can join groups, and statistical comparisons are made among members of the same group.
*   **Authentication Flow**:
    1.  User signs up or logs in via `AuthComponent.tsx` (using Supabase Auth UI).
    2.  Supabase Auth issues a JWT.
    3.  A trigger in Supabase creates a corresponding entry in the `public.profiles` table.
    4.  Client-side, `App.tsx` manages the session. Authenticated users can access protected components like `QBankTracker.tsx` and `GroupsPage.tsx`.
    5.  Supabase client SDK uses the JWT to make authenticated requests, and RLS policies on the database enforce data access rules based on `auth.uid()`.

## Database Schema Snapshot

The core tables include:

*   **`public.profiles`**: Stores user-specific public data, linked to `auth.users`.
    *   `id (UUID, PK, FK to auth.users.id)`, `username`, `full_name`, `avatar_url`, `created_at`, `updated_at`.
*   **`public.groups`**: Defines study groups.
    *   `id (UUID, PK)`, `name`, `description`, `created_by_user_id (FK to profiles.id)`, `created_at`, `updated_at`.
*   **`public.group_memberships`**: Links users to groups with roles.
    *   `id (UUID, PK)`, `group_id (FK to groups.id)`, `user_id (FK to profiles.id)`, `role (ENUM 'admin', 'member')`, `created_at`, `updated_at`.
*   **`public.question_banks`**: (Currently, a single 'Default QBank' is primarily used).
    *   `id (UUID, PK)`, `name`, `description`, `created_at`, `updated_at`.
*   **`public.user_progress`**: Tracks aggregated daily progress per user per question bank.
    *   `id (UUID, PK)`, `user_id (FK to profiles.id)`, `question_bank_id (FK to question_banks.id)`, `date (DATE)`, `completed_count`, `correct_count`, `created_at`, `updated_at`.
    *   Unique constraint: `(user_id, question_bank_id, date)`.
*   **`public.activity_logs`**: Logs individual activity submissions.
    *   `id (UUID, PK)`, `user_id (FK to profiles.id)`, `question_bank_id (FK to question_banks.id)`, `completed_delta`, `correct_delta`, `timestamp`, `created_at`.

Refer to `schema.sql` for the full DDL.

## Row-Level Security (RLS) Overview

RLS is enforced on all key tables to ensure data privacy and integrity:
*   Users can only manage their own profiles, progress, and activity logs.
*   Group admins can manage their group details and memberships.
*   Group members can view details of groups they belong to and the profiles/progress of other members within those same groups for comparison features.
*   Question banks are generally readable by all authenticated users.

Refer to `rls_policies.sql` for detailed policy definitions.

## Developer Data Migration (from Prototype)
If you were a developer working with the previous two-user prototype and wish to migrate that *test data* into this new structure for your *local development environment*:
1.  Ensure the new schema (`schema.sql`) and RLS policies (`rls_policies.sql`) are applied to your development Supabase instance.
2.  Create user accounts in Supabase Auth for the two prototype users (e.g., "Aarsh", "Aman").
3.  Obtain their new User IDs (UUIDs) from the `public.profiles` table (these are the same as their `auth.users.id`).
4.  Obtain the UUID of the 'Default QBank' from the `public.question_banks` table (it's seeded by `schema.sql`).
5.  **Crucially, update these placeholder UUIDs at the top of the `migration.sql` script with the actual UUIDs from your development database.**
6.  Run `migration.sql` using the Supabase SQL editor. This script is **not for migrating end-user production data** from the old prototype, as this version is intended as a fresh start for users. It's purely a developer convenience for populating a new dev instance with old test data.

---

This project structure and feature set provide a solid foundation for a collaborative and insightful QBank tracking experience.
