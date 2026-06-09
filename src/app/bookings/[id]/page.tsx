
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DeleteBookingButton from "@/components/booking/delete-booking-button";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatTimeLabel(totalMinutes: number) {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  return `${hours12}:${pad(minutes)} ${suffix}`;
}

function formatBookingDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; view?: string }>;
};

function detailRow(label: string, value: string) {
  return (
    <div style={{ padding: "0.9rem 0", borderTop: "1px solid #e2e8f0" }}>
      <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.25rem" }}>
        {label}
      </div>
      <div style={{ color: "#0f172a", fontWeight: 600 }}>{value || "—"}</div>
    </div>
  );
}

export default async function BookingDetailsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const returnDate = query.date;
  const returnView = query.view === "week" ? "week" : "day";

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { room: true },
  });

  if (!booking) {
    notFound();
  }

  const calendarHref = returnDate
    ? `/bookings?date=${returnDate}&view=${returnView}`
    : `/bookings?view=${returnView}`;
  const editHref = returnDate
    ? `/bookings/${id}/edit?date=${returnDate}&view=${returnView}`
    : `/bookings/${id}/edit?view=${returnView}`;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f5f7fb", padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #dbe3f0", borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)" }}>
          <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Booking Details</h1>
          <p style={{ marginTop: 0, color: "#4b5563", marginBottom: "1rem" }}>
            View and manage this field reservation.
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-start" }}>
            <Link href={calendarHref} style={{ display: "inline-block", padding: "0.65rem 1rem", backgroundColor: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "10px", color: "#1e3a8a", textDecoration: "none", fontWeight: 600 }}>
              Back to Calendar
            </Link>

            <Link href={editHref} style={{ display: "inline-block", padding: "0.65rem 1rem", backgroundColor: "#dbeafe", border: "1px solid #93c5fd", borderRadius: "10px", color: "#1d4ed8", textDecoration: "none", fontWeight: 600 }}>
              Edit Booking
            </Link>

            <DeleteBookingButton bookingId={booking.id} returnDate={returnDate} returnView={returnView} />
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", border: "1px solid #dbe3f0", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)" }}>
          {detailRow("Purpose", booking.title || "Booking")}
          {detailRow("Booked By", booking.bookedByName)}
          {detailRow("E-mail", booking.bookedByEmail || "")}
          {detailRow("Field", booking.room.name)}
          {detailRow("Date", formatBookingDate(booking.bookingDate))}
          {detailRow("Time", `${formatTimeLabel(booking.startTimeMinutes)} - ${formatTimeLabel(booking.endTimeMinutes)}`)}
          {detailRow("Notes", booking.notes || "")}
        </div>
      </div>
    </main>
  );
}
