import { apiRequest } from "./client";

export interface Event {
  id: string;
  name: string;
  description?: string;
  joinCode: string;
  photoCount: number;
  createdAt: string;
}

interface EventsResponse {
  success: boolean;
  events: Event[];
}

export interface CreateEventResponse {
  eventId: string;
  joinCode: string;
}

interface JoinEventResponse {
  success: boolean;
  eventId: string;
  eventName: string;
}

export interface EventStats {
  totalPhotos: number;
  totalFacesDetected: number;
  uniqueFaces: number;
  searchCount: number;
}

export interface JoinedEvent {
  id: string;
  name: string;
  joinedAt: string;
  createdAt: string;
}

// export async function getEvents(): Promise<Event[]> {
//   const data = await apiRequest<{
//     success: true;
//     events: Event[];
//   }>("/events");

//   return data.events;
// }

export async function getEvents(): Promise<Event[]> {
  const response = await apiRequest<EventsResponse>("/events", {
    method: "GET",
  });

  return response.events;
}

export async function createEvent(
  name: string,
  description: string,
): Promise<CreateEventResponse> {
  const data = await apiRequest<{
    success: true;
    eventId: string;
    joinCode: string;
  }>("/events", {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
    }),
  });

  return {
    eventId: data.eventId,
    joinCode: data.joinCode,
  };
}

export async function deleteEvent(eventId: string): Promise<void> {
  await apiRequest(`/events/${eventId}`, {
    method: "DELETE",
  });
}

// export async function joinEvent(joinCode: string): Promise<JoinEventResponse> {
//   const data = await apiRequest<{
//     success: true;
//     eventId: string;
//     name: string;
//   }>("/events/join", {
//     method: "POST",
//     body: JSON.stringify({
//       joinCode,
//     }),
//   });

//   return {
//     eventId: data.eventId,
//     name: data.name,
//   };
// }

export async function joinEvent(joinCode: string): Promise<JoinEventResponse> {
  return apiRequest<JoinEventResponse>("/events/join", {
    method: "POST",
    body: JSON.stringify({
      joinCode,
    }),
  });
}

export async function getEventStats(eventId: string): Promise<EventStats> {
  const data = await apiRequest<{
    success: true;
    stats: EventStats;
  }>(`/events/${eventId}/stats`);

  return data.stats;
}

export async function getJoinedEvents(): Promise<JoinedEvent[]> {
  const response = await apiRequest<{
    success: boolean;
    events: JoinedEvent[];
  }>("/events/joined", {
    method: "GET",
  });

  return response.events;
}
