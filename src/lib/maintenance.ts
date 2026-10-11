/** Platform-neutral v1 contract: amounts in KRW, odometer in km, calendar dates YYYY-MM-DD. */
export const CATEGORIES = { fuel: '주유비', repair: '수리비', maintenance: '정비비', insurance: '보험료', tax: '자동차세', wash: '세차비', parking: '주차비', toll: '통행료', other: '기타' } as const;
export type Category = keyof typeof CATEGORIES;
export type FuelType = 'gasoline' | 'diesel' | 'premium' | 'lpg';
export type OwnedVehicle = { id: string; name: string; fuelType: FuelType; efficiency: number; sourceVehicleId?: string };
export type Expense = { id: string; vehicleId: string; category: Category; date: string; amount: number; odometerKm: number | null; memo: string; createdAt: string; updatedAt: string };
export type MaintenanceData = { schemaVersion: 1; vehicles: OwnedVehicle[]; expenses: Expense[] };
export const EMPTY_DATA: MaintenanceData = { schemaVersion: 1, vehicles: [], expenses: [] };
export function localDate(date = new Date()): string { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01' || value > '2100-12-31') return false;
  const d = new Date(`${value}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10) === value;
}
const object = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const text = (x: unknown, max: number): x is string => typeof x === 'string' && x.length > 0 && x.length <= max;
const nonnegative = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 1e12;
export function parseMaintenance(value: unknown): MaintenanceData {
  if (!object(value) || value.schemaVersion !== 1 || !Array.isArray(value.vehicles) || !Array.isArray(value.expenses) || value.vehicles.length > 100 || value.expenses.length > 10000) throw new Error('지원하지 않는 백업 형식 또는 기록 수입니다.');
  const ids = new Set<string>();
  const vehicles: OwnedVehicle[] = value.vehicles.map((v: unknown) => {
    if (!object(v) || !text(v.id,200) || ids.has(v.id) || !text(v.name,80) || !['gasoline','diesel','premium','lpg'].includes(String(v.fuelType)) || !nonnegative(v.efficiency) || v.efficiency <= 0 || v.efficiency > 100 || (v.sourceVehicleId !== undefined && !text(v.sourceVehicleId,1000))) throw new Error('차량 정보가 올바르지 않습니다.');
    ids.add(v.id); return { id: v.id, name: v.name, fuelType: v.fuelType as FuelType, efficiency: v.efficiency, ...(v.sourceVehicleId ? { sourceVehicleId: v.sourceVehicleId as string } : {}) };
  });
  const expenseIds = new Set<string>();
  const expenses: Expense[] = value.expenses.map((e: unknown) => {
    if (!object(e) || !text(e.id,200) || expenseIds.has(e.id) || !text(e.vehicleId,200) || !ids.has(e.vehicleId) || typeof e.category !== 'string' || !Object.hasOwn(CATEGORIES,e.category) || !isDate(e.date) || !nonnegative(e.amount) || !Number.isSafeInteger(e.amount) || e.amount <= 0 || (e.odometerKm !== null && !nonnegative(e.odometerKm)) || typeof e.memo !== 'string' || e.memo.length > 1000 || !text(e.createdAt,40) || !text(e.updatedAt,40) || Number.isNaN(Date.parse(e.createdAt)) || Number.isNaN(Date.parse(e.updatedAt))) throw new Error('지출 정보가 올바르지 않습니다.');
    expenseIds.add(e.id); return { id:e.id, vehicleId:e.vehicleId, category:e.category as Category, date:e.date, amount:e.amount, odometerKm:e.odometerKm as number|null, memo:e.memo, createdAt:e.createdAt, updatedAt:e.updatedAt };
  });
  return { schemaVersion:1, vehicles, expenses };
}
/** Additive import: keeps current records. Conflicting IDs reject the entire import. */
export function mergeMaintenance(current: MaintenanceData, incoming: MaintenanceData): MaintenanceData {
  function merge<T extends { id:string }>(a:T[], b:T[]):T[] {
    const map = new Map(a.map(x=>[x.id,x]));
    for (const item of b) {
      const previous=map.get(item.id);
      if(previous && JSON.stringify(previous)!==JSON.stringify(item)) throw new Error('같은 ID의 다른 기록이 있습니다. 기존 기록을 보존하기 위해 가져오기를 중단했습니다.');
      map.set(item.id,item);
    }
    return [...map.values()];
  }
  return parseMaintenance({ schemaVersion:1, vehicles:merge(current.vehicles,incoming.vehicles), expenses:merge(current.expenses,incoming.expenses) });
}
export function summarize(expenses: Expense[], from:string, to:string, vehicleId = '') {
  if (!isDate(from) || !isDate(to) || from > to) throw new Error('조회 기간을 확인해 주세요.');
  const rows=expenses.filter(e=>e.date>=from && e.date<=to && (!vehicleId || e.vehicleId===vehicleId));
  const byCategory=Object.fromEntries(Object.keys(CATEGORIES).map(k=>[k,0])) as Record<Category,number>;
  const months: { month:string; amount:number }[]=[];
  let year=Number(from.slice(0,4)), month=Number(from.slice(5,7));
  const end=to.slice(0,7);
  while (`${year}-${String(month).padStart(2,'0')}` <= end) {
    months.push({ month:`${year}-${String(month).padStart(2,'0')}`, amount:0 });
    if (++month===13) { month=1;year++; }
  }
  const byVehicle:Record<string,number>=Object.create(null);
  const monthly=new Map(months.map(m=>[m.month,m]));
  let total=0;
  for(const e of rows) { total+=e.amount; byCategory[e.category]+=e.amount; byVehicle[e.vehicleId]=(byVehicle[e.vehicleId]||0)+e.amount; monthly.get(e.date.slice(0,7))!.amount+=e.amount; }
  return { rows,total,byCategory,byVehicle,months,monthlyAverage:total/months.length,monthCount:months.length };
}
export function compareTransport(carTotal:number, passengers:number, transitFarePerPerson:number) {
  if (![carTotal,transitFarePerPerson].every(nonnegative) || !Number.isInteger(passengers) || passengers<1 || passengers>100) throw new Error('비용 또는 탑승 인원을 확인해 주세요.');
  const carPerPerson=carTotal/passengers, differencePerPerson=carPerPerson-transitFarePerPerson;
  return { carPerPerson, transitTotal:transitFarePerPerson*passengers, differencePerPerson, cheaper:differencePerPerson===0?'equal':differencePerPerson>0?'transit':'car' } as const;
}
