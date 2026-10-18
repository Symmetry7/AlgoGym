import SocietyJoin from "@/screens/SocietyJoin";
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SocietyJoin token={token} />;
}
