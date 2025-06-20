# QBank Tracker

This project is a QBank (Question Bank) tracker designed to help users monitor their progress, analyze their performance, and stay motivated while preparing for exams. It offers various features to track question completion, visualize progress, and compare stats.

## Project Structure

The project is organized as follows:

*   **`.github/workflows/`**: Contains GitHub Actions workflows, primarily for deployment (`deploy.yml`).
*   **`public/`**: Holds static assets like the main `index.html`, images (`marrow.png`, `vite.svg`), `manifest.json`, and the service worker (`service-worker.ts`).
*   **`src/`**: The core application code resides here.
    *   **`App.tsx`**: The main React component that orchestrates the application's UI.
    *   **`main.tsx`**: The entry point of the React application, responsible for rendering the `App` component into the DOM.
    *   **`assets/`**: Contains static assets used within the application code, such as images (`marrow.png`, `react.svg`).
    *   **`components/`**: Contains all React components.
        *   **`functionality/`**: Houses components that implement specific application features (e.g., `QBankTracker.tsx`, `DailyProgressGraph.tsx`).
        *   **`ui/`**: Contains reusable UI building blocks (e.g., `Button.tsx`, `Card.tsx`, `Header.tsx`).
    *   **`lib/`**: Includes utility modules and configurations.
        *   **`supabase.ts`**: Configures the Supabase client for backend communication.
        *   **`utils.ts`**: Provides general utility functions used across the application (likely for tasks like class name merging via `cn`).
    *   **`utils/`**: Contains specific utility functions, such as `dataPreprocessing.ts` for preparing data for display or analysis.
*   **`index.html`**: The main HTML file that serves as the entry point for the browser.
*   **`vite.config.ts`**: Configuration file for Vite, the build tool used for this project. It defines how the project is built, developed, and previewed.
*   **`tailwind.config.js`**: Configuration file for Tailwind CSS, defining theme, plugins, and content paths.
*   **`tsconfig.json`**: TypeScript configuration file, specifying compiler options and project files.
*   **`package.json`**: Lists project dependencies, scripts (for development, building, linting, deployment), and metadata.

## Core Functionalities

The application provides several key functionalities to help users track and enhance their QBank progress:

### 1. `ActivityLogs.tsx`
*   **Purpose:** Displays a log of activities for two users (`user1` and `user2`), showing completed questions, correctness, and timestamps. It offers "Clock View" and "List View" visualizations, date/user filtering, and a notification system for new activities.
*   **Data Sources:** Receives `logs` and `userNames` as props, uses `localStorage` for notification preferences, and environment variables for EmailJS. `onRefresh` prop fetches new data.
*   **Key Features:**
    *   **Clock View:** Analog clock displaying log entries as dots (sized by completion count) and 3-hour heatmap segments. Shows current time.
    *   **List View:** Chronological list of logs with user, counts, accuracy, and timestamp.
    *   **Filtering:** By single date, date range, and user toggles.
    *   **Calculations:** Accuracy, date formatting, IST conversion, daily totals per user.
    *   **Notifications:**
        *   Integrates `CrossPlatformNotifications.ts` for browser notifications.
        *   `EmailNotificationService` class sends detailed HTML emails via EmailJS (rate-limited) including latest activity, comparative daily progress, leader status, and motivational quotes.
        *   Uses `InAppNotification.tsx` for on-page alerts.
        *   Manages notification preferences (enabled, last seen ID) in `localStorage`.
        *   Polls for new data when page is hidden if notifications are on.
    *   **Refresh:** Manual and auto-refresh (every 30s for today's view) with rate limiting.
*   **Overall:** A central component for activity tracking and updates, rich in display options and notification features.

### 2. `CrossPlatformNotifications.ts`
*   **Purpose:** Provides a unified API for initializing and displaying notifications across desktop web, mobile PWA, and mobile fallbacks.
*   **Mechanisms:**
    1.  **PWA (Service Worker):** On mobile, registers `/service-worker.js` for push notifications if available.
    2.  **Web Notifications API:** On desktop, uses the standard `Notification` API if permission is granted.
    3.  **Fallback (Mobile):** If PWA/Web notifications are unavailable on mobile, it uses `navigator.vibrate()` and dispatches a custom `in-app-notification` event (handled by `InAppNotification.tsx`).
*   **Key Functions:**
    *   `init()`: Asynchronously determines supported notification type, requests permissions, and registers service workers if applicable.
    *   `showNotification(log, userNames, icon)`: Constructs and displays a notification using the best available system identified by `init()`.
*   **Overall:** Abstracts notification complexity, allowing other components to easily trigger alerts without environment-specific logic.

### 3. `DailyProgressGraph.tsx` (ProgressDashboard)
*   **Purpose:** A comprehensive dashboard visualizing a selected user's QBank performance with statistics, charts, and trends.
*   **Data Sources:** Takes `dailyData` (per-user daily completed/correct/accuracy), `userNames`, `activityLogs` (for TimeAnalysis), and `selectedUser` as props. Uses utility functions from `dataPreprocessing.ts`.
*   **Key Features:**
    *   **User & Date Range:** Title indicates selected user; dropdown filters data by "Last Week", "Last Month", "All Time".
    *   **Metric Cards:** Displays "Current Streak", "Daily Average" questions, and "Study Consistency %" using `MetricCard.tsx`.
    *   **Tabbed Interface (`Progress`, `Trends`, `Time Analysis`):**
        *   **Progress Tab:** `ComposedChart` (Recharts) with bars for daily questions completed and a line for daily accuracy. Dual Y-axes.
        *   **Trends Tab:** `LineChart` (Recharts) showing 7-day moving averages for completed questions and accuracy, plus a cumulative line for total questions completed.
        *   **Time Analysis Tab:** Renders the `TimeAnalysis.tsx` component.
    *   **Data Processing:** Uses `useMemo` extensively to filter data by date range, calculate stats (streak, daily average, consistency via `dataPreprocessing.ts` helpers), and prepare data for charts.
*   **Overall:** Serves as a central analytical dashboard for users to understand their performance patterns and trends over various periods.

### 4. `DarkModeToggle.tsx`
*   **Purpose:** Allows users to toggle between light and dark themes, automatically sets an initial theme by time of day, persists preference in `localStorage`, and applies the theme by toggling a `dark` class on `document.documentElement`.
*   **Logic:**
    *   Manages `isDarkMode` state.
    *   **Initial Theme:** On mount, sets dark mode if current time is between 7 PM and 7 AM.
    *   **Persistence & Application:** On `isDarkMode` change, updates `localStorage` and adds/removes `dark` class from `<html>`.
*   **UI:** A toggle switch button with `SunIcon` and `MoonIcon`.
*   **Overall:** Standard and clean dark mode implementation, assuming Tailwind CSS class strategy.

### 5. `DashboardLayout.tsx`
*   **Purpose:** Provides the main structural layout for dashboard pages, including a header, main content area, and `DarkModeToggle` placement.
*   **Structure:**
    *   Outer `div` with gradient background (light/dark mode variants) and flex column layout.
    *   `<header>`: Contains `LeaderboardHeader` component (from `../ui/Header.tsx`), with responsive desktop/mobile arrangements.
    *   `<main>`: Renders `children` within a responsive container using a 12-column CSS Grid for content.
    *   `DarkModeToggle`: Centered at the bottom.
*   **Overall:** A responsive shell ensuring consistent look and feel for dashboard views.

### 6. `EnhancedProgress.tsx` (exports `DualUserProgress`)
*   **Purpose:** Visually compares the current progress of two users against a common target, featuring dynamic motivational messages and an animated day/night background.
*   **Data & Props:** `user1`, `user2` objects (with `name`, `current` progress, optional `previous` progress), and a `target` number.
*   **Key Features:**
    *   **User Indicators:** Floating "cards" above a progress bar, showing each user's name, percentage, `current/target` count, and leader status (crown icon). Positioned by progress.
    *   **Progress Bar:** Horizontal bar with colored segments for each user, scaled relative to `maxProgress` (max of users' current or target).
    *   **Motivational Messages (`getMotivationalMessage`):** Extensive logic to generate contextual messages based on many scenarios (target reached, closeness, momentum, milestones).
    *   **Animated Background (`MovingBackground` sub-component):**
        *   Day/Night cycle: Sky gradient, moving sun/moon based on time.
        *   Animated elements: Drifting clouds (day), twinkling stars (night), parallax scrolling hills. Uses CSS keyframe animations.
*   **Overall:** A highly engaging and visually rich component for comparing two users' progress in a "sprint" or "battle" style.

### 7. `Heatmap.tsx` (exports `ActivityHeatmap`)
*   **Purpose:** Displays a GitHub-style calendar heatmap of daily activity (questions completed) for one or both users, with tooltips for daily counts and streak information.
*   **Data & Props:** `dailyProgress` (array of objects with date and per-user completed/correct counts) and `userNames`.
*   **Key Features:**
    *   **User Selection:** Buttons to toggle display of user1, user2, or combined data.
    *   **Grid Generation:** Complex logic to create a calendar grid starting from the first activity day, attempting to align days/weeks/months correctly. Filters out weeks with no activity.
    *   **Color Intensity:** Cell colors based on activity level (20 shades of purple for user1, 20 for user2). If both users selected and active, cell is split with a gradient.
    *   **Tooltips:** Show date and question counts on hover.
    *   **Streak Calculation:** Uses `calculateConsistencyAndStreak` from `dataPreprocessing.ts` to show current and longest streaks based on selected users' combined activity.
*   **Overall:** Provides a dense, visual summary of activity patterns over time, helping identify active periods and maintain streaks.

### 8. `InAppNotification.tsx`
*   **Purpose:** Displays transient "toast" style notifications within the application UI, triggered by a global custom event.
*   **Logic:**
    *   Listens for a `window` custom event named `'in-app-notification'`.
    *   When triggered, displays an `Alert` component (from `components/ui/alert`) with the provided title and body.
    *   Automatically hides the notification after 5 seconds.
*   **Integration:** Primarily used by `CrossPlatformNotifications.ts` as a fallback mechanism on mobile.
*   **Overall:** A simple and effective way to show non-blocking alerts to the user.

### 9. `ProgressPopup.tsx`
*   **Purpose:** Displays a user's detailed progress information (the `DailyProgressGraph` / `ProgressDashboard` component) within a modal dialog.
*   **Data & Props:** `isOpen`, `onClose` for dialog control, and props to pass down to `ProgressDashboard` (`dailyData`, `userNames`, `selectedUser`, `activityLogs`).
*   **Key Features:**
    *   Uses `Dialog` components from `components/ui/dialog`.
    *   Renders `ProgressDashboard` as its main content.
    *   Sets `hideUserSelect={true}` on `ProgressDashboard`, as the user is pre-selected.
    *   Includes responsive sizing for the dialog and data validation for `dailyData`.
*   **Overall:** A modal wrapper to present the detailed `ProgressDashboard` view on demand.

### 10. `RadarChart.tsx` (exports `UserStatsRadarChart`)
*   **Purpose:** Visually compares multiple performance statistics of two users (total questions, correct, accuracy, daily average, consistency, streak) using a radar chart within a dialog.
*   **Data & Props:** `user1`, `user2` objects (with detailed stats), `isOpen`, `onOpenChange`.
*   **Key Features:**
    *   **Data Normalization:** For most metrics, values are normalized (scaled to 0-100 relative to the leader on that metric) for consistent plotting on radar axes. Accuracy and consistency use raw percentages.
    *   **Radar Display:** Uses Recharts to plot data for both users with distinct colors.
    *   **Custom Tooltip:** Shows original (non-normalized) values on hover for better context.
    *   **Raw Stats:** Displays raw numbers for each user in cards below the chart.
*   **Overall:** Offers a multi-dimensional comparative view of user performance in a focused dialog.

### 11. `StatsComparison.tsx` (Battle Arena)
*   **Purpose:** A central component to compare key stats of two users, allow password-protected progress updates, and link to detailed views (`ProgressPopup`, `UserStatsRadarChart`).
*   **Data & Props:** `stats` (basic completed/correct/name for users), `dailyData`, `activityLogs`, and `onUpdateProgress` callback.
*   **Key Features:**
    *   **UI:** "Battle Arena" theme with user sections, "VS" button, `ComparisonBar` sub-component for direct stat comparison (total, correct, accuracy), and a leader banner.
    *   **`ComparisonBar`:** Visually shows which user is ahead on a specific metric with colored bars and the difference.
    *   **Progress Update:** Password-protected dialog to add completed/correct questions. Calls `onUpdateProgress` and sends an email notification via `EmailNotificationService` (from `ActivityLogs.tsx`). Uses `sonner` for toasts.
    *   **Detailed Views:** Buttons to open `ProgressPopup` (for individual stats) and `UserStatsRadarChart` (for "VS" comparison).
    *   **Leader Calculation:** Uses a points system (Completed + bonus for accuracy > 80%) to determine the leader.
*   **Overall:** A gamified hub for comparing users, updating progress, and accessing deeper performance insights.

### 12. `TimeAnalysis.tsx`
*   **Purpose:** Analyzes and visualizes user performance based on the time of day, using `activityLogs` for a `selectedUser`.
*   **Data & Props:** `activityLogs`, `selectedUser`, optional `dateRange`.
*   **Key Features:**
    *   **View Selection:** Buttons to switch between 'chart', 'clock', and '3d' views.
    *   **Data Processing:** Aggregates logs into 3-hour intervals (calculating accuracy, attempts, total questions) for chart/clock views. For 3D view, processes individual logs. Identifies overall average accuracy, peak, and low performance intervals.
    *   **Visualizations:**
        *   **Chart View (Recharts):** `ComposedChart` with bars for total questions and a line for accuracy per 3-hour interval. Shows average accuracy reference line.
        *   **Clock View (Custom):** 24-hour analog clock with radial bars indicating activity volume (length) and accuracy (color) for each hour's interval.
        *   **3D View (Plotly):** 3D scatter plot of individual sessions (X: Time of Day, Y: Accuracy, Z: Questions Completed), with points colored by accuracy.
    *   **Summary:** Displays peak and low performance periods.
*   **Overall:** Offers rich insights into when a user performs best or struggles, using multiple engaging visualization methods.

## UI Components

The `src/components/ui/` directory contains a collection of reusable UI components based on shadcn/ui and Radix UI primitives. These components are used throughout the application to build a consistent and accessible user interface. Examples include:

*   `Button.tsx`
*   `Card.tsx`
*   `Dialog.tsx`
*   `Header.tsx`
*   `Input.tsx`
*   `Progress.tsx`
*   `Select.tsx`
*   `Tabs.tsx`
*   `Tooltip.tsx`

These components are styled using Tailwind CSS and are designed to be easily customizable and composable.

## Key Technologies

This project is built using a modern web development stack:

*   **Frontend:**
    *   **React:** A JavaScript library for building user interfaces.
    *   **Vite:** A fast build tool and development server for modern web projects.
    *   **TypeScript:** A superset of JavaScript that adds static typing.
    *   **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
    *   **shadcn/ui & Radix UI:** For pre-built, accessible UI components.
    *   **Recharts & Plotly.js:** Libraries for creating interactive charts and graphs.
*   **Backend & Services:**
    *   **Supabase:** An open-source Firebase alternative for database, authentication, and other backend services.
    *   **EmailJS & Resend:** Client-side and server-side email sending services.
    *   **Twilio:** For SMS notifications.
*   **Development & Tooling:**
    *   **ESLint:** For code linting and maintaining code quality.
    *   **GitHub Actions:** For CI/CD, specifically for deploying the application.
    *   **npm:** Package manager for JavaScript.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (which includes npm) installed on your machine. You can download it from [nodejs.org](https://nodejs.org/).

### Installation

1.  Clone the repository:
    ```sh
    git clone https://github.com/your-username/qbanktracker.git
    ```
    (Replace `your-username/qbanktracker.git` with the actual repository URL)
2.  Navigate to the project directory:
    ```sh
    cd qbanktracker
    ```
3.  Install NPM packages:
    ```sh
    npm install
    ```

### Development

To run the application in development mode with hot-reloading:

```sh
npm run dev
```

This will typically start the development server on `http://localhost:6969`.

### Linting

To check the code for linting issues:

```sh
npm run lint
```

### Building for Production

To create a production build of the application:

```sh
npm run build
```

This command will compile the TypeScript code and bundle the application into the `dist/` directory, ready for deployment.

## Deployment

This project is set up for deployment to GitHub Pages.

*   **GitHub Actions:** The `.github/workflows/deploy.yml` file defines a GitHub Actions workflow that automates the deployment process. This workflow is typically triggered on pushes to the main branch.
*   **`gh-pages`:** The `npm run deploy` script (which uses the `gh-pages` package) is used by the GitHub Actions workflow to build the application and push the contents of the `dist/` directory to the `gh-pages` branch, which is then served by GitHub Pages.

To manually deploy (though the automated workflow is preferred):

1.  Ensure your `package.json` has the correct `homepage` field if deploying to a subpath on GitHub Pages.
2.  Run the deploy script:
    ```sh
    npm run deploy
    ```
