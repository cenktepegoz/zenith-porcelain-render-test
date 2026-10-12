const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto');
const archive='zenith-table-catalog-2026-10-12.tar.gz';
if(crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex')!=='39894e978b3289c13a797fa24388ad169cff7b87acaa2d354d272a37b39c09a1')throw Error('Catalog archive checksum mismatch');
const allowed=["app/components/table-catalog.tsx","app/components/table-catalog.css","public/images/zenith-porselen-masa-katalog-render.jpg","integrate-catalog.cjs"];
if(cp.execFileSync('tar',['-tzf',archive],{encoding:'utf8'}).trim().split('\n').some(e=>!allowed.includes(e)))throw Error('Unexpected archive member');
const analytics=fs.readFileSync('app/lib/analytics.ts');
cp.execFileSync('tar',['-xzf',archive]);
cp.execFileSync(process.execPath,['integrate-catalog.cjs'],{stdio:'inherit'});
if(!analytics.equals(fs.readFileSync('app/lib/analytics.ts')))throw Error('Unexpected analytics change');
