import Link from "next/link";

const features = [
  {
    title: "Simple scheduling",
    text: "Add, edit and delete appointments in seconds",
  },
  {
    title: "Private by design",
    text: "Every account only ever sees its own data",
  },
  {
    title: "Grow at your pace",
    text: "Start free and upgrade to Pro when you need more",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-5xl items-center justify-between p-6">
        <span className="text-xl font-bold">Slotly</span>
        <Link
          href="/login"
          className="rounded bg blue-500 px-4 text-sm font-medium"
        >
          Sign in
        </Link>
      </nav>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-5xl font-bold">Appointments, wihtout the chaos.</h1>
        <p className="mt-6 text-lg text-gray-400">
          Slotly helps you manage client bookings in one simple dashboard.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded bg-blue-500 px-6 py-3 font-medium"
        >
          Get started free
        </Link>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded border border-gray-700 p-6">
            <h3 className="text-lg font-bold">{f.title}</h3>
            <p className="mt-2 text-gray-400">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold">Pricing</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded border border-gray-700 p-6">
            <h3 className="text-xl font-bold">Free</h3>
            <p className="mt-2 text-3xl font-bold">$0</p>
            <p className="mt-4 text-gray-400">Up to 5 appointments</p>
          </div>
          <div className="rounded border border-blue-500 p-6">
            <h3 className="text-xl font-bold">Pro</h3>
            <p className="mt-2 text-3xl font-bold">
              $9<span className="text-base text-gray-400"> / month</span>
            </p>
            <p className="mt-4 text-gray-400">Unlimited appointments</p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded bg-blue-500 px-6 py-3 font-medium"
            >
              Get Pro
            </Link>
          </div>
        </div>
      </section>

      <footer className="p-6 text-center text-sm text-gray-500">
        © 2026 Slotly
      </footer>
    </main>
  );
}
