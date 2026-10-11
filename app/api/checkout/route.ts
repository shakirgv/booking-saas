import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  // 1. Read the login token sent by the browser
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // 2. Ask Supabase who this user is
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ error: "Invalid user" }, { status: 401 });
  }

  // 3. Create the Stripe payment page
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    customer_email: data.user.email,
    client_reference_id: data.user.id,
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
  });

  // 4. Send the payment page address back to the browser
  return NextResponse.json({ url: session.url });
}