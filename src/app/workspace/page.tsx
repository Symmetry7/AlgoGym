import Workspace from '@/screens/Workspace';
export default async function WorkspacePage({searchParams}:{searchParams:Promise<{tab?:string}>}){const params=await searchParams;return <Workspace initialTab={['sheets','explore'].includes(params.tab??'')?params.tab:'workspace'}/>;}
