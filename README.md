# Univote Web

<p align="center">
  <img src="./public/Darklogo.png" alt="Univote logo" width="140" />
</p>

<p align="center">
  <strong>Secure university election frontend for students, administrators, and campus onboarding teams.</strong>
</p>

Univote Web is the public-facing and operational frontend for the Univote platform. It presents the product landing experience, tenant onboarding flow, application-status tracking, student-facing election journeys, and admin interfaces that connect to the Univote backend APIs.

The product was designed to modernize campus elections with a trustworthy digital workflow that combines identity verification, geofencing, transparent voting, and real-time election operations. It is built as a Next.js application with a component-driven UI system, React Query for API state, and cloud integrations for biometric and media workflows.

## What This Frontend Covers

- Public product marketing pages for the Univote platform
- University workspace application and onboarding flow
- Application-status tracking for prospective institutions
- Student authentication and election access flows
- Admin dashboards and election operations interfaces
- Announcement, support, and notification experiences
- PWA bootstrapping for better student-device usability
- Responsive UI across desktop, tablet, and mobile screens

## Core Product Value

Univote Web helps institutions move away from manual or loosely controlled campus election processes by giving them a guided digital interface for:

- secure voter onboarding
- election-session visibility
- student participation from approved locations
- biometric identity verification support
- real-time result awareness
- structured tenant onboarding for universities adopting the platform

## Key Frontend Features

### Public Experience

- Landing page with clear product positioning and feature storytelling
- SEO metadata, sitemap, robots config, and structured data support
- Tenant application page for universities requesting a Univote workspace
- Application-status page for checking onboarding progress

### Student Experience

- Sign-in, password reset, and protected-route handling
- Student PWA bootstrap support
- Voting flows connected to backend election and verification services
- Notification and announcement surfaces

### Administrative Experience

- Dashboard shell and analytics widgets
- Session and candidate management surfaces
- Support desk and chat-oriented tooling
- Tenant-aware admin navigation patterns
- Super-admin and tenant-admin specific layout areas

### UX and Platform Quality

- Responsive component system with Radix-based primitives
- Toast feedback, tooltips, dialog flows, and modern table patterns
- React Query integration for server-state management
- Motion and polished landing-page interactions
- Cloudinary-backed image upload support

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- React Query
- Radix UI primitives
- Zod + React Hook Form
- Axios
- AWS Amplify liveness UI integration
- Cloudinary upload integration
- Leaflet / React Leaflet for map-based experiences
- Socket.IO client for real-time capabilities

## Environment Variables

Create a local environment file before running the app.

Example variables used by this project:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID=your_identity_pool_id
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

### Variable Guide

- `NEXT_PUBLIC_API_URL`: Base URL for the Univote backend API
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Cloudinary account name for media uploads
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`: Upload preset used for image submission flows
- `NEXT_PUBLIC_AWS_REGION`: AWS region used by the liveness integration
- `NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID`: Cognito identity pool for browser-based AWS access where required
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`: Map rendering and location UI support

## Getting Started

### Prerequisites

- Node.js 18+
- npm or a compatible package manager
- Running Univote backend instance

### Install

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

The app starts on `http://localhost:3000` by default.

### Production Build

```bash
npm run build
npm run start
```

## Available Scripts

- `npm run dev`: Start the Next.js development server
- `npm run build`: Build the production bundle
- `npm run start`: Start the production server
- `npm run lint`: Run ESLint checks

## Important Routes

These routes are visible directly from the app structure:

- `/`: Univote landing page
- `/tenant-application`: workspace request flow for universities
- `/application-status`: onboarding-status tracking page

The rest of the app is organized through components and feature-driven dashboard shells for student, tenant-admin, and super-admin experiences.

## Project Structure

```text
Univote-Web/
├── app/                     # App Router entrypoints, metadata, SEO, public routes
├── components/              # Shared UI and domain-specific components
│   ├── Landing/             # Marketing and onboarding pages
│   ├── Auth/                # Sign-in and password recovery UI
│   ├── dashboard/           # Dashboard widgets and analytics panels
│   ├── notifications/       # Notification UI
│   ├── support/             # Support desk components
│   ├── students/            # Student bootstrap and voting-facing UI
│   ├── tenants/             # Tenant admin shell components
│   ├── super-admin/         # Platform admin shell components
│   └── ui/                  # Design-system primitives
├── public/                  # Static assets, icons, and Univote logos
├── lib/                     # Utilities and helper functions
└── hooks/                   # Reusable frontend hooks
```

## Integrations

### Backend API

The frontend depends on the Univote backend for authentication, tenant application handling, election operations, announcements, notifications, support, voting, results, and dashboard metrics.

### Cloudinary

Cloudinary is used for media upload workflows such as profile and election-related assets.

### AWS

The app includes AWS liveness-related UI dependencies and browser configuration for biometric verification flows.

### Maps and Geofencing UI

Mapbox and Leaflet tooling support location-aware user experiences tied to geofenced voting rules.

## Deployment Notes

Before deployment, make sure to:

- point `NEXT_PUBLIC_API_URL` to the correct backend environment
- configure production Cloudinary credentials and presets
- configure the AWS liveness environment correctly
- add the correct production domain to backend CORS settings
- verify public assets such as logo files are available in the deployed build

## Recommended Documentation Pairing

This README documents the web application. For the API, services, authentication model, data flow, and backend operations, see the Univote backend README in `../Univote-Backend/README.md`.

## Vision

Univote is more than a voting interface. It is a campus election platform built to improve trust, accessibility, and operational control for universities running digital elections. The frontend reflects that goal by balancing security-sensitive workflows with a clean, understandable user experience for students and administrators alike.
