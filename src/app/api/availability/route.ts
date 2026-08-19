import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAvailableSlots } from "@/lib/availability";

export async function GET(request: NextRequest) {
  const serviceId = request.nextUrl.searchParams.get("serviceId");
  const dateParam = request.nextUrl.searchParams.get("date");

  if (!serviceId || !dateParam) {
    return NextResponse.json(
      { error: "serviceId and date are required" },
      { status: 400 },
    );
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });
  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const date = new Date(`${dateParam}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const slots = await getAvailableSlots(date, service.durationMinutes);
  return NextResponse.json({
    slots: slots.map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
    })),
  });
}
