// Reads container metadata only. Original bytes are never rewritten.
export async function readMP4(file){
 let pos=0,moov=null;while(pos+8<=file.size){const a=new DataView(await file.slice(pos,pos+16).arrayBuffer());let size=a.getUint32(0);const type=String.fromCharCode(...new Uint8Array(a.buffer,4,4));let head=8;if(size===1){size=Number(a.getBigUint64(8));head=16;}if(size===0)size=file.size-pos;if(size<head||size>file.size-pos)break;if(type==='moov'){if(size>64*1024*1024)return {};moov=new DataView(await file.slice(pos+head,pos+size).arrayBuffer());break;}pos+=size;}
 if(!moov)return {};const box=(a,start=0,end=a.byteLength)=>{const out=[];for(let i=start;i+8<=end;){let size=a.getUint32(i),h=8;const t=String.fromCharCode(...new Uint8Array(a.buffer,a.byteOffset+i+4,4));if(size===1&&i+16<=end){size=Number(a.getBigUint64(i+8));h=16;}if(size===0)size=end-i;if(size<h||i+size>end)break;out.push({t,s:i+h,e:i+size});i+=size;}return out;};
 const children=b=>box(moov,b.s,b.e),find=(b,t)=>children(b).find(b=>b.t===t);const tracks=box(moov).filter(b=>b.t==='trak');let info={hasAudio:false};
 for(const tr of tracks){const mdia=find(tr,'mdia');if(!mdia)continue;const hdlr=find(mdia,'hdlr'),mdhd=find(mdia,'mdhd');if(!hdlr||!mdhd)continue;const type=String.fromCharCode(...new Uint8Array(moov.buffer,hdlr.s+8,4));const ver=moov.getUint8(mdhd.s),ts=moov.getUint32(mdhd.s+(ver===1?20:12));const dur=ver===1?Number(moov.getBigUint64(mdhd.s+24)):moov.getUint32(mdhd.s+16);const minf=find(mdia,'minf'),stbl=minf&&find(minf,'stbl');
 if(type==='vide'){info.duration=dur/ts;const tk=find(tr,'tkhd');if(tk){info.width=moov.getUint32(tk.e-8)>>>16;info.height=moov.getUint32(tk.e-4)>>>16;}const stts=stbl&&find(stbl,'stts');if(stts){let samples=0,ticks=0;const count=moov.getUint32(stts.s+4);for(let i=0;i<count&&stts.s+16+i*8<=stts.e;i++){const n=moov.getUint32(stts.s+8+i*8),d=moov.getUint32(stts.s+12+i*8);samples+=n;ticks+=n*d;}if(ticks)info.fps=ts*samples/ticks;}}
 if(type==='soun'){info.hasAudio=true;const stsd=stbl&&find(stbl,'stsd');if(stsd&&stsd.s+44<=stsd.e){info.audioChannels=moov.getUint16(stsd.s+32);info.audioRate=moov.getUint32(stsd.s+40)>>>16;}}}
 return info;
}
export async function inspectVideo(file){
 let metadata={};if(/\.(mp4|mov|m4v)$/i.test(file.name)){try{metadata=await readMP4(file);}catch{}}
 const url=URL.createObjectURL(file),v=document.createElement('video');v.muted=true;v.preload='metadata';v.playsInline=true;v.src=url;
 try{await new Promise((ok,fail)=>{const t=setTimeout(()=>fail(new Error('Délai')),6000);v.onloadedmetadata=()=>{clearTimeout(t);ok();};v.onerror=()=>{clearTimeout(t);fail(new Error('Codec'));};});if(Number.isFinite(v.duration)&&v.duration>0)metadata.duration=v.duration;metadata.width=v.videoWidth||metadata.width;metadata.height=v.videoHeight||metadata.height;
 try{v.currentTime=Math.min(.4,(metadata.duration||1)/4);await new Promise((ok,fail)=>{const t=setTimeout(fail,2500);v.onseeked=()=>{clearTimeout(t);ok();};});const c=document.createElement('canvas');c.width=480;c.height=Math.round(480*(v.videoHeight/v.videoWidth))||270;c.getContext('2d').drawImage(v,0,0,c.width,c.height);metadata.thumb=c.toDataURL('image/jpeg',.65);}catch{}
 metadata.previewable=true;
 }catch{metadata.previewable=false;}
 v.removeAttribute('src');v.load();URL.revokeObjectURL(url);return {...metadata,duration:metadata.duration||0};
}
