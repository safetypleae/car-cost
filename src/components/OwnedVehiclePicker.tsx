'use client';
import Link from 'next/link';
import {useMaintenance} from '@/lib/maintenance-storage';
import type {OwnedVehicle} from '@/lib/maintenance';
export default function OwnedVehiclePicker({onSelect,candidate}:{onSelect:(v:OwnedVehicle)=>void;candidate:Omit<OwnedVehicle,'id'>|null}) {
 const {data,ready,error,update}=useMaintenance();
 return <div className="mb-4 space-y-2 text-sm"><label className="block">저장한 내 차<select aria-label="저장한 내 차" defaultValue="" onChange={e=>{const v=data.vehicles.find(v=>v.id===e.target.value);if(v)onSelect(v);e.target.value='';}} className="mt-2 w-full rounded-xl border border-slate-200 p-3"><option value="">차량을 선택하세요</option>{data.vehicles.map(v=><option key={v.id} value={v.id}>{v.name} · {v.efficiency}km/L</option>)}</select></label>{candidate && <button type="button" disabled={!ready} className="rounded-lg bg-blue-50 p-3 font-semibold text-blue-700 disabled:opacity-40" onClick={()=>{if(update(d=>({...d,vehicles:[...d.vehicles,{...candidate,id:crypto.randomUUID()}]})))alert('내 차에 저장했습니다.');}}>선택 차량 내 차로 저장</button>}<Link href="/garage" className="block text-blue-600 underline">차량 추가·관리</Link>{error&&<p role="alert" className="text-red-700">{error}</p>}</div>;
}
