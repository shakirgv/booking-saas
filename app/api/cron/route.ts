import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// Admin client: bypasses RLS, server only
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: Request) {
  // 1. Only allow callers that know the secret
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Find appointments in the next 24 hours that have not been reminded yet
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data: appointments, error } = await supabaseAdmin
    .from("appointments")
    .select("*")
    .eq("reminder_sent", false)
    .not("client_email", "is", null)
    .gte("starts_at", now.toISOString())
    .lte("starts_at", in24h.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3. Send an email for each one and mark it as sent
  const resend = new Resend(process.env.RESEND_API_KEY!);
  let sent = 0;

  for (const a of appointments ?? []) {
    const when = new Date(a.starts_at).toLocaleString("en-GB", {
      timeZone: "Asia/Baku",
      dateStyle: "full",
      timeStyle: "short",
    });

    const { error: sendError } = await resend.emails.send({
      from: "Slotly <onboarding@resend.dev>",
      to: [a.client_email],
      subject: `Reminder: ${a.service}`,
      html: `<p>Hi ${a.client_name},</p>
            <p>This is a reminder about your <b>${a.service}</b> appointment on ${when} (Baku time).</p>`,
    });

    if (!sendError) {
      await supabaseAdmin
        .from("appointments")
        .update({ reminder_sent: true })
        .eq("id", a.id);
      sent++;
    }
  }

  return NextResponse.json({ sent });
}
