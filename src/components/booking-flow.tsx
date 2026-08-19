"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";

type Service = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
};

type Slot = { start: string; end: string };

function nextDays(count: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    days.push(new Date(today.getTime() + i * 24 * 60 * 60 * 1000));
  }
  return days;
}

export default function BookingFlow({ service }: { service: Service }) {
  const [selectedDate, setSelectedDate] = useState<Date>(nextDays(1)[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    setSelectedSlot(null);
    setLoadingSlots(true);
    setError(null);
    const dateParam = format(selectedDate, "yyyy-MM-dd");
    fetch(`/api/availability?serviceId=${service.id}&date=${dateParam}`)
      .then((res) => res.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setError("Couldn't load availability. Try again."))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, service.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          startISO: selectedSlot.start,
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Booking failed.");
      }

      setConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed && selectedSlot) {
    return (
      <div className="rounded-xl border border-rose-100 bg-white p-8 text-center">
        <p className="text-sm font-medium tracking-wide text-rose-500 uppercase">
          Confirmed
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-stone-900">
          You&apos;re booked!
        </h1>
        <p className="mt-3 text-stone-600">
          {service.name} on{" "}
          {format(new Date(selectedSlot.start), "EEEE, MMMM d 'at' h:mm a")}
        </p>
        <p className="mt-1 text-sm text-stone-500">
          A confirmation email is on its way to {form.email}.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-rose-500 underline underline-offset-4"
        >
          ← Back to services
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/"
        className="text-sm text-stone-500 underline underline-offset-4"
      >
        ← Back to services
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-stone-900">
        {service.name}
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        {service.durationMinutes} min · ${(service.priceCents / 100).toFixed(2)}
      </p>

      <div className="mt-8">
        <p className="mb-3 text-sm font-medium text-stone-700">Pick a day</p>
        <div className="flex flex-wrap gap-2">
          {nextDays(14).map((day) => {
            const isSelected =
              format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? "border-rose-400 bg-rose-500 text-white"
                    : "border-rose-100 bg-white text-stone-700 hover:border-rose-300"
                }`}
              >
                {format(day, "EEE d")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-sm font-medium text-stone-700">
          Pick a time
        </p>
        {loadingSlots && (
          <p className="text-sm text-stone-400">Loading times...</p>
        )}
        {!loadingSlots && slots.length === 0 && (
          <p className="text-sm text-stone-400">
            No times available this day. Try another date.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => {
            const isSelected = selectedSlot?.start === slot.start;
            return (
              <button
                key={slot.start}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? "border-rose-400 bg-rose-500 text-white"
                    : "border-rose-100 bg-white text-stone-700 hover:border-rose-300"
                }`}
              >
                {format(new Date(slot.start), "h:mm a")}
              </button>
            );
          })}
        </div>
      </div>

      {selectedSlot && (
        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-4 rounded-xl border border-rose-100 bg-white p-6"
        >
          <p className="text-sm font-medium text-stone-700">Your details</p>
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm outline-rose-300"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm outline-rose-300"
          />
          <input
            required
            type="tel"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm outline-rose-300"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
          >
            {submitting ? "Booking..." : "Confirm booking"}
          </button>
        </form>
      )}
    </div>
  );
}
