
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RoomBlackoutManager from "@/components/admin/room-blackout-manager";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminBlackoutsPage() {
  const [rooms, blackouts] = await Promise.all([
    prisma.room.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.roomBlackout.findMany({
      include: { room: true },
      orderBy: [{ startDateTime: "asc" }, { roomId: "asc" }],
    }),
  ]);

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f5f7fb", padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #dbe3f0", borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)" }}>
          <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Field Blackouts</h1>
          <p style={{ marginTop: 0, color: "#4b5563", marginBottom: "1rem" }}>
            Black out selected fields for whole days. A blackout will only be created if none of the selected fields already have bookings on that day.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/admin" style={{ display: "inline-block", padding: "0.65rem 1rem", backgroundColor: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "10px", color: "#1e3a8a", textDecoration: "none", fontWeight: 600 }}>
              Back to Admin
            </Link>
            <Link href={`/bookings?date=${toDateInputValue(new Date())}&view=week`} style={{ display: "inline-block", padding: "0.65rem 1rem", backgroundColor: "#dbeafe", border: "1px solid #93c5fd", borderRadius: "10px", color: "#1d4ed8", textDecoration: "none", fontWeight: 600 }}>
              Open Weekly Calendar
            </Link>
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", border: "1px solid #dbe3f0", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)" }}>
          <RoomBlackoutManager
            rooms={rooms.map((room) => ({
              id: room.id,
              name: room.name,
              description: room.description || "",
            }))}
            items={blackouts.map((item) => ({
              id: item.id,
              roomName: item.room.name,
              dateValue: toDateInputValue(item.startDateTime),
              displayDate: formatDate(item.startDateTime),
              reason: item.reason || "",
            }))}
          />
        </div>
      </div>
    </main>
  );
}
