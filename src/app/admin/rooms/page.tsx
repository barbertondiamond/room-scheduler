
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import RoomManagementActions from "@/components/admin/room-management-actions";

export default async function AdminRoomsPage() {
  const rooms = await prisma.room.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: { bookings: true },
      },
    },
  });

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f5f7fb", padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #dbe3f0", borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)" }}>
          <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Manage Fields</h1>
          <p style={{ marginTop: 0, color: "#4b5563", marginBottom: "1rem" }}>
            Add new fields, activate or deactivate existing ones, and delete fields if necessary.
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/admin" style={{ display: "inline-block", padding: "0.65rem 1rem", backgroundColor: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "10px", color: "#1e3a8a", textDecoration: "none", fontWeight: 600 }}>
              Back to Admin
            </Link>
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", border: "1px solid #dbe3f0", borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)" }}>
          <h2 style={{ marginTop: 0 }}>Add New Field</h2>
          <RoomManagementActions mode="create" />
        </div>

        <div style={{ backgroundColor: "#ffffff", border: "1px solid #dbe3f0", borderRadius: "16px", padding: "1rem", boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)", overflowX: "auto" }}>
          {rooms.length === 0 ? (
            <div style={{ padding: "1rem", border: "1px dashed #cbd5e1", borderRadius: "12px", color: "#64748b" }}>
              No fields have been created yet.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "980px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <th style={{ textAlign: "left", padding: "0.85rem 0.75rem", borderBottom: "1px solid #dbe3f0", color: "#334155" }}>Field</th>
                  <th style={{ textAlign: "left", padding: "0.85rem 0.75rem", borderBottom: "1px solid #dbe3f0", color: "#334155" }}>Description</th>
                  <th style={{ textAlign: "left", padding: "0.85rem 0.75rem", borderBottom: "1px solid #dbe3f0", color: "#334155" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "0.85rem 0.75rem", borderBottom: "1px solid #dbe3f0", color: "#334155" }}>Booking Count</th>
                  <th style={{ textAlign: "left", padding: "0.85rem 0.75rem", borderBottom: "1px solid #dbe3f0", color: "#334155" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room, index) => (
                  <tr key={room.id} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#fbfdff" }}>
                    <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid #eef2f7", fontWeight: 700, color: "#0f172a" }}>
                      {room.name}
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid #eef2f7", color: "#475569" }}>
                      {room.description?.trim() ? room.description : "—"}
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid #eef2f7" }}>
                      <span style={{ display: "inline-block", padding: "0.35rem 0.65rem", borderRadius: "999px", backgroundColor: room.isActive ? "#dcfce7" : "#fee2e2", color: room.isActive ? "#166534" : "#991b1b", fontWeight: 700, fontSize: "0.82rem" }}>
                        {room.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid #eef2f7", color: "#334155" }}>
                      {room._count.bookings}
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid #eef2f7" }}>
                      <RoomManagementActions
                        mode="manage"
                        room={{
                          id: room.id,
                          name: room.name,
                          description: room.description,
                          isActive: room.isActive,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
