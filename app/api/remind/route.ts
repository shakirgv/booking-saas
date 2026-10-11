import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// Admin client: bypasses RLS, server only
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Normal client: used only to check who is logged in
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

export async function POST(request: Request) {
  // 1. Identify the user from the login token
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  const { data: userData, error: userError } =
    await supabaseAuth.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Invalid user" }, { status: 401 });
  }

  // 2. Load the appointment, but only if it belongs to this user
  const { appointmentId } = await request.json();
  const { data: appointment } = await supabaseAdmin
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .eq("user_id", userData.user.id)
    .single();

  if (!appointment) {
    return NextResponse.json(
      { error: "Appointment not found" },
      { status: 404 },
    );
  }
  if (!appointment.client_email) {
    return NextResponse.json(
      { error: "This appointment has no client email" },
      { status: 400 },
    );
  }

  // 3. Send the email
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const when = new Date(appointment.starts_at).toUTCString();

  const { error } = await resend.emails.send({
    from: "Slotly <onboarding@resend.dev>",
    to: [appointment.client_email],
    subject: `Reminder: ${appointment.service}`,
    html: `<p> Hi ${appointment.client_name},</p>
        <p>This is a reminder about your <b>${appointment.service}</b> appointment on ${when}.</p>`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ sent: true });
}
