export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/30 px-4 py-28">
      <div className="w-full max-w-md mx-auto p-4">
        {children}
      </div>
    </div>
  );
}
