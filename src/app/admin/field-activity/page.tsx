import React from "react";
import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    minEvents?: string;
    roomId?: string | string[];
  }>;
};

type ActivityDay = {
  dateValue: string;
  dateLabel: string;
  eventCount: number;
  gameCount: number;
  practiceCount: number;
  scrimmageCount: number;
  otherCount: number;
  fieldsUsed: Array<{
    id: string;
    name: string;
    address: string;
  }>;
  events: Array<{
    id: string;
    timeLabel: string;
    fieldName: string;
    fieldAddress: string;
    typeLabel: string;
    teamLabel: string;
    opponentLabel: string;
    href: string;
    sortStartMinutes: number;
  }>;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromDateInputValue(dateString: string) {
  return new Date(`${dateString}T00:00:00`);
}

function addDays(dateString: string, days: number) {
  const date = fromDateInputValue(dateString);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function getEasternTodayValue() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function isValidDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function dateSortValue(dateValue: string) {
  return fromDateInputValue(dateValue).getTime();
}

function formatDateHeading(dateValue: string) {
  return fromDateInputValue(dateValue).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeLabel(totalMinutes: number) {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;

  return `${hours12}:${pad(minutes)} ${suffix}`;
}

function formatTimeRange(startMinutes: number, endMinutes: number) {
  return `${formatTimeLabel(startMinutes)} - ${formatTimeLabel(endMinutes)}`;
}

function normalizeRoomIds(value: string | string[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function getBookingTypeLabel(title: string | null) {
  const trimmed = title?.trim();
  return trimmed || "Booking";
}

function getTeamLabel(booking: {
  title: string | null;
  team: {
    teamName: string | null;
  } | null;
}) {
  const bookingType = booking.title?.trim() || "";

  if (!booking.team && bookingType === "Other") {
    return "Admin reserved field";
  }

  return booking.team?.teamName || "No team";
}

function getOpponentLabel(opponent: string | null) {
  return opponent?.trim() || "";
}

export default async function AdminFieldActivityPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const todayValue = getEasternTodayValue();
  const defaultEndDate = addDays(todayValue, 60);

  const requestedStartDate =
    typeof params.startDate === "string" && isValidDateInput(params.startDate)
      ? params.startDate
      : todayValue;

  const requestedEndDate =
    typeof params.endDate === "string" && isValidDateInput(params.endDate)
      ? params.endDate
      : defaultEndDate;

  const selectedStartDate = requestedStartDate;
  const selectedEndDate =
    dateSortValue(requestedEndDate) < dateSortValue(requestedStartDate)
      ? requestedStartDate
      : requestedEndDate;

  const minEventsRaw = Number(params.minEvents);
  const selectedMinEvents =
    Number.isFinite(minEventsRaw) && minEventsRaw >= 1 ? Math.floor(minEventsRaw) : 2;

  const activeRooms = await prisma.room.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const requestedRoomIds = normalizeRoomIds(params.roomId);
  const activeRoomIds = new Set(activeRooms.map((room) => room.id));

  const selectedRoomIds =
    requestedRoomIds.length > 0
      ? requestedRoomIds.filter((roomId) => activeRoomIds.has(roomId))
      : activeRooms.map((room) => room.id);

  const startDate = fromDateInputValue(selectedStartDate);
  const endDateExclusive = fromDateInputValue(addDays(selectedEndDate, 1));

  const bookings =
    selectedRoomIds.length > 0
      ? await prisma.booking.findMany({
          where: {
            status: "ACTIVE",
            bookingDate: {
              gte: startDate,
              lt: endDateExclusive,
            },
            roomId: {
              in: selectedRoomIds,
            },
          },
          include: {
            room: true,
            team: true,
          },
          orderBy: [
            { bookingDate: "asc" },
            { startTimeMinutes: "asc" },
            { roomId: "asc" },
          ],
        })
      : [];

  const groupedByDate = new Map<string, ActivityDay>();

  for (const booking of bookings) {
    const dateValue = toDateInputValue(booking.bookingDate);
    const bookingType = getBookingTypeLabel(booking.title);
    const normalizedType = bookingType.toLowerCase();

    const existing = groupedByDate.get(dateValue);

    const day: ActivityDay =
      existing ||
      {
        dateValue,
        dateLabel: formatDateHeading(dateValue),
        eventCount: 0,
        gameCount: 0,
        practiceCount: 0,
        scrimmageCount: 0,
        otherCount: 0,
        fieldsUsed: [],
        events: [],
      };

    day.eventCount += 1;

    if (normalizedType === "game") {
      day.gameCount += 1;
    } else if (normalizedType === "practice") {
      day.practiceCount += 1;
    } else if (normalizedType === "scrimmage") {
      day.scrimmageCount += 1;
    } else {
      day.otherCount += 1;
    }

    if (!day.fieldsUsed.some((field) => field.id === booking.room.id)) {
      day.fieldsUsed.push({
        id: booking.room.id,
        name: booking.room.name,
        address: booking.room.address || "",
      });
    }

    day.events.push({
      id: booking.id,
      timeLabel: formatTimeRange(booking.startTimeMinutes, booking.endTimeMinutes),
      fieldName: booking.room.name,
      fieldAddress: booking.room.address || "",
      typeLabel: bookingType,
      teamLabel: getTeamLabel(booking),
      opponentLabel: getOpponentLabel(booking.opponent),
      href: `/bookings/${booking.id}?date=${dateValue}&view=day&from=admin`,
      sortStartMinutes: booking.startTimeMinutes,
    });

    groupedByDate.set(dateValue, day);
  }

  const activityDays = Array.from(groupedByDate.values())
    .filter((day) => day.eventCount >= selectedMinEvents)
    .sort((a, b) => dateSortValue(a.dateValue) - dateSortValue(b.dateValue))
    .map((day) => ({
      ...day,
      fieldsUsed: [...day.fieldsUsed].sort((a, b) => a.name.localeCompare(b.name)),
      events: [...day.events].sort((a, b) => {
        if (a.sortStartMinutes !== b.sortStartMinutes) {
          return a.sortStartMinutes - b.sortStartMinutes;
        }

        return a.fieldName.localeCompare(b.fieldName);
      }),
    }));

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f7fb",
        padding: "1rem",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <style>{`
        .activity-shell {
          max-width: 1200px;
          margin: 0 auto;
        }

        .activity-card {
          background-color: #ffffff;
          border: 1px solid #dbe3f0;
          border-radius: 16px;
          padding: 1.25rem;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
        }

        .activity-filter-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: end;
        }

        .activity-filter-field {
          display: grid;
          gap: 0.35rem;
        }

        .activity-label {
          font-weight: 700;
          color: #334155;
          font-size: 0.92rem;
        }

        .activity-input {
          width: 100%;
          padding: 0.7rem 0.8rem;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          background-color: #ffffff;
          color: #0f172a;
          box-sizing: border-box;
        }

        .activity-button {
          padding: 0.75rem 1rem;
          background-color: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .activity-room-grid {
          display: grid;
          gap: 0.6rem;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }

        .activity-room-option {
          display: flex;
          gap: 0.6rem;
          align-items: flex-start;
          border: 1px solid #dbe3f0;
          border-radius: 12px;
          background-color: #f8fafc;
          padding: 0.75rem 0.85rem;
          cursor: pointer;
        }

        .activity-day-list {
          display: grid;
          gap: 1rem;
        }

        .activity-day-card {
          border: 1px solid #dbe3f0;
          border-radius: 16px;
          background-color: #ffffff;
          overflow: hidden;
        }

        .activity-day-header {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          padding: 1rem;
          background-color: #f8fafc;
          border-bottom: 1px solid #dbe3f0;
        }

        .activity-day-title {
          margin: 0;
          color: #0f172a;
          font-size: 1.2rem;
          line-height: 1.3;
        }

        .activity-metric-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: 0.75rem;
        }

        .activity-pill {
          display: inline-block;
          padding: 0.35rem 0.6rem;
          border-radius: 999px;
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          font-weight: 700;
          font-size: 0.84rem;
        }

        .activity-fields {
          color: #475569;
          line-height: 1.45;
          font-size: 0.92rem;
          margin-top: 0.65rem;
        }

        .activity-event-list {
          display: grid;
          gap: 0.55rem;
          padding: 1rem;
        }

        .activity-event-link {
          display: grid;
          grid-template-columns: 130px 150px 130px minmax(220px, 1fr);
          gap: 0.75rem;
          align-items: center;
          padding: 0.75rem 0.85rem;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background-color: #ffffff;
          color: #0f172a;
          text-decoration: none;
        }

        .activity-event-link:hover {
          background-color: #eef2ff;
          border-color: #c7d2fe;
        }

        .activity-muted {
          color: #64748b;
          line-height: 1.4;
        }

        .activity-empty {
          padding: 1rem;
          border: 1px dashed #cbd5e1;
          border-radius: 12px;
          color: #64748b;
          background-color: #ffffff;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          main {
            padding: 0.75rem;
          }

          .activity-card {
            padding: 1rem;
            border-radius: 14px;
          }

          .activity-filter-grid {
            grid-template-columns: 1fr;
          }

          .activity-button {
            width: 100%;
          }

          .activity-day-header {
            flex-direction: column;
          }

          .activity-event-link {
            grid-template-columns: 1fr;
            gap: 0.25rem;
          }
        }
      `}</style>

      <div className="activity-shell">
        <div className="activity-card" style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1.9rem" }}>
            Field Activity Report
          </h1>

          <p
            style={{
              marginTop: 0,
              color: "#4b5563",
              lineHeight: 1.5,
              marginBottom: "1rem",
            }}
          >
            Find busy field days at a glance. This can help identify good days to open the
            concession stand.
          </p>

          <AdminNav todayValue={todayValue} />
        </div>

        <div className="activity-card" style={{ marginBottom: "1.5rem" }}>
          <form method="GET" style={{ display: "grid", gap: "1.25rem" }}>
            <div className="activity-filter-grid">
              <div className="activity-filter-field">
                <label className="activity-label" htmlFor="startDate">
                  Start date
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={selectedStartDate}
                  className="activity-input"
                />
              </div>

              <div className="activity-filter-field">
                <label className="activity-label" htmlFor="endDate">
                  End date
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={selectedEndDate}
                  className="activity-input"
                />
              </div>

              <div className="activity-filter-field">
                <label className="activity-label" htmlFor="minEvents">
                  Minimum events
                </label>
                <input
                  id="minEvents"
                  name="minEvents"
                  type="number"
                  min="1"
                  defaultValue={selectedMinEvents}
                  className="activity-input"
                />
              </div>

              <button type="submit" className="activity-button">
                Load Report
              </button>
            </div>

            <div>
              <div className="activity-label" style={{ marginBottom: "0.6rem" }}>
                Fields to include
              </div>

              <div className="activity-room-grid">
                {activeRooms.map((room) => {
                  const checked = selectedRoomIds.includes(room.id);

                  return (
                    <label key={room.id} className="activity-room-option">
                      <input
                        type="checkbox"
                        name="roomId"
                        value={room.id}
                        defaultChecked={checked}
                        style={{ marginTop: "0.2rem" }}
                      />
                      <span>
                        <span
                          style={{
                            display: "block",
                            fontWeight: 700,
                            color: "#0f172a",
                          }}
                        >
                          {room.name}
                        </span>

                        {room.address && (
                          <span
                            style={{
                              display: "block",
                              color: "#64748b",
                              marginTop: "0.15rem",
                              fontSize: "0.88rem",
                              lineHeight: 1.35,
                            }}
                          >
                            {room.address}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </form>
        </div>



        {activityDays.length === 0 ? (
          <div className="activity-empty">
            No dates matched the selected filters. Try lowering the minimum event count,
            expanding the date range, or selecting more fields.
          </div>
        ) : (
          <div className="activity-day-list">
            {activityDays.map((day) => (
              <section key={day.dateValue} className="activity-day-card">
                <div className="activity-day-header">
                  <div>
                    <h2 className="activity-day-title">{day.dateLabel}</h2>

                    <div className="activity-metric-row">
                      <span className="activity-pill">{day.eventCount} events</span>
                      <span className="activity-pill">{day.gameCount} games</span>
                      <span className="activity-pill">{day.practiceCount} practices</span>
                      <span className="activity-pill">{day.scrimmageCount} scrimmages</span>
                      {day.otherCount > 0 && (
                        <span className="activity-pill">{day.otherCount} other</span>
                      )}
                    </div>

                    <div className="activity-fields">
                      <strong>Fields used:</strong>{" "}
                      {day.fieldsUsed.map((field) => field.name).join(", ")}
                    </div>
                  </div>

                  <div>
                    {React.createElement(
                      "a",
                      {
                        href: `/bookings?date=${day.dateValue}&view=day`,
                        style: {
                          display: "inline-block",
                          padding: "0.65rem 1rem",
                          backgroundColor: "#dbeafe",
                          border: "1px solid #93c5fd",
                          borderRadius: "10px",
                          color: "#1d4ed8",
                          textDecoration: "none",
                          fontWeight: 700,
                          textAlign: "center",
                        },
                      },
                      "Open Calendar Day"
                    )}
                  </div>
                </div>

                <details>
                  <summary
                    style={{
                      cursor: "pointer",
                      padding: "0.85rem 1rem",
                      fontWeight: 800,
                      color: "#334155",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    Show event details
                  </summary>

                  <div className="activity-event-list">
                    {day.events.map((event) =>
                      React.createElement(
                        "a",
                        {
                          key: event.id,
                          href: event.href,
                          className: "activity-event-link",
                        },
                        <div key={`${event.id}-time`} style={{ fontWeight: 700 }}>
                          {event.timeLabel}
                        </div>,

                        <div key={`${event.id}-field`}>
                          <div style={{ fontWeight: 700 }}>{event.fieldName}</div>
                          {event.fieldAddress && (
                            <div
                              className="activity-muted"
                              style={{ fontSize: "0.84rem" }}
                            >
                              {event.fieldAddress}
                            </div>
                          )}
                        </div>,

                        <div key={`${event.id}-type`} style={{ fontWeight: 700 }}>
                          {event.typeLabel}
                        </div>,

                        <div key={`${event.id}-team`}>
                          <div style={{ fontWeight: 700 }}>{event.teamLabel}</div>
                          {event.opponentLabel && (
                            <div className="activity-muted">
                              vs. {event.opponentLabel}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </details>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}