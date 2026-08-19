import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendBookingReminder } from "@/lib/email";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrowStart = new Date();
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      reminderSentAt: null,
      startTime: { gte: tomorrowStart, lte: tomorrowEnd },
    },
    include: { service: true },
  });

  let sent = 0;
  for (const booking of bookings) {
    try {
      await sendBookingReminder({
        to: booking.customerEmail,
        customerName: booking.customerName,
        serviceName: booking.service.name,
        startTime: booking.startTime,
      });
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSentAt: new Date() },
      });
      sent += 1;
    } catch (err) {
      console.error(`Failed to send reminder for booking ${booking.id}:`, err);
    }
  }

  return NextResponse.json({ checked: bookings.length, sent });
}
