export type TransitSegment={mode:'walk'|'bus'|'subway';name:string;start:string;end:string;durationMinutes:number};
export type TransitRoute={id:string;farePerPerson:number;durationMinutes:number;segments:TransitSegment[]};
export type TransitResponse={schemaVersion:1;status:'available'|'unavailable';source:'ODsay'|null;reason?:'not_configured'|'no_route'|'unsupported_route'|'provider_error'|'invalid_request';message:string;routes:TransitRoute[];queriedAt:string|null;tripType:'oneway'};
type RawPath={info?:{payment?:number;totalTime?:number};subPath?:{trafficType?:number;sectionTime?:number;startName?:string;endName?:string;lane?:{name?:string;busNo?:string}[]}[]};
/** ODsay city paths only. Never treat intercity terminal-only legs as door-to-door routes. */
export function normalizeTransit(raw:unknown):TransitResponse {
 const unavailable=(reason:TransitResponse['reason'],message:string):TransitResponse=>({schemaVersion:1,status:'unavailable',source:'ODsay',reason,message,routes:[],queriedAt:new Date().toISOString(),tripType:'oneway'});
 if(!raw||typeof raw!=='object')return unavailable('provider_error','대중교통 응답을 확인하지 못했습니다.');
 const data=raw as {error?:unknown;result?:{searchType?:number;path?:RawPath[]}};
 if(data.error)return unavailable('provider_error','대중교통 조회가 제한되었거나 경로를 찾지 못했습니다.');
 if(data.result?.searchType!==0)return unavailable('unsupported_route','도시간 이동은 전체 연결 구간과 요금을 검증하지 못해 자동 비교를 제공하지 않습니다.');
 const routes:TransitRoute[]=[];
 if(!Array.isArray(data.result?.path))return unavailable('no_route','조회 가능한 대중교통 경로가 없습니다.');
 for(const [index,path] of data.result.path.slice(0,5).entries()) {
  if(!path||!path.info)continue;
  const fare=path.info.payment,time=path.info.totalTime;
  if(typeof fare!=='number'||!Number.isFinite(fare)||fare<0||typeof time!=='number'||!Number.isFinite(time)||time<=0||!Array.isArray(path.subPath))continue;
  const segments:TransitSegment[]=[];let valid=true;
  for(const part of path.subPath) {
   if(!part||![1,2,3].includes(part.trafficType||0)||typeof part.sectionTime!=='number'||!Number.isFinite(part.sectionTime)||part.sectionTime<0){valid=false;break;}
   const mode=part.trafficType===1?'subway':part.trafficType===2?'bus':'walk';
   const name=mode==='walk'?'도보':part.lane?.map(l=>mode==='bus'?l.busNo:l.name).filter(x=>typeof x==='string').join(' / ');
   if(!name){valid=false;break;}
   segments.push({mode,name,start:typeof part.startName==='string'?part.startName:'',end:typeof part.endName==='string'?part.endName:'',durationMinutes:part.sectionTime});
  }
  if(valid&&segments.length&&segments.some(s=>s.mode!=='walk'))routes.push({id:`odsay-${index}`,farePerPerson:fare,durationMinutes:time,segments});
 }
 if(!routes.length)return unavailable('no_route','조회 가능한 대중교통 경로가 없습니다.');
 return {schemaVersion:1,status:'available',source:'ODsay',message:'ODsay 조회 결과 · 성인 1인 편도 기준. 실제 요금과 운행 상황은 이용 전에 확인하세요.',routes,queriedAt:new Date().toISOString(),tripType:'oneway'};
}
