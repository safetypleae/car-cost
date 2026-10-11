'use client';
import {useEffect,useState} from 'react';
import {compareTransport} from '@/lib/maintenance';
import type {TransitResponse,TransitRoute} from '@/lib/transit';
type Point={name:string;lat:number;lng:number};
const won=(n:number)=>`${Math.round(n).toLocaleString('ko-KR')}원`;
export default function TransportComparison({origin,destination,carTotal,carMinutes,passengers,roundTrip}:{origin:Point;destination:Point;carTotal:number;carMinutes:number;passengers:number;roundTrip:boolean}) {
 const [response,setResponse]=useState<TransitResponse|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const [fare,setFare]=useState(''),[minutes,setMinutes]=useState('');
 const key=`${origin.lng},${origin.lat},${destination.lng},${destination.lat},${roundTrip}`;
 const [resultKey,setResultKey]=useState('');
 useEffect(()=>{setResponse(null);setResultKey('');setFare('');setMinutes('');setError('');},[key]);
 async function search() {
  setLoading(true);setError('');const requestKey=key;
  try {const q=new URLSearchParams({startLng:String(origin.lng),startLat:String(origin.lat),goalLng:String(destination.lng),goalLat:String(destination.lat)});const res=await fetch(`/api/transit?${q}`);if(!res.ok)throw new Error('대중교통 조회 요청을 처리하지 못했습니다.');setResponse(await res.json());setResultKey(requestKey);}
  catch(e){setError(e instanceof Error?e.message:'조회에 실패했습니다.');}finally{setLoading(false);}
 }
 function comparison(fareValue:number,timeValue:number|null,manual:boolean) {
  const c=compareTransport(carTotal,passengers,fareValue);
  return <div className="mt-3 rounded-xl bg-blue-50 p-4 text-sm leading-6"><p>자차 총 {won(carTotal)} · {passengers}명 탑승 시 1인 {won(c.carPerPerson)}</p><p>대중교통 1인 {won(fareValue)} · {passengers}명 총 {won(c.transitTotal)}</p><p className="mt-2 font-bold">{c.cheaper==='equal'?'1인당 비용이 같습니다.':`${c.cheaper==='car'?'자차':'대중교통'}가 1인당 ${won(Math.abs(c.differencePerPerson))} 저렴합니다.`}</p><p className="mt-2">자차 약 {Math.round(carMinutes)}분{timeValue!==null?` · 대중교통 약 ${Math.round(timeValue)}분`:''}</p>{timeValue!==null&&<p>{timeValue===carMinutes?'예상 소요시간이 같습니다.':`${timeValue>carMinutes?'자차':'대중교통'}가 약 ${Math.round(Math.abs(timeValue-carMinutes))}분 빠릅니다.`}</p>}<p className="mt-2 text-xs text-slate-600">{manual?'직접 입력한 조건 기준이며 API 조회 결과가 아닙니다.':'성인 편도 조회 요금 기준입니다.'} 자차는 연료비·통행료·입력한 주차비만 포함하며 감가상각·보험료는 제외합니다.</p></div>;
 }
 function path(r:TransitRoute){return <article key={r.id} className="my-4 border-t border-slate-200 pt-4"><p className="font-semibold">{r.segments.map(s=>s.name).join(' → ')}</p><ol className="mt-2 space-y-1 text-xs text-slate-600">{r.segments.map((s,i)=><li key={i}>{s.name} {s.start&&`${s.start} → ${s.end}`} · {s.durationMinutes}분</li>)}</ol>{comparison(r.farePerPerson,r.durationMinutes,false)}</article>;}
 const numericFare=Number(fare),numericMinutes=Number(minutes);
 const validFare= fare.trim()!==''&&Number.isFinite(numericFare)&&numericFare>=0&&numericFare<=1e9;
 const timeValue=minutes.trim()!==''&&Number.isFinite(numericMinutes)&&numericMinutes>0&&numericMinutes<100000?numericMinutes:null;
 return <section className="my-5 rounded-3xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">자차 vs 대중교통</h2><p className="mt-2 text-sm text-slate-500">{origin.name} → {destination.name} · {roundTrip?'왕복':'편도'}</p>{roundTrip?<p className="my-3 text-sm leading-6 text-slate-600">왕복은 돌아오는 경로·요금이 달라 자동 조회 비교를 제공하지 않습니다. 대중교통 1인 왕복 합계와 총 소요시간을 확인해 입력하세요.</p>:<button type="button" disabled={loading} onClick={()=>void search()} className="my-3 min-h-12 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{loading?'조회 중…':'대중교통 경로·요금 조회'}</button>}
 {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}{resultKey===key&&response&&<div role="status" className="text-sm leading-6"><p>{response.message}</p>{response.status==='available'&&!roundTrip&&response.routes.map(path)}</div>}
 <details className="mt-4" open={roundTrip||response?.status==='unavailable'}><summary className="cursor-pointer text-sm font-semibold text-blue-700">확인한 대중교통 비용으로 직접 비교</summary><p className="my-3 text-xs leading-6 text-slate-500"><a href="https://map.kakao.com/" target="_blank" rel="noopener noreferrer" className="underline">카카오맵</a> 또는 <a href="https://map.naver.com/" target="_blank" rel="noopener noreferrer" className="underline">네이버 지도</a>에서 같은 경로의 요금·시간을 확인하세요. 직접 입력값은 자동 조회 정보로 저장되지 않습니다.</p><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">대중교통 1인 {roundTrip?'왕복 합계':'편도'} 요금 (원)<input type="number" inputMode="numeric" min="0" max="1000000000" value={fare} onChange={e=>setFare(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 p-3"/></label><label className="text-sm">대중교통 {roundTrip?'왕복 총':'편도'} 시간 (분, 선택)<input type="number" inputMode="numeric" min="1" max="99999" value={minutes} onChange={e=>setMinutes(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 p-3"/></label></div>{validFare&&comparison(numericFare,timeValue,true)}</details></section>;
}
