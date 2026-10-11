const {test}=require('node:test');
const assert=require('node:assert/strict');
const {join}=require('node:path');
const {parseMaintenance,mergeMaintenance,summarize,isDate,compareTransport,localDate,CATEGORIES}=require(join(process.env.CORE_BUILD_DIR,'maintenance.js'));
const {normalizeTransit}=require(join(process.env.CORE_BUILD_DIR,'transit.js'));
const car={id:'v1',name:'내 차',fuelType:'gasoline',efficiency:12};
const car2={...car,id:'v2',name:'두 번째 차'};
const expense=(overrides={})=>({id:'e1',vehicleId:'v1',category:'fuel',date:'2026-10-01',amount:50000,odometerKm:null,memo:'주유',createdAt:'2026-10-01T10:00:00Z',updatedAt:'2026-10-01T10:00:00Z',...overrides});
const data=(expenses=[expense()])=>({schemaVersion:1,vehicles:[car,car2],expenses});
test('calendar validation includes leap years and rejects impossible dates',()=>{assert.ok(isDate('2024-02-29'));for(const x of ['2026-02-29','2026-13-01','2026-04-31','foo',null,'1800-01-01'])assert.equal(isDate(x),false);assert.equal(localDate(new Date(2026,0,2)),'2026-01-02');});
test('round-trip backup preserves explicit contract and strips unknown fields',()=>{const d=data();assert.deepEqual(parseMaintenance(JSON.parse(JSON.stringify({...d,secret:'ignored'}))),d);assert.equal(Object.keys(CATEGORIES).length,9);});
test('invalid money, mileage, category, references, duplicates are rejected atomically',()=>{
 for(const bad of [{amount:-1},{amount:0},{amount:NaN},{amount:Infinity},{amount:1.5},{odometerKm:-1},{category:'__proto__'},{vehicleId:'missing'},{date:'2026-02-30'},{memo:'a'.repeat(1001)},{createdAt:'invalid'}])assert.throws(()=>parseMaintenance(data([expense(bad)])));
 assert.throws(()=>parseMaintenance(data([expense(),expense()])));
 assert.throws(()=>parseMaintenance({...data(),vehicles:[car,car]}));
 assert.throws(()=>parseMaintenance({...data(),schemaVersion:2}));
});
test('additive import is idempotent and retains records, conflicting IDs reject',()=>{const a=parseMaintenance(data()),b=parseMaintenance(data([expense({id:'e2',vehicleId:'v2'})]));assert.equal(mergeMaintenance(a,b).expenses.length,2);assert.deepEqual(mergeMaintenance(a,a),a);assert.throws(()=>mergeMaintenance(a,parseMaintenance(data([expense({amount:100})]))));assert.equal(a.expenses[0].amount,50000);});
test('monthly average includes zero months and honors boundaries and vehicles',()=>{
 const d=data([expense({date:'2026-01-01'}),expense({id:'e2',vehicleId:'v2',category:'repair',date:'2026-03-31',amount:100000}),expense({id:'e3',date:'2026-04-01',amount:70000})]);
 const s=summarize(d.expenses,'2026-01-01','2026-03-31');assert.equal(s.total,150000);assert.equal(s.monthlyAverage,50000);assert.deepEqual(s.months.map(x=>x.amount),[50000,0,100000]);assert.equal(s.byCategory.repair,100000);assert.equal(s.byVehicle.v2,100000);assert.equal(summarize(d.expenses,'2026-01-01','2026-03-31','v1').total,50000);
});
test('edits and deletion immediately recompute category, vehicle and totals',()=>{const initial=[expense()];assert.equal(summarize(initial,'2026-10-01','2026-10-31').total,50000);const edited=[{...initial[0],amount:80000,category:'maintenance',vehicleId:'v2'}];const s=summarize(edited,'2026-10-01','2026-10-31');assert.equal(s.byCategory.fuel,0);assert.equal(s.byCategory.maintenance,80000);assert.equal(s.byVehicle.v2,80000);assert.equal(summarize([],'2026-10-01','2026-10-31').total,0);});
test('cross-year periods and invalid periods',()=>{const s=summarize([],'2025-12-30','2026-02-01');assert.equal(s.monthCount,3);assert.equal(s.monthlyAverage,0);assert.throws(()=>summarize([],'2026-03-01','2026-01-01'));});
test('per-person comparison correctly handles passengers, zero fares, equal cost',()=>{assert.equal(compareTransport(30000,3,12000).cheaper,'car');assert.equal(compareTransport(30000,1,12000).cheaper,'transit');assert.equal(compareTransport(30000,3,10000).cheaper,'equal');assert.equal(compareTransport(30000,3,0).cheaper,'transit');assert.throws(()=>compareTransport(1,0,3));assert.throws(()=>compareTransport(1,1.5,3));assert.throws(()=>compareTransport(Infinity,1,3));});
test('provider fixtures normalize only complete city route responses (fixtures never displayed as live data)',()=>{const raw={result:{searchType:0,path:[{info:{payment:1500,totalTime:30},subPath:[{trafficType:3,sectionTime:5},{trafficType:2,sectionTime:25,startName:'A',endName:'B',lane:[{busNo:'100'}]}]}]}};const s=normalizeTransit(raw);assert.equal(s.status,'available');assert.equal(s.routes[0].farePerPerson,1500);assert.equal(s.routes[0].segments[1].name,'100');});
test('no route, intercity, partial route, missing fare and provider errors never produce fake prices',()=>{for(const raw of [null,{}, {error:{code:-99}},{result:{searchType:1,path:[]}},{result:{searchType:0,path:[]}},{result:{searchType:0,path:[{info:{totalTime:3},subPath:[]}]}},{result:{searchType:0,path:[{info:{payment:10,totalTime:3},subPath:[{trafficType:2,sectionTime:3,lane:[]}]}]}}]){const s=normalizeTransit(raw);assert.equal(s.status,'unavailable');assert.deepEqual(s.routes,[]);}});
