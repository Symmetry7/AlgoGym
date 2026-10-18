import SocietyManage from "@/screens/SocietyManage";
export default async function SocietyManagePage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <SocietyManage slug={slug} />; }
