import { SignIn } from "@clerk/nextjs";

function hasValidClerkKeys() {
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
}

export default function LoginPage() {
  const hasClerk = hasValidClerkKeys();

  if (!hasClerk) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-4 text-2xl font-bold">Kin People App</h1>
          <p className="mb-4 text-gray-600">
            To enable authentication, please configure Clerk in your <code className="rounded bg-gray-100 px-2 py-1 text-sm">.env.local</code> file.
          </p>
          <div className="rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Quick Setup:</strong>
            </p>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-blue-700">
              <li>Create a Clerk account at clerk.com</li>
              <li>Create a new application</li>
              <li>Copy your publishable key and secret key</li>
              <li>Update <code className="rounded bg-blue-100 px-1">.env.local</code> with your keys</li>
            </ol>
          </div>
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-700">UI Preview Mode</p>
            <p className="mt-1 text-xs text-gray-600">
              You can still browse the application UI, but authentication features will be disabled.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/signup"
        afterSignInUrl="/dashboard"
      />
    </div>
  );
}
