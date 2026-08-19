import { getBusyIntervals } from "@/lib/google-calendar";
import { prisma } from "@/lib/db";

const BUSINESS_HOURS = { startHour: 9, endHour: 18 };
const SLOT_STEP_MINUTES = 30;
const CLOSED_WEEKDAYS = [0]; // Sunday

export type Slot = { start: Date; end: Date };

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export async function getAvailableSlots(
  date: Date,
  durationMinutes: number,
): Promise<Slot[]> {
  if (CLOSED_WEEKDAYS.includes(date.getDay())) {
    return [];
  }

  const dayStart = new Date(date);
  dayStart.setHours(BUSINESS_HOURS.startHour, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(BUSINESS_HOURS.endHour, 0, 0, 0);

  const [busyIntervals, existingBookings] = await Promise.all([
    getBusyIntervals(dayStart.toISOString(), dayEnd.toISOString()),
    prisma.booking.findMany({
      where: {
        status: "confirmed",
        startTime: { gte: dayStart, lt: dayEnd },
      },
    }),
  ]);

  const busyRanges = [
    ...busyIntervals.map((b) => ({
      start: new Date(b.start),
      end: new Date(b.end),
    })),
    ...existingBookings.map((b) => ({ start: b.startTime, end: b.endTime })),
  ];

  const slots: Slot[] = [];
  const now = new Date();

  for (
    let cursor = new Date(dayStart);
    cursor.getTime() + durationMinutes * 60_000 <= dayEnd.getTime();
    cursor = new Date(cursor.getTime() + SLOT_STEP_MINUTES * 60_000)
  ) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + durationMinutes * 60_000);

    if (slotStart < now) continue;

    const isBusy = busyRanges.some((b) =>
      overlaps(slotStart, slotEnd, b.start, b.end),
    );
    if (!isBusy) {
      slots.push({ start: slotStart, end: slotEnd });
    }
  }

  return slots;
}
