
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";

    if (!name) {
      return NextResponse.json({ success: false, message: "Field name is required." }, { status: 400 });
    }

    const existing = await prisma.room.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });

    if (existing) {
      return NextResponse.json({ success: false, message: "A field with that name already exists." }, { status: 409 });
    }

    const room = await prisma.room.create({
      data: {
        name,
        description: description || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, room });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json({ success: false, message: "Failed to create field." }, { status: 500 });
  }
}
