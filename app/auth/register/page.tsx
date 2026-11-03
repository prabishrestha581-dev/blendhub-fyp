import Link from "next/link";

export default function Register() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm px-5 py-8 border-2 border-gray-100 rounded-2xl shadow-md">
        <div className="signup-heading text-center mb-8">
          <h1 className="text-2xl">Create Account</h1>
          <h2 className="text-nd text-gray-600">Sign up to get started</h2>
        </div>
        <div className="signup-form">
          <form className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label htmlFor="full-name">Full Name</label>
              <input
                id="full-name"
                name="name"
                type="text"
                autoComplete="name"
                className="border border-blue-100 rounded-md p-1"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="border border-blue-100 rounded-md p-1"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="border border-blue-100 rounded-md p-1"
              />
            </div>

            <div className="mt-3 text-center">
              <button
                type="button"
                className="bg-blue-400 py-2 px-1 w-full rounded-md text-white hover:bg-blue-500"
              >
                Create Account
              </button>
            </div>

            <div className="text-center">
              <p>
                Already have an acccount? <Link href="/auth/login">Login</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
