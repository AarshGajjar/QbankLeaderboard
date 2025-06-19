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

The application provides several key functionalities to help users track their QBank progress:

*   **`QBankTracker.tsx`**: Likely the central component for tracking overall QBank completion and progress.
*   **`ActivityLogs.tsx`**: Displays a log of user activities, possibly showing recently completed questions or study sessions.
*   **`CrossPlatformNotifications.ts`**: Manages sending notifications across different platforms (e.g., web, email, SMS), potentially using services like EmailJS, Resend, or Twilio based on `package.json` dependencies.
*   **`DailyProgressGraph.tsx`**: Visualizes the user's daily progress, perhaps with a bar or line chart showing questions completed per day.
*   **`DarkModeToggle.tsx`**: Allows users to switch between light and dark themes for the application interface.
*   **`DashboardLayout.tsx`**: Defines the main layout structure for the dashboard area of the application.
*   **`EnhancedProgress.tsx`**: Likely provides a more detailed or advanced view of user progress, possibly with more metrics or visualizations.
*   **`Heatmap.tsx`**: Displays user activity or performance using a heatmap, which could represent study consistency or topic strengths/weaknesses.
*   **`InAppNotification.tsx`**: Handles displaying notifications directly within the application interface.
*   **`ProgressPopup.tsx`**: A popup component that likely appears to show progress updates or confirmations.
*   **`RadarChart.tsx`**: Visualizes multiple performance metrics simultaneously on a radar chart, useful for comparing performance across different subjects or categories.
*   **`StatsComparision.tsx`**: Allows users to compare their statistics, perhaps against their own past performance or anonymized peer data.
*   **`TimeAnalysis.tsx`**: Provides an analysis of time spent studying or on specific question types.

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
