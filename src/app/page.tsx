import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Barberton Diamond Sports Field Scheduler</h1>
      <p>Welcome to the field scheduling system.</p>

      <ul style={{ lineHeight: "2" }}>
        <li>
          <Link href="/book">Go to Book a Field</Link>
        </li>
        <li>
          <Link href="/bookings">View Bookings Calendar</Link>
        </li>
      </ul>
    </main>
  );
}