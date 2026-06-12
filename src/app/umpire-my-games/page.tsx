import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MyGamesUmpirePicker from "@/components/umpire/my-games-umpire-picker";

type PageProps = {
  searchParams: Promise<{
    umpireId?: string;
  }>;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDayHeading(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeRange(startMinutes: number, endMinutes: number) {
  function formatMinutes(totalMinutes: number) {
    const hours24 = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const suffix = hours24 >= 12 ? "PM" : "AM";
    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;
    return `${hours12}:${pad(minutes)} ${suffix}`;
  }

  return `${formatMinutes(startMinutes)} - ${formatMinutes(endMinutes)}`;
}

function inferSport(ageGroup: string | null | undefined) {
  return ageGroup?.toLowerCase().includes("softball") ? "softball" : "baseball";
}

function isTeeBall(ageGroup: string | null | undefined) {
  return ageGroup?.toLowerCase().includes("tee ball") ?? false;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UmpireMyGamesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requestedUmpireId = typeof params.umpireId === "string" ? params.umpireId : "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [allUpcomingAssignedBookings, allActiveUmpires] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: "ACTIVE",
        umpireId: { not: null },
        bookingDate: { gte: today },
        title: { in: ["Game", "Tournament", "Scrimmage"] },
      },
      include: {
        room: true,
        team: true,
        umpireRecord: true,
      },
      orderBy: [{ bookingDate: "asc" }, { startTimeMinutes: "asc" }],
    }),
    prisma.umpire.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const eligibleBookings = allUpcomingAssignedBookings.filter((booking) => {
    return !isTeeBall(booking.team?.ageGroup);
  });

  const umpireIdsWithGames = new Set(
    eligibleBookings
      .map((booking) => booking.umpireId)
      .filter((value): value is string => typeof value === "string" && value.length > 0)
  );

  const availableUmpires = allActiveUmpires.filter((umpire) =>
    umpireIdsWithGames.has(umpire.id)
  );

  const selectedUmpire = requestedUmpireId
    ? availableUmpires.find((umpire) => umpire.id === requestedUmpireId) ?? null
    : null;

  const selectedUmpireId = selectedUmpire?.id ?? "";

  const filteredBookings = selectedUmpireId
    ? eligibleBookings.filter((booking) => booking.umpireId === selectedUmpireId)
    : [];

  const groups = filteredBookings.reduce<
    Array<{ key: string; date: Date; items: typeof filteredBookings }>
  >((acc, booking) => {
    const key = dateKey(booking.bookingDate);
    const existing = acc.find((g) => g.key === key);

    if (existing) {
      existing.items.push(booking);
    } else {
      acc.push({
        key,
        date: booking.bookingDate,
        items: [booking],
      });
    }

    return acc;
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f7fb",
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #dbe3f0",
            borderRadius: "16px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
              alignItems: "start",
            }}
          >
            <div>
              <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
                My Assigned Games
              </h1>
              <p style={{ margin: 0, color: "#4b5563" }}>
                Choose an umpire to view upcoming assigned games.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link
                href="/umpire-assignments"
                style={{
                  display: "inline-block",
                  padding: "0.65rem 1rem",
                  backgroundColor: "#eef2ff",
                  border: "1px solid #c7d2fe",
                  borderRadius: "10px",
                  color: "#1e3a8a",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Back to Unassigned Games
              </Link>
            </div>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <MyGamesUmpirePicker
              umpires={availableUmpires.map((umpire) => ({
                id: umpire.id,
                name: umpire.name,
              }))}
              selectedUmpireId={selectedUmpireId}
            />
          </div>

          {selectedUmpire && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.85rem 1rem",
                borderRadius: "12px",
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
                color: "#1e3a8a",
                fontWeight: 700,
              }}
            >
              Viewing upcoming games for {selectedUmpire.name}
            </div>
          )}
        </div>

        {availableUmpires.length === 0 ? (
          <div
            style={{
              padding: "1rem",
              border: "1px dashed #cbd5e1",
              borderRadius: "12px",
              color: "#64748b",
              backgroundColor: "#ffffff",
            }}
          >
            No active umpires currently have upcoming assigned games.
          </div>
        ) : !selectedUmpireId ? (
          <div
            style={{
              padding: "1rem",
              border: "1px dashed #cbd5e1",
              borderRadius: "12px",
              color: "#64748b",
              backgroundColor: "#ffffff",
            }}
          >
            Select an umpire to view assigned games.
          </div>
        ) : groups.length === 0 ? (
          <div
            style={{
              padding: "1rem",
              border: "1px dashed #cbd5e1",
              borderRadius: "12px",
              color: "#64748b",
              backgroundColor: "#ffffff",
            }}
          >
            No upcoming assigned games found for this umpire.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1.5rem" }}>
            {groups.map((group) => (
              <section key={group.key}>
                <h2
                  style={{
                    marginBottom: "0.9rem",
                    fontSize: "1.45rem",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {formatDayHeading(group.date)}
                </h2>

                <div style={{ display: "grid", gap: "0.85rem" }}>
                  {group.items.map((booking) => {
                    const sport = inferSport(booking.team?.ageGroup);
                    const matchup = booking.opponent?.trim()
                      ? `${booking.team?.teamName || "—"} vs. ${booking.opponent}`
                      : booking.team?.teamName || "—";

                    return (
                      <div
                        key={booking.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: "14px",
                          padding: "1rem",
                          backgroundColor: "#ffffff",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gap: "1rem",
                            gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.1fr)",
                            alignItems: "start",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 800, color: "#0f172a" }}>
                              {booking.team?.ageGroup || "—"}
                            </div>
                            <div
                              style={{
                                color: "#334155",
                                marginTop: "0.2rem",
                                fontWeight: 600,
                              }}
                            >
                              {matchup}
                            </div>
                            <div
                              style={{
                                color: "#64748b",
                                marginTop: "0.2rem",
                                fontSize: "0.92rem",
                              }}
                            >
                              {formatTimeRange(
                                booking.startTimeMinutes,
                                booking.endTimeMinutes
                              )}
                            </div>
                          </div>

                          <div>
                            <div style={{ color: "#334155", fontWeight: 700 }}>
                              {booking.room.name}
                            </div>
                            <div style={{ color: "#64748b", marginTop: "0.2rem" }}>
                              Sport: {sport === "softball" ? "Softball" : "Baseball"}
                            </div>
                            <div
                              style={{
                                marginTop: "0.2rem",
                                fontWeight: 600,
                                color: "#475569",
                              }}
                            >
                              Assigned: {booking.umpireRecord?.name || "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}