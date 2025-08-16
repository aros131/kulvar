export interface EventDTO {
  _id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  notes?: string;
  programId?: string;
  sessionId?: string;
  status?: 'planned' | 'completed' | 'missed' | 'canceled';
}

const API = (process.env.NEXT_PUBLIC_API_URL || 'https://kulvar-qb7t.onrender.com').replace(/\/+$/, '');

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function fetchEvents(fromISO: string, toISO: string): Promise<EventDTO[]> {
  const res = await fetch(`${API}/events?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to load events');
  const data = await res.json();
  return data.events;
}

export async function createEvent(payload: Partial<EventDTO>): Promise<EventDTO> {
  const res = await fetch(`${API}/events`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create event');
  const data = await res.json();
  return data.event;
}

export async function updateEvent(id: string, payload: Partial<EventDTO>): Promise<EventDTO> {
  const res = await fetch(`${API}/events/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update event');
  const data = await res.json();
  return data.event;
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await fetch(`${API}/events/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete event');
}

export async function completeEvent(id: string): Promise<EventDTO> {
  const res = await fetch(`${API}/events/${id}/complete`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to complete event');
  const data = await res.json();
  return data.event;
}

