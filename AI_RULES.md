# AI Rules for Rotary Club Piracicaba Engenho Application

This document outlines the core technologies used in this project and provides guidelines for their usage to ensure consistency, maintainability, and best practices.

## Tech Stack Overview

*   **React & TypeScript:** The application is built using React for the user interface, with TypeScript for strong typing and improved code quality.
*   **Vite:** Used as the build tool, providing a fast development experience and optimized production builds.
*   **Tailwind CSS:** A utility-first CSS framework for styling, enabling rapid UI development and consistent design.
*   **shadcn/ui & Radix UI:** A collection of beautifully designed, accessible, and customizable UI components built on Radix UI and styled with Tailwind CSS.
*   **Supabase:** Provides the backend services, including authentication, database (PostgreSQL), and real-time capabilities.
*   **React Router:** Manages client-side routing, defining navigation paths and rendering components based on the URL.
*   **Tanstack Query:** Handles server state management, including data fetching, caching, synchronization, and error handling.
*   **Lucide React:** A library for open-source, customizable SVG icons.
*   **date-fns:** A modern JavaScript date utility library for parsing, validating, manipulating, and formatting dates.
*   **react-hook-form & Zod:** Used for efficient form management and schema-based validation.
*   **Sonner:** A modern toast library for displaying notifications.

## Library Usage Guidelines

To maintain a consistent and efficient codebase, please adhere to the following rules when developing:

*   **UI Components:**
    *   **Always** prioritize using existing `shadcn/ui` components.
    *   If a specific `shadcn/ui` component doesn't exist or needs significant modification, create a new component in `src/components/` that follows `shadcn/ui`'s styling and accessibility patterns. **Do not modify `shadcn/ui`'s original files.**
*   **Styling:**
    *   **Exclusively** use Tailwind CSS classes for all styling. Avoid writing custom CSS in `.css` files unless it's for global styles defined in `src/index.css`.
    *   Ensure designs are responsive using Tailwind's utility classes (e.g., `md:`, `lg:`).
*   **State Management:**
    *   For server-side data fetching, caching, and synchronization, use **Tanstack Query**.
    *   For local component state, use React's `useState` or `useReducer`.
*   **Routing:**
    *   All application navigation should be handled using **React Router**. Define routes in `src/App.tsx`.
*   **Backend & Authentication:**
    *   Interact with the backend services (database, authentication) via the **Supabase client** (`@/integrations/supabase/client`).
*   **Icons:**
    *   Use icons from the **Lucide React** library.
*   **Forms:**
    *   Implement forms using **react-hook-form** for state management and validation.
    *   Use **Zod** for defining form schemas and validation rules.
*   **Date Handling:**
    *   All date manipulation and formatting should be done using **date-fns**.
*   **Notifications:**
    *   Use the **Sonner** library for displaying all user notifications (toasts).
*   **Utility Functions:**
    *   For combining Tailwind CSS classes conditionally, use the `cn` utility function from `src/lib/utils.ts`.