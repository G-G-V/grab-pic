export interface User {
  id: string;
  email: string;
  role: "organizer" | "attendee";
}

export interface Event {
  id: string;
  name: string;
  description: string;
  organizerId: string;
  joinCode: string;
  photoCount: number;
  createdAt: string;
}

export interface Photo {
  id: string;
  eventId: string;
  url: string;
  processingStatus: "pending" | "processed" | "failed";
  uploadedAt: string;
}

export interface SearchMatch {
  photoId: string;
  imageUrl: string;
  similarityScore: number;
}

export interface EventStats {
  totalPhotos: number;
  totalFacesDetected: number;
  uniqueFaces: number;
  searchCount: number;
}

export const mockUser: User = {
  id: "u1",
  email: "john@example.com",
  role: "organizer",
};

export const mockEvents: Event[] = [
  {
    id: "e1",
    name: "Tech Fest 2026",
    description: "Annual technology festival",
    organizerId: "u1",
    joinCode: "TF2026",
    photoCount: 1247,
    createdAt: "2026-02-15T10:00:00Z",
  },
  {
    id: "e2",
    name: "Summer Gala Night",
    description: "Charity gala event",
    organizerId: "u1",
    joinCode: "SGN26",
    photoCount: 832,
    createdAt: "2026-01-20T18:00:00Z",
  },
  {
    id: "e3",
    name: "Product Launch 3.0",
    description: "New product reveal",
    organizerId: "u1",
    joinCode: "PL300",
    photoCount: 456,
    createdAt: "2026-03-01T09:00:00Z",
  },
  {
    id: "e4",
    name: "Company Retreat",
    description: "Team building retreat in the mountains",
    organizerId: "u1",
    joinCode: "CR26X",
    photoCount: 2100,
    createdAt: "2025-12-10T08:00:00Z",
  },
];

const photoUrls = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop",
];

export const mockPhotos: Photo[] = photoUrls.map((url, i) => ({
  id: `p${i + 1}`,
  eventId: "e1",
  url,
  processingStatus: i < 8 ? "processed" : i < 10 ? "pending" : "failed",
  uploadedAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

export const mockSearchResults: SearchMatch[] = [
  { photoId: "p1", imageUrl: photoUrls[0], similarityScore: 0.95 },
  { photoId: "p3", imageUrl: photoUrls[2], similarityScore: 0.89 },
  { photoId: "p5", imageUrl: photoUrls[4], similarityScore: 0.82 },
  { photoId: "p7", imageUrl: photoUrls[6], similarityScore: 0.76 },
  { photoId: "p9", imageUrl: photoUrls[8], similarityScore: 0.71 },
  { photoId: "p11", imageUrl: photoUrls[10], similarityScore: 0.65 },
];

export const mockEventStats: EventStats = {
  totalPhotos: 4635,
  totalFacesDetected: 8420,
  uniqueFaces: 1230,
  searchCount: 3890,
};
