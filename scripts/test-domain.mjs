import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const directory=mkdtempSync(join(tmpdir(),'car-cost-test-'));
try {
 execFileSync(process.execPath,['node_modules/typescript/bin/tsc','src/lib/maintenance.ts','src/lib/transit.ts','--outDir',directory,'--module','commonjs','--target','es2022','--skipLibCheck','--strict'],{stdio:'inherit'});
 execFileSync(process.execPath,['--test','tests/maintenance.cjs'],{stdio:'inherit',env:{...process.env,CORE_BUILD_DIR:directory}});
}finally{rmSync(directory,{recursive:true,force:true});}
