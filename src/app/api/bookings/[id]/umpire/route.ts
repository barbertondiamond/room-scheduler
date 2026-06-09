
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const umpire = typeof body.umpire === "string" ? body.umpire.trim() : "";

    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { success: false, message: "Booking not found." },
        { status: 404 }
      );
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { umpire: umpire || null },
      include: { room: true },
    });

    const prismaWithAudit = prisma as typeof prisma & {
      auditLog?: {
        create: (args: {
          data: {
            entityType: string;
            entityId: string;
            action: string;
            detailsJson: Record<string, unknown>;
          };
        }) => Promise<unknown>;
      };
    };

    if (prismaWithAudit.auditLog) {
      await prismaWithAudit.auditLog.create({
        data: {
          entityType: "Booking",
          entityId: booking.id,
          action: "UPDATE",
          detailsJson: {
            before: {
              umpire: existingBooking.umpire ?? null,
              title: existingBooking.title,
              bookingDate: existingBooking.bookingDate.toISOString(),
              startTimeMinutes: existingBooking.startTimeMinutes,
              roomName: existingBooking.room?.name ?? null,
            },
            after: {
              umpire: booking.umpire ?? null,
              title: booking.title,
              bookingDate: booking.bookingDate.toISOString(),
              startTimeMinutes: booking.startTimeMinutes,
              roomName: booking.room?.name ?? null,
            },
          },
        },
      });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Error updating umpire:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update umpire." },
      { status: 500 }
    );
  }
}
