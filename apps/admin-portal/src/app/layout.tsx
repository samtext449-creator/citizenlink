// apps/admin-portal/src/app/layout.tsx
import './globals.css'; // Make sure this path is correct

export const metadata = {
  title: 'CitizenLink Admin',
  description: 'Admin Portal for Ushuru Mashinani',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children} {/* <--- THIS IS CRITICAL. If this is missing, the page is blank */}
      </body>
    </html>
  );
}