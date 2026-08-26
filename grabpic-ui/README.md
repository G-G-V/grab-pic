# GrabPic Frontend

React + TypeScript frontend for GrabPic, an AI-powered event photo discovery platform.

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- shadcn/ui
- Framer Motion

## Features

### Organizer

- Create and manage events
- Generate event join codes
- Upload event photos directly to S3 using presigned URLs
- Monitor photo processing
- View event statistics
- Delete events

### Attendee

- Join events using organizer-provided codes
- Upload or capture a selfie
- Search event photos using AI face recognition
- View matched photos
- Download individual photos
- Download multiple matched photos as a ZIP

## Development

Install dependencies:

```bash
npm run build

npm install
```

Start the development server:

npm run dev

Create a production build:

npm run build

Preview the production build:

npm run preview
Backend

The frontend communicates with the GrabPic backend API.

Configure the API base URL using the frontend environment configuration used by src/api/client.ts.

Architecture

Organizer photo uploads use presigned S3 URLs, allowing image files to be transferred directly between the browser and object storage without routing the image bytes through the Node.js backend.

Attendee photo search sends the selfie to the backend, which coordinates the face-recognition pipeline and returns matched photo metadata and presigned S3 URLs.

Bulk downloads are handled through the backend ZIP-download endpoint.
