
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await prisma.roomBlackout.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting room blackout:", error);
    return NextResponse.json({ success: false, message: "Failed to delete blackout." }, { status: 500 });
  }
}
