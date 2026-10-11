'use client';
import { useEffect, useState } from 'react';
import { EMPTY_DATA, parseMaintenance, type MaintenanceData } from './maintenance';
export const MAINTENANCE_KEY='car-cost-maintenance-v1';
const EVENT='car-cost-maintenance-change';
export function useMaintenance() {
  const [data,setData]=useState<MaintenanceData>(EMPTY_DATA);
  const [ready,setReady]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=> {
    function read() {
      try { const raw=localStorage.getItem(MAINTENANCE_KEY); setData(raw ? parseMaintenance(JSON.parse(raw)) : EMPTY_DATA); setError(''); setReady(true); }
      catch { setError('저장정보를 읽지 못했습니다. 기존 데이터를 덮어쓰지 않습니다. 브라우저 저장 권한과 백업을 확인해 주세요.');setReady(false); }
    }
    read(); const storage=(e:StorageEvent)=>{if(e.key===MAINTENANCE_KEY || e.key===null) read();};
    window.addEventListener('storage',storage);window.addEventListener(EVENT,read);
    return ()=>{window.removeEventListener('storage',storage);window.removeEventListener(EVENT,read);};
  },[]);
  function update(fn:(current:MaintenanceData)=>MaintenanceData) {
    try {
      if(!ready) throw new Error('저장소를 사용할 수 없습니다.');
      const raw=localStorage.getItem(MAINTENANCE_KEY);
      const current=raw ? parseMaintenance(JSON.parse(raw)) : EMPTY_DATA;
      const next=parseMaintenance(fn(current));
      localStorage.setItem(MAINTENANCE_KEY,JSON.stringify(next));setData(next);setError('');window.dispatchEvent(new Event(EVENT));return true;
    } catch(e) {setError(e instanceof Error ? e.message : '저장하지 못했습니다. 저장 공간을 확인해 주세요.');return false;}
  }
  return {data,ready,error,update};
}
