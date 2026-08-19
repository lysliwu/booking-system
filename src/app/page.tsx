import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function Home() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 sm:px-8">
      <p className="text-sm font-medium tracking-wide text-rose-500 uppercase">
        Bloom Nails
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-stone-900">
        Book an appointment
      </h1>
      <p className="mt-3 text-stone-600">
        Pick a service below and choose a time that works for you.
      </p>

      <div className="mt-10 flex flex-col gap-4">
        {services.map((service) => (
          <Link
            key={service.id}
            href={`/book/${service.id}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-rose-100 bg-white p-5 transition-colors hover:border-rose-300"
          >
            <div>
              <h2 className="font-medium text-stone-900">{service.name}</h2>
              <p className="mt-1 text-sm text-stone-500">
                {service.description}
              </p>
              <p className="mt-1 text-xs text-stone-400">
                {service.durationMinutes} min
              </p>
            </div>
            <span className="shrink-0 font-medium text-rose-500">
              {formatPrice(service.priceCents)}
            </span>
          </Link>
        ))}
        {services.length === 0 && (
          <p className="text-sm text-stone-500">
            No services available yet.
          </p>
        )}
      </div>
    </div>
  );
}
