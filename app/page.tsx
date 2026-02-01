import { redirect } from "next/navigation";

export default async function HomePage() {
  // Check if Clerk is configured
  const hasValidClerkKeys = () => {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const secretKey = process.env.CLERK_SECRET_KEY;
    
    return (
      publishableKey &&
      secretKey &&
      !publishableKey.includes("placeholder") &&
      !secretKey.includes("placeholder") &&
      publishableKey.startsWith("pk_") &&
      secretKey.startsWith("sk_")
    );
  };

  if (!hasValidClerkKeys()) {
    // Show login page even without Clerk for UI preview
    redirect("/login");
  }

  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

    if (userId) {
      redirect("/dashboard");
    }

    redirect("/login");
  } catch {
    // If Clerk fails, just redirect to login
    redirect("/login");
  }
}
