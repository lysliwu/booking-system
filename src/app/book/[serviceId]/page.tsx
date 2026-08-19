import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import BookingFlow from "@/components/booking-flow";

export const dynamic = "force-dynamic";

export default async function BookServicePage({
  params,
}: PageProps<"/book/[serviceId]">) {
  const { serviceId } = await params;
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service || !service.active) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 sm:px-8">
      <BookingFlow
        service={{
          id: service.id,
          name: service.name,
          description: service.description,
          durationMinutes: service.durationMinutes,
          priceCents: service.priceCents,
        }}
      />
    </div>
  );
}
