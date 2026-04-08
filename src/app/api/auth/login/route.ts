import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { name, password } = await req.json();

  if (!name || !password) {
    return NextResponse.json({ error: "Name and password required" }, { status: 400 });
  }

  if (password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const db = getDb();
  try {
    // Upsert user by name
    const existing = await db.query("SELECT * FROM users WHERE name = $1", [name]);
    let user;
    if (existing.rows.length > 0) {
      await db.query("UPDATE users SET last_login = NOW() WHERE id = $1", [existing.rows[0].id]);
      user = existing.rows[0];
    } else {
      const result = await db.query(
        "INSERT INTO users (name, role) VALUES ($1, 'recruiter') RETURNING *",
        [name]
      );
      user = result.rows[0];
    }

    const cookieStore = await cookies();
    cookieStore.set("sr_user", JSON.stringify({ id: user.id, name: user.name, role: user.role }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } });
  } finally {
    await db.end();
  }
}
