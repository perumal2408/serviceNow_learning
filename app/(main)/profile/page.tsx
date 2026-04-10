import { Suspense } from "react";

export const metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and bookmarks</p>
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold">Account</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Account Type</p>
            <p className="font-medium mt-0.5">Anonymous</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Sign Up</p>
            <p className="text-xs mt-0.5 text-muted-foreground">
              Create an account to sync your progress across devices.
            </p>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <a
            href="/register"
            className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Create Account
          </a>
          <a
            href="/login"
            className="inline-flex items-center justify-center h-10 px-4 rounded-md border text-sm font-medium hover:bg-accent transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
