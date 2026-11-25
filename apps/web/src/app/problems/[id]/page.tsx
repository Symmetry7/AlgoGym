import ProblemDetail from '@/screens/ProblemDetail';
export default async function ProblemPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ProblemDetail id={id}/>;}
