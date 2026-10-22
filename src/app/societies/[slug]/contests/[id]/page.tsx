import SocietyContest from "@/screens/SocietyContest";
export default async function Page({params}:{params:Promise<{slug:string;id:string}>}) {const {slug,id}=await params;return <SocietyContest slug={slug} id={id}/>;}
