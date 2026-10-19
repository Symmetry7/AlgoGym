import { notFound } from "next/navigation";
import TrainingGym from "@/features/training/TrainingGym";
import { TRAINING_TRACKS } from "@/lib/training";
export default async function TrackPage({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!TRAINING_TRACKS.some((track)=>track.id===id))notFound();return <TrainingGym selectedTrackId={id}/>;}
