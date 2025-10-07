import MainLayout from "@/app/MainLayout";
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <MainLayout children={children} />
  );
}
