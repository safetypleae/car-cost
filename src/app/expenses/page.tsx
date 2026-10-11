import type {Metadata} from 'next';
import MaintenanceWorkspace from '@/components/MaintenanceWorkspace';
export const metadata:Metadata={title:'내 차 가계부',description:'로그인 없이 차량별 지출과 유지비를 이 브라우저에서 관리하세요.',alternates:{canonical:'/expenses'}};
export default function Page() {return <MaintenanceWorkspace mode="expenses"/>;}
