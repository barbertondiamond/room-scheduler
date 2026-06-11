import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function isoDay(dateText: string) {
  return new Date(`${dateText}T00:00:00`);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const {
      name,
      email,
      teamGroup,
      roomId,
      date,
      startTime,
      durationBlocks,
      title,
      opponent,
      notes,
    } = body;

    if (!name || !teamGroup || !roomId || !date || !startTime || !durationBlocks) {
      return NextResponse.json(
        { success: false, message: "Missing required booking fields." },
        { status: 400 }
      );
    }

    const existingRecord = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: true,
        umpireRecord: true,
      },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { success: false, message: "Booking not found." },
        { status: 404 }
      );
    }

    const startTimeMinutes = timeToMinutes(startTime);
    const endTimeMinutes = startTimeMinutes + Number(durationBlocks) * 30;

    const bookingDate = isoDay(date);
    const nextDay = new Date(bookingDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const blackout = await prisma.roomBlackout.findFirst({
      where: {
        roomId,
        startDateTime: { lt: nextDay },
        endDateTime: { gt: bookingDate },
      },
    });

    if (blackout) {
      return NextResponse.json(
        {
          success: false,
          message: blackout.reason?.trim()
