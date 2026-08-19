import { google } from "googleapis";

function hasRealCredentials() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN,
  );
}

function getAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  const client = new google.auth.OAuth2(clientId, clientSecret);
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

function getCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID ?? "primary";
}

export type BusyInterval = { start: string; end: string };

export async function getBusyIntervals(
  timeMinISO: string,
  timeMaxISO: string,
): Promise<BusyInterval[]> {
  if (!hasRealCredentials()) {
    console.warn(
      "[mock] No Google Calendar credentials set — treating the whole day as open.",
    );
    return [];
  }

  const auth = getAuthClient();
  const calendar = google.calendar({ version: "v3", auth });
  const calendarId = getCalendarId();

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMinISO,
      timeMax: timeMaxISO,
      items: [{ id: calendarId }],
    },
  });

  const busy = response.data.calendars?.[calendarId]?.busy ?? [];
  return busy
    .filter((b) => b.start && b.end)
    .map((b) => ({ start: b.start as string, end: b.end as string }));
}

export async function createCalendarEvent(params: {
  summary: string;
  description?: string;
  startISO: string;
  endISO: string;
  attendeeEmail: string;
}): Promise<string> {
  if (!hasRealCredentials()) {
    const mockId = `mock-event-${Date.now()}`;
    console.warn(
      `[mock] No Google Calendar credentials set — not actually creating an event. Fake id: ${mockId}`,
    );
    return mockId;
  }

  const auth = getAuthClient();
  const calendar = google.calendar({ version: "v3", auth });
  const calendarId = getCalendarId();

  const response = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: params.summary,
      description: params.description,
      start: { dateTime: params.startISO },
      end: { dateTime: params.endISO },
      attendees: [{ email: params.attendeeEmail }],
    },
  });

  if (!response.data.id) {
    throw new Error("Google Calendar did not return an event id.");
  }
  return response.data.id;
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  if (!hasRealCredentials()) {
    console.warn(
      `[mock] No Google Calendar credentials set — not actually deleting event ${eventId}.`,
    );
    return;
  }

  const auth = getAuthClient();
  const calendar = google.calendar({ version: "v3", auth });
  const calendarId = getCalendarId();

  await calendar.events.delete({ calendarId, eventId });
}
