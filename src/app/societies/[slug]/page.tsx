import SocietyDetail from "@/screens/SocietyDetail";
export default async function SocietyPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <SocietyDetail slug={slug} />; }
