import {NextRequest,NextResponse} from 'next/server';
import {normalizeTransit,type TransitResponse} from '@/lib/transit';
export async function GET(request:NextRequest) {
 const reply=(data:TransitResponse,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
 const unavailable=(reason:TransitResponse['reason'],message:string,status=200)=>reply({schemaVersion:1,status:'unavailable',source:null,reason,message,routes:[],queriedAt:null,tripType:'oneway'},status);
 const q=request.nextUrl.searchParams;
 const coords=['startLng','startLat','goalLng','goalLat'].map(k=>{const raw=q.get(k);return raw!==null&&raw.trim()!==''?Number(raw):NaN;});
 if(coords.some(n=>!Number.isFinite(n))||coords.some((n,i)=>i%2===0?(n<124||n>132):(n<33||n>39)))return unavailable('invalid_request','국내 출발지·목적지 좌표를 확인해 주세요.',400);
 // Explicit opt-in to an eligible, approved Basic key only. Paid plans are not enabled by this release.
 if(process.env.TRANSIT_BASIC_APPROVED!=='true'||!process.env.ODSAY_API_KEY)return unavailable('not_configured','대중교통 실시간 조회가 아직 연결되지 않았습니다. 지도에서 확인한 요금과 시간을 직접 입력해 비교할 수 있습니다.');
 try {
  const url=new URL('https://api.odsay.com/v1/api/searchPubTransPathT');
  for(const [key,value] of Object.entries({apiKey:process.env.ODSAY_API_KEY,SX:String(coords[0]),SY:String(coords[1]),EX:String(coords[2]),EY:String(coords[3]),SearchType:'0',SearchPathType:'0'}))url.searchParams.set(key,value);
  const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!response.ok)return unavailable('provider_error','대중교통 서비스를 조회하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  return reply(normalizeTransit(await response.json()));
 }catch{return unavailable('provider_error','대중교통 서비스 응답이 지연되거나 조회에 실패했습니다.');}
}
