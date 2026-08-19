import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getBusyIntervals, createCalendarEvent } from "@/lib/google-calendar";
import { sendBookingConfirmation } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { serviceId, startISO, customerName, customerEmail, customerPhone } =
    body ?? {};

  if (
    !serviceId ||
    !startISO ||
    !customerName ||
    !customerEmail ||
    !customerPhone
  ) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });
  if (!service || !service.active) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }

  const startTime = new Date(startISO);
  if (Number.isNaN(startTime.getTime())) {
    return NextResponse.json({ error: "Invalid start time." }, { status: 400 });
  }
  const endTime = new Date(
    startTime.getTime() + service.durationMinutes * 60_000,
  );

  // Re-check for conflicts right before committing.
  const [dbConflict, busyIntervals] = await Promise.all([
    prisma.booking.findFirst({
      where: {
        status: "confirmed",
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    }),
    getBusyIntervals(startTime.toISOString(), endTime.toISOString()),
  ]);

  const calendarConflict = busyIntervals.some(
    (b) => new Date(b.start) < endTime && startTime < new Date(b.end),
  );

  if (dbConflict || calendarConflict) {
    return NextResponse.json(
      { error: "That time is no longer available. Please pick another." },
      { status: 409 },
    );
  }

  const eventId = await createCalendarEvent({
    summary: `${service.name} — ${customerName}`,
    description: `Booked via website.\nPhone: ${customerPhone}`,
    startISO: startTime.toISOString(),
    endISO: endTime.toISOString(),
    attendeeEmail: customerEmail,
  });

  const booking = await prisma.booking.create({
    data: {
      serviceId: service.id,
      customerName,
      customerEmail,
      customerPhone,
      startTime,
      endTime,
      googleCalendarEventId: eventId,
    },
  });

  try {
    await sendBookingConfirmation({
      to: customerEmail,
      customerName,
      serviceName: service.name,
      startTime,
    });
  } catch (err) {
    console.error("Failed to send confirmation email:", err);
  }

  return NextResponse.json({ booking }, { status: 201 });
}
