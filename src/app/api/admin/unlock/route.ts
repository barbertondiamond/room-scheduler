import { NextResponse } from "next/server";

const ADMIN_PASSCODE = "BDSports";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { passcode } = body;

    if (passcode !== ADMIN_PASSCODE) {
      return NextResponse.json(
        {
          success: false,
          message: "Incorrect passcode.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Access granted.",
    });

    response.cookies.set("admin_access", "granted", {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch (error) {
    console.error("Admin unlock error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process passcode.",
      },
      { status: 500 }
    );
  }
}