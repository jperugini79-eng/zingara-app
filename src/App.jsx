import { callClaude } from './api.js';
import { useState, useRef, useEffect, useCallback } from "react";

const MARGEN = 0.30;
const BRAND = {
  bg:"#0A0A0A", surface:"#141414", surface2:"#1E1230",
  primary:"#C9A8E8", light:"#E8D5F5", muted:"#7A6A8A",
  border:"#2A1A3E", borderLight:"#3D2A55"
};
const S = {
  app:{ minHeight:"100vh", background:BRAND.bg, color:BRAND.light, fontFamily:"'Segoe UI', sans-serif" },
  header:{ background:BRAND.surface, borderBottom:`1px solid ${BRAND.border}`, padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:56 },
  logo:{ color:BRAND.primary, fontSize:20, fontWeight:700, letterSpacing:"0.15em" },
  navBtn:(a)=>({ padding:"6px 14px", borderRadius:6, border:"none", cursor:"pointer", fontSize:12, fontWeight:500, letterSpacing:"0.05em", background:a?BRAND.primary:"transparent", color:a?BRAND.bg:BRAND.muted }),
  page:{ padding:"24px 20px", maxWidth:900, margin:"0 auto" },
  title:{ fontSize:16, fontWeight:600, color:BRAND.light, marginBottom:4, letterSpacing:"0.05em" },
  sub:{ fontSize:12, color:BRAND.muted, marginBottom:20 },
  card:{ background:BRAND.surface, border:`1px solid ${BRAND.border}`, borderRadius:12, padding:"16px 18px", marginBottom:12 },
  label:{ fontSize:11, color:BRAND.muted, marginBottom:4, display:"block", letterSpacing:"0.05em", textTransform:"uppercase" },
  input:{ width:"100%", boxSizing:"border-box", background:BRAND.surface2, border:`1px solid ${BRAND.borderLight}`, borderRadius:6, padding:"7px 10px", fontSize:13, color:BRAND.light, outline:"none" },
  textarea:{ width:"100%", boxSizing:"border-box", background:BRAND.surface2, border:`1px solid ${BRAND.borderLight}`, borderRadius:6, padding:"7px 10px", fontSize:13, color:BRAND.light, outline:"none", resize:"none" },
  select:{ width:"100%", background:BRAND.surface2, border:`1px solid ${BRAND.borderLight}`, borderRadius:6, padding:"7px 10px", fontSize:13, color:BRAND.light, outline:"none" },
  btn:(v="primary")=>({ padding:"8px 18px", borderRadius:6, border:v==="ghost"?`1px solid ${BRAND.borderLight}`:"none", cursor:"pointer", fontSize:13, fontWeight:600, letterSpacing:"0.05em", background:v==="primary"?BRAND.primary:"transparent", color:v==="primary"?BRAND.bg:BRAND.light }),
  badge:(e)=>{ const m={Pendiente:["#3D2A10","#F59E0B"],Programado:["#1A2A3D","#60A5FA"],Publicado:["#0F2A1A","#34D399"]}; const [bg,c]=m[e]||m.Pendiente; return {background:bg,color:c,fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:600}; }
};

function fileToDataUrl(f){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(f); }); }
function imgToBase64(f){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(f); }); }
function precioMin(m){ const n=parseFloat(m); return isNaN(n)||n===0?null:Math.round(n*(1+MARGEN)); }

function generarImagen(fotoSrc, nombre, precio, formato, extras, callback){
  const W=1080, H=formato==="story"?1920:1080;
  const canvas=document.createElement("canvas");
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext("2d"), img=new Image();
  img.crossOrigin="anonymous";
  img.onload=()=>{
    const cropY=img.height*(formato==="story"?0.05:0.15);
    const cropH=img.height-cropY, cropW=img.width;
    const scale=Math.max(W/cropW,H/cropH);
    const drawW=cropW*scale, drawH=cropH*scale, offsetX=(W-drawW)/2;
    ctx.drawImage(img,0,cropY,cropW,cropH,offsetX,0,drawW,drawH);
    if(formato==="story"){
      const grad=ctx.createLinearGradient(0,H*0.5,0,H);
      grad.addColorStop(0,"rgba(10,10,10,0)"); grad.addColorStop(0.45,"rgba(10,10,10,0.82)"); grad.addColorStop(1,"rgba(10,10,10,0.98)");
      ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
      ctx.fillStyle="rgba(201,168,232,0.92)"; ctx.font="700 32px Segoe UI, sans-serif";
      const lw=ctx.measureText("+ ZINGARA").width; ctx.fillText("+ ZINGARA",W-lw-52,70);
      const lineY=H-380;
      ctx.strokeStyle="#C9A8E8"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(60,lineY); ctx.lineTo(W-60,lineY); ctx.stroke();
      ctx.fillStyle="#E8D5F5"; ctx.font="700 58px Segoe UI, sans-serif"; ctx.fillText(nombre.toUpperCase(),60,lineY+75);
      if(precio){ ctx.fillStyle="#C9A8E8"; ctx.font="700 80px Segoe UI, sans-serif"; ctx.fillText("$ "+precio.toLocaleString("es-AR"),60,lineY+175); }
      if(extras&&extras.talle){ ctx.fillStyle="#E8D5F5"; ctx.font="500 38px Segoe UI, sans-serif"; ctx.fillText("Talles: "+extras.talle,60,lineY+255); }
      if(extras&&extras.color){ ctx.fillStyle="#C9A8E8"; ctx.font="400 34px Segoe UI, sans-serif"; let t=extras.color; if(ctx.measureText(t).width>W-120) t=t.slice(0,45)+"..."; ctx.fillText(t,60,lineY+310); }
    } else {
      const grad=ctx.createLinearGradient(0,H*0.55,0,H);
      grad.addColorStop(0,"rgba(10,10,10,0)"); grad.addColorStop(0.5,"rgba(10,10,10,0.75)"); grad.addColorStop(1,"rgba(10,10,10,0.97)");
      ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
      const lineY=H-160;
      ctx.strokeStyle="#C9A8E8"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(60,lineY); ctx.lineTo(W-60,lineY); ctx.stroke();
      ctx.fillStyle="#E8D5F5"; ctx.font="500 42px Segoe UI, sans-serif"; ctx.fillText(nombre.toUpperCase(),60,lineY+50);
      if(precio){ ctx.fillStyle="#C9A8E8"; ctx.font="700 64px Segoe UI, sans-serif"; ctx.fillText("$ "+precio.toLocaleString("es-AR"),60,lineY+130); }
      ctx.fillStyle="rgba(201,168,232,0.9)"; ctx.font="700 28px Segoe UI, sans-serif";
      const lw=ctx.measureText("+ ZINGARA").width; ctx.fillText("+ ZINGARA",W-lw-52,60);
    }
    ctx.strokeStyle="rgba(201,168,232,0.25)"; ctx.lineWidth=6; ctx.strokeRect(3,3,W-6,H-6);
    callback(canvas.toDataURL("image/jpeg",0.92));
  };
  img.onerror=()=>callback(null);
  img.src=fotoSrc;
}

async function elegirMejorFoto(fotos, nombre, descripcion){
  if(!fotos||!fotos.length) return null;
  if(fotos.length===1) return fotos[0];
  const esConjunto=/conjunto|set|outfit/i.test(nombre+" "+descripcion);
  try{
    const imgs=fotos.slice(0,4).map(src=>({type:"image",source:{type:"base64",media_type:"image/jpeg",data:src.split(",")[1]}}));
    const criterio=esConjunto?"Es un CONJUNTO, elegí donde se vea completo.":"Elegí la foto con mejor iluminación, prenda visible, sin cara.";
    const prompt="Tenés "+fotos.length+" fotos de: \""+nombre+"\". "+criterio+" Devolvé SOLO el número (0,1,2,3).";
    const data=await callClaude({model:"claude-sonnet-4-20250514",max_tokens:10,messages:[{role:"user",content:[...imgs,{type:"text",text:prompt}]}]});
    const idx=parseInt(data.content&&data.content.find(b=>b.type==="text")&&data.content.find(b=>b.type==="text").text||"0");
    return fotos[isNaN(idx)?0:Math.min(idx,fotos.length-1)];
  }catch(e){ return fotos[0]; }
}

async function generarImagenProducto(p){
  const foto=p.fotoElegida||await elegirMejorFoto(p.fotos,p.nombre,p.descripcion);
  if(!foto) return null;
  const precio=precioMin(p.precioMayorista);
  const extras={talle:p.talle,color:p.color};
  return new Promise(res=>{
    generarImagen(foto,p.nombre,precio,"feed",extras,urlFeed=>{
      if(!urlFeed){res(null);return;}
      generarImagen(foto,p.nombre,precio,"story",extras,urlStory=>{
        res({feed:urlFeed,story:urlStory||urlFeed});
      });
    });
  });
}

function Placeholder({ msg }){
  return(
    <div style={{width:"100%",aspectRatio:"1/1",background:BRAND.surface2,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}>
      <div style={{color:BRAND.primary,fontSize:20}}>✦</div>
      <div style={{color:BRAND.muted,fontSize:12}}>{msg}</div>
    </div>
  );
}

function SelectorFoto({ fotos, fotoElegida, onElegir }){
  if(!fotos||!fotos.length) return null;
  return(
    <div style={{marginBottom:10}}>
      <label style={{...S.label,marginBottom:6}}>Foto para el post — tocá para elegir (opcional)</label>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
        {fotos.map((src,i)=>{
          const elegida=fotoElegida===src;
          return(
            <div key={i} onClick={()=>onElegir(elegida?null:src)} style={{position:"relative",flexShrink:0,cursor:"pointer"}}>
              <img src={src} alt="" style={{height:64,width:64,objectFit:"cover",borderRadius:6,display:"block",border:"2px solid "+(elegida?BRAND.primary:BRAND.borderLight),opacity:elegida?1:0.55}}/>
              {elegida&&<div style={{position:"absolute",top:3,right:3,background:BRAND.primary,borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:BRAND.bg,fontSize:10,fontWeight:700,lineHeight:1}}>✓</span></div>}
            </div>
          );
        })}
      </div>
      {!fotoElegida&&<div style={{fontSize:11,color:BRAND.muted,marginTop:4}}>La IA elige la mejor foto automáticamente.</div>}
    </div>
  );
}

function FilaFotos({ fotos }){
  if(!fotos||!fotos.length) return null;
  return <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>{fotos.map((src,i)=><img key={i} src={src} alt="" style={{height:54,width:54,objectFit:"cover",borderRadius:6,flexShrink:0,border:"1px solid "+BRAND.borderLight}}/>)}</div>;
}

function CardHistorial({ p }){
  return(
    <div style={S.card}>
      <div style={{display:"flex",gap:14,alignItems:"center"}}>
        {(p.imagenPost||p.fotos&&p.fotos[0])&&<img src={p.imagenPost||p.fotos[0]} alt="" style={{width:64,height:64,borderRadius:8,objectFit:"cover",flexShrink:0}}/>}
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600,color:BRAND.light,marginBottom:2}}>{p.nombre}</div>
          <div style={{fontSize:11,color:BRAND.muted,marginBottom:4}}>{p.genero} · {p.talle} · {p.color}</div>
          {p.postTexto&&<div style={{fontSize:11,color:BRAND.muted,lineHeight:1.6,background:BRAND.surface2,borderRadius:6,padding:"8px 10px"}}>{p.postTexto.slice(0,140)}...</div>}
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          {precioMin(p.precioMayorista)&&<div style={{fontSize:14,color:BRAND.primary,fontWeight:700,marginBottom:4}}>$ {precioMin(p.precioMayorista).toLocaleString("es-AR")}</div>}
          {p.fechaCarga&&<div style={{fontSize:11,color:BRAND.muted,marginBottom:4}}>🕐 {p.fechaCarga}</div>}
          <span style={S.badge("Publicado")}>Publicado</span>
        </div>
      </div>
      {p.imagenPost&&(
        <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid "+BRAND.border,display:"flex",gap:16,justifyContent:"flex-end"}}>
          <a href={p.imagenPost} download={(p.nombre||"prenda").replace(/\s+/g,"-")+"-feed.jpg"} style={{fontSize:11,color:BRAND.primary,textDecoration:"none"}}>↓ Feed Instagram</a>
          {p.imagenStory&&<a href={p.imagenStory} download={(p.nombre||"prenda").replace(/\s+/g,"-")+"-story.jpg"} style={{fontSize:11,color:BRAND.primary,textDecoration:"none"}}>↓ Estado WhatsApp</a>}
        </div>
      )}
    </div>
  );
}

function agruparPorMes(items){
  const MESES=["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const grupos={};
  items.forEach(p=>{
    const partes=(p.fechaCarga||"").split("/");
    let label="Sin fecha";
    if(partes.length>=3){ const mes=MESES[parseInt(partes[1])]||partes[1]; const anio=partes[2]&&partes[2].split(",")[0]&&partes[2].split(",")[0].trim()||""; label=mes+" "+anio; }
    if(!grupos[label]) grupos[label]=[];
    grupos[label].push(p);
  });
  return grupos;
}

function AcordeonMes({ label, items }){
  const [abierto,setAbierto]=useState(true);
  return(
    <div style={{marginBottom:16}}>
      <button onClick={()=>setAbierto(a=>!a)} style={{width:"100%",background:"none",border:"1px solid "+(abierto?BRAND.primary:BRAND.borderLight),borderRadius:8,padding:"10px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,marginBottom:abierto?10:0}}>
        <span style={{fontSize:13,fontWeight:600,color:BRAND.primary,letterSpacing:"0.05em"}}>✦ {label}</span>
        <span style={{fontSize:11,color:BRAND.muted}}>{items.length} prenda{items.length!==1?"s":""}</span>
        <div style={{flex:1}}/>
        <span style={{color:BRAND.muted,fontSize:12,display:"inline-block",transform:abierto?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
      </button>
      {abierto&&items.map(p=><CardHistorial key={p.id} p={p}/>)}
    </div>
  );
}

const PASOS_GUIA=[
  {num:"01",titulo:"Cargar",icono:"📥",descripcion:"El punto de partida. Acá cargás los productos que te mandó el proveedor.",items:["Cada lote representa UNA prenda.","Pegá el texto del proveedor (nombre, talles, colores, precio mayorista).","Subí todas las fotos de esa prenda arrastrando o haciendo clic.","Si tenés más prendas, tocá '+ Otra prenda' y repetí.","Cuando cargaste todo, tocá 'Analizar todo'."],tip:"Podés cargar todas las prendas del lote semanal de una vez antes de analizar."},
  {num:"02",titulo:"Revisar",icono:"✏️",descripcion:"Revisás y corregís lo que analizó la IA antes de generar los posts.",items:["Verificá nombre, talles, colores y precio.","El precio minorista se calcula automáticamente con el 30% de margen.","Tocá una foto para elegir cuál usar. Si no elegís, la IA elige la mejor.","Seleccioná con el tilde las prendas que querés publicar.","Tocá 'Generar posts' para pasar al preview."],tip:"Si querés cambiar la foto, volvé a Revisar, tocá la foto y volvé a generar."},
  {num:"03",titulo:"Preview",icono:"👁️",descripcion:"Ves cómo va a quedar cada publicación antes de aprobarla.",items:["La IA genera el texto del post con el tono de ZINGARA.","Se genera la imagen con foto, precio y logo de la marca.","Podés editar el texto directamente.","Usá Regenerar si no te gusta el resultado.","Aprobá cada post individualmente o todos juntos."],tip:"Solo se publican los posts que aprobaste."},
  {num:"04",titulo:"Publicar",icono:"🚀",descripcion:"Confirmás la publicación y descargás las imágenes para WhatsApp.",items:["Ves cuántos productos se publicaron exitosamente.","Descargás todas las imágenes para WhatsApp Estado de una vez.","Las imágenes incluyen foto, nombre, precio, talles y colores.","Tocá Continuar para volver a Cargar con el próximo lote."],tip:"Las imágenes para WhatsApp tienen formato 9:16, perfecto para estados."},
  {num:"05",titulo:"Historial",icono:"📋",descripcion:"Todo lo que publicaste, organizado y siempre disponible.",items:["Las publicaciones se agrupan por mes.","Buscá cualquier prenda por nombre, color, talle o fecha.","Ves la fecha y hora exacta de cada publicación.","Podés descargar la imagen de feed o story de cualquier prenda."],tip:"El historial se guarda automáticamente y persiste al cerrar la app."},
];

const FAQS=[
  {q:"¿Por qué a veces tarda en analizar?",a:"La IA está procesando fotos y texto. En promedio 5-15 segundos por prenda."},
  {q:"¿Puedo cambiar el precio minorista?",a:"Sí, en Revisar podés editar el precio mayorista y el minorista se recalcula automáticamente."},
  {q:"¿Qué hago si la imagen no se genera?",a:"En Preview hay un botón Regenerar debajo de cada imagen."},
  {q:"¿El texto del post se puede editar?",a:"Sí, en Preview el texto es editable directamente."},
  {q:"¿Las imágenes de WhatsApp son diferentes?",a:"Sí. Para Instagram 1080x1080. Para WhatsApp Estado 1080x1920 con talles y colores incluidos."},
  {q:"¿Se guarda el historial?",a:"Sí, el historial se guarda automáticamente en tu navegador y persiste al cerrar la app."},
];

function PasoGuia(){
  const [pasoActivo,setPasoActivo]=useState(0);
  const [faqAbierta,setFaqAbierta]=useState(null);
  return(
    <div style={S.page}>
      <div style={S.title}>✦ Guía de uso</div>
      <div style={S.sub}>Aprendé a sacarle el máximo provecho a ZINGARA App.</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:24,flexWrap:"wrap"}}>
        {PASOS_GUIA.map((p,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={()=>setPasoActivo(i)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 12px",borderRadius:10,border:"1px solid "+(pasoActivo===i?BRAND.primary:BRAND.borderLight),background:pasoActivo===i?BRAND.surface2:"transparent",cursor:"pointer"}}>
              <span style={{fontSize:16}}>{p.icono}</span>
              <span style={{fontSize:11,color:pasoActivo===i?BRAND.primary:BRAND.muted,fontWeight:pasoActivo===i?600:400}}>{p.titulo}</span>
            </button>
            {i<PASOS_GUIA.length-1&&<span style={{color:BRAND.borderLight,fontSize:14}}>›</span>}
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:38,height:38,borderRadius:10,background:BRAND.surface2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{PASOS_GUIA[pasoActivo].icono}</div>
          <div>
            <div style={{fontSize:10,color:BRAND.muted,letterSpacing:"0.1em",textTransform:"uppercase"}}>Paso {PASOS_GUIA[pasoActivo].num}</div>
            <div style={{fontSize:15,fontWeight:600,color:BRAND.light}}>{PASOS_GUIA[pasoActivo].titulo}</div>
          </div>
        </div>
        <p style={{fontSize:13,color:BRAND.muted,marginBottom:14,lineHeight:1.7}}>{PASOS_GUIA[pasoActivo].descripcion}</p>
        <ul style={{margin:0,padding:0,listStyle:"none"}}>
          {PASOS_GUIA[pasoActivo].items.map((item,i)=>(
            <li key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}>
              <span style={{color:BRAND.primary,fontSize:12,marginTop:2,flexShrink:0}}>✦</span>
              <span style={{fontSize:13,color:BRAND.light,lineHeight:1.6}}>{item}</span>
            </li>
          ))}
        </ul>
        <div style={{marginTop:14,padding:"10px 14px",background:BRAND.surface2,borderRadius:8,borderLeft:"3px solid "+BRAND.primary}}>
          <span style={{fontSize:12,color:BRAND.primary,fontWeight:600}}>💡 Tip: </span>
          <span style={{fontSize:12,color:BRAND.muted}}>{PASOS_GUIA[pasoActivo].tip}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:16}}>
          <button onClick={()=>setPasoActivo(a=>Math.max(0,a-1))} disabled={pasoActivo===0} style={{padding:"6px 14px",borderRadius:6,border:"1px solid "+BRAND.borderLight,background:"transparent",color:pasoActivo===0?BRAND.borderLight:BRAND.light,cursor:pasoActivo===0?"not-allowed":"pointer",fontSize:12}}>← Anterior</button>
          <button onClick={()=>setPasoActivo(a=>Math.min(PASOS_GUIA.length-1,a+1))} disabled={pasoActivo===PASOS_GUIA.length-1} style={{padding:"6px 14px",borderRadius:6,border:"none",background:pasoActivo===PASOS_GUIA.length-1?"transparent":BRAND.primary,color:pasoActivo===PASOS_GUIA.length-1?BRAND.borderLight:BRAND.bg,cursor:pasoActivo===PASOS_GUIA.length-1?"not-allowed":"pointer",fontSize:12,fontWeight:600}}>Siguiente →</button>
        </div>
      </div>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:14,fontWeight:500,color:BRAND.light,marginBottom:12,letterSpacing:"0.05em"}}>✦ Preguntas frecuentes</div>
        {FAQS.map((f,i)=>(
          <div key={i} style={{borderBottom:"1px solid "+BRAND.border}}>
            <button onClick={()=>setFaqAbierta(faqAbierta===i?null:i)} style={{width:"100%",background:"none",border:"none",padding:"12px 0",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",gap:12}}>
              <span style={{fontSize:13,color:BRAND.light,textAlign:"left",fontWeight:faqAbierta===i?600:400}}>{f.q}</span>
              <span style={{color:BRAND.muted,fontSize:13,flexShrink:0,transform:faqAbierta===i?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
            </button>
            {faqAbierta===i&&<div style={{padding:"0 0 12px",fontSize:13,color:BRAND.muted,lineHeight:1.7}}>{f.a}</div>}
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={{fontSize:13,fontWeight:500,color:BRAND.light,marginBottom:12}}>✦ Próximamente</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[{i:"📸",t:"Publicación automática en Instagram"},{i:"💾",t:"Historial guardado entre sesiones"},{i:"📊",t:"Estadísticas de publicaciones"},{i:"🔔",t:"Recordatorios de publicación"}].map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:BRAND.surface2,borderRadius:8}}>
              <span style={{fontSize:14}}>{item.i}</span>
              <span style={{fontSize:12,color:BRAND.muted}}>{item.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PasoCarga({ onProductosCargados, resetKey }){
  const [lotes,setLotes]=useState([{id:Date.now(),texto:"",files:[],previews:[]}]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const refs=useRef({});

  useEffect(()=>{ setLotes([{id:Date.now(),texto:"",files:[],previews:[]}]); setError(""); },[resetKey]);

  const updateLote=(id,f,v)=>setLotes(ls=>ls.map(l=>l.id===id?Object.assign({},l,{[f]:v}):l));
  const handleImages=async(id,files)=>{
    const arr=Array.from(files);
    const previews=await Promise.all(arr.map(f=>fileToDataUrl(f)));
    setLotes(ls=>ls.map(l=>l.id===id?Object.assign({},l,{files:arr,previews}):l));
  };
  const removeLote=(id)=>setLotes(ls=>ls.filter(l=>l.id!==id));
  const addLote=()=>setLotes(ls=>[...ls,{id:Date.now(),texto:"",files:[],previews:[]}]);

  const analizar=async()=>{
    const validos=lotes.filter(l=>l.texto.trim()||l.files.length>0);
    if(!validos.length){setError("Agregá al menos un lote.");return;}
    setError(""); setLoading(true);
    const nuevos=[],errores=[];
    for(const lote of validos){
      try{
        const imgs=await Promise.all(lote.files.map(async f=>({type:"image",source:{type:"base64",media_type:f.type,data:await imgToBase64(f)}})));
        const prompt="Analizá este mensaje de proveedor de indumentaria argentina. Todas las imágenes son del MISMO producto.\nTexto: "+(lote.texto||"(sin texto)")+"\nReglas:\n- Nombre COMPLETO incluyendo tipo de prenda\n- Colores: incluí TODOS los colores visibles\n- Género: inferilo del tipo de prenda\n- Precio: 0 si no está claro\nDevolvé SOLO JSON sin backticks:\n{\"nombre\":\"\",\"descripcion\":\"\",\"talle\":\"\",\"color\":\"\",\"genero\":\"Mujer|Hombre|Unisex\",\"precioMayorista\":0}";
        const data=await callClaude({model:"claude-sonnet-4-20250514",max_tokens:10,messages:[{role:"user",content:[...imgs,{type:"text",text:prompt}]}]});
        if(data.error){errores.push(data.error.message);continue;}
        const raw=data.content&&data.content.find(b=>b.type==="text")&&data.content.find(b=>b.type==="text").text||"";
        if(!raw){errores.push("Respuesta vacía");continue;}
        const p=JSON.parse(raw.replace(/```json|```/g,"").trim());
        nuevos.push({id:Date.now()+Math.random(),nombre:p.nombre||"",descripcion:p.descripcion||"",talle:p.talle||"",color:p.color||"",genero:p.genero||"Unisex",precioMayorista:parseFloat(p.precioMayorista)||0,estado:"Pendiente",fotos:lote.previews,fotoElegida:null,postTexto:null,imagenPost:null,imagenStory:null});
      }catch(e){errores.push(e.message||"Error desconocido");}
    }
    if(!nuevos.length){setError("No se pudo analizar. "+errores.join(" | "));setLoading(false);return;}
    onProductosCargados(nuevos); setLoading(false);
  };

  return(
    <div style={S.page}>
      <div style={S.title}>✦ Cargar productos del proveedor</div>
      <div style={S.sub}>Cada lote = una prenda. Subí todas las fotos y el texto. Cuando tengas todo, analizá.</div>
      {lotes.map((lote,i)=>(
        <div key={lote.id} style={S.card}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
            <span style={{fontSize:12,color:BRAND.primary,fontWeight:600,letterSpacing:"0.05em"}}>PRENDA {i+1}</span>
            {lotes.length>1&&<button onClick={()=>removeLote(lote.id)} style={{background:"none",border:"none",cursor:"pointer",color:BRAND.muted,fontSize:14}}>✕</button>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div>
              <label style={S.label}>Texto del proveedor</label>
              <textarea value={lote.texto} onChange={e=>updateLote(lote.id,"texto",e.target.value)} rows={5} style={S.textarea} placeholder={"Remera oversize modal\nColores: negro, blanco\nTalles: S M L XL\nPrecio: $8500"}/>
            </div>
            <div>
              <label style={S.label}>Fotos ({lote.files.length})</label>
              <div onDrop={e=>{e.preventDefault();handleImages(lote.id,e.dataTransfer.files);}} onDragOver={e=>e.preventDefault()} onClick={()=>refs.current[lote.id]&&refs.current[lote.id].click()}
                style={{minHeight:80,border:"1px dashed "+BRAND.borderLight,borderRadius:8,cursor:"pointer",background:BRAND.surface2,padding:8,display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",justifyContent:lote.previews.length?"flex-start":"center"}}>
                {!lote.previews.length?<span style={{fontSize:12,color:BRAND.muted}}>Arrastrá o hacé clic · varias fotos</span>
                  :lote.previews.map((src,j)=><img key={j} src={src} alt="" style={{height:64,width:64,objectFit:"cover",borderRadius:4}}/>)}
              </div>
              <input ref={el=>refs.current[lote.id]=el} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>handleImages(lote.id,e.target.files)}/>
            </div>
          </div>
        </div>
      ))}
      {error&&<p style={{color:"#F87171",fontSize:13,margin:"0 0 12px"}}>{error}</p>}
      <div style={{display:"flex",gap:10}}>
        <button onClick={addLote} style={S.btn("ghost")}>+ Otra prenda</button>
        <button onClick={analizar} disabled={loading} style={Object.assign({},S.btn("primary"),{opacity:loading?0.6:1})}>
          {loading?"Analizando "+lotes.length+" prenda"+(lotes.length>1?"s":"")+"...":"Analizar todo ("+lotes.length+") →"}
        </button>
      </div>
    </div>
  );
}

function PasoPlanilla({ productos, setProductos, onGenerar }){
  const [sel,setSel]=useState({});
  const upd=(id,f,v)=>setProductos(ps=>ps.map(p=>p.id===id?Object.assign({},p,{[f]:v}):p));
  const rem=(id)=>setProductos(ps=>ps.filter(p=>p.id!==id));
  const toggleSel=(id)=>setSel(s=>Object.assign({},s,{[id]:!s[id]}));
  const todosSeleccionados=productos.length>0&&productos.every(p=>sel[p.id]);
  const toggleTodos=()=>todosSeleccionados?setSel({}):setSel(Object.fromEntries(productos.map(p=>[p.id,true])));
  const cant=productos.filter(p=>sel[p.id]).length;
  return(
    <div style={S.page}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div><div style={S.title}>✦ Revisá los productos</div><div style={S.sub}>{productos.length} prendas. Seleccioná las que querés publicar.</div></div>
        <button onClick={()=>onGenerar(productos.filter(p=>sel[p.id]))} disabled={!cant} style={Object.assign({},S.btn("primary"),{opacity:cant?1:0.4})}>Generar posts ({cant}) →</button>
      </div>
      {productos.length>0&&(
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,padding:"10px 16px",background:BRAND.surface,borderRadius:8,border:"1px solid "+BRAND.borderLight}}>
          <div onClick={toggleTodos} style={{width:18,height:18,borderRadius:4,border:"1.5px solid "+(todosSeleccionados?BRAND.primary:BRAND.borderLight),background:todosSeleccionados?BRAND.primary:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {todosSeleccionados&&<span style={{color:BRAND.bg,fontSize:12,fontWeight:700,lineHeight:1}}>✓</span>}
          </div>
          <span onClick={toggleTodos} style={{fontSize:13,color:BRAND.light,cursor:"pointer"}}>Seleccionar todas</span>
          {cant>0&&<span style={{fontSize:11,color:BRAND.muted,marginLeft:"auto"}}>{cant} de {productos.length} seleccionadas</span>}
        </div>
      )}
      {!productos.length&&<div style={{textAlign:"center",color:BRAND.muted,padding:"60px 0"}}>Cargá prendas primero.</div>}
      {productos.map(p=>(
        <div key={p.id} style={Object.assign({},S.card,{border:"1px solid "+(sel[p.id]?BRAND.primary:BRAND.border)})}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div onClick={()=>toggleSel(p.id)} style={{width:18,height:18,borderRadius:4,border:"1.5px solid "+(sel[p.id]?BRAND.primary:BRAND.borderLight),background:sel[p.id]?BRAND.primary:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {sel[p.id]&&<span style={{color:BRAND.bg,fontSize:12,fontWeight:700,lineHeight:1}}>✓</span>}
            </div>
            <span style={{fontSize:12,color:sel[p.id]?BRAND.primary:BRAND.muted,fontWeight:sel[p.id]?600:400}}>{sel[p.id]?"Seleccionada":"Clic para seleccionar"}</span>
          </div>
          <SelectorFoto fotos={p.fotos} fotoElegida={p.fotoElegida} onElegir={src=>{ upd(p.id,"fotoElegida",src); upd(p.id,"imagenPost",null); upd(p.id,"imagenStory",null); }}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 28px",gap:12,alignItems:"start",marginTop:4}}>
            <div><label style={S.label}>Nombre</label><input value={p.nombre} onChange={e=>upd(p.id,"nombre",e.target.value)} style={S.input}/></div>
            <div>
              <label style={S.label}>Talle</label><input value={p.talle} onChange={e=>upd(p.id,"talle",e.target.value)} style={Object.assign({},S.input,{marginBottom:6})}/>
              <label style={S.label}>Color</label><input value={p.color} onChange={e=>upd(p.id,"color",e.target.value)} style={S.input}/>
            </div>
            <div><label style={S.label}>Género</label><select value={p.genero} onChange={e=>upd(p.id,"genero",e.target.value)} style={S.select}><option>Mujer</option><option>Hombre</option><option>Unisex</option></select></div>
            <div>
              <label style={S.label}>P. Mayorista</label>
              <input type="number" value={p.precioMayorista} onChange={e=>upd(p.id,"precioMayorista",e.target.value)} style={Object.assign({},S.input,{marginBottom:4})}/>
              <div style={{fontSize:12,color:BRAND.primary,fontWeight:600}}>Min: {precioMin(p.precioMayorista)?"$ "+precioMin(p.precioMayorista).toLocaleString("es-AR"):"-"}</div>
            </div>
            <button onClick={()=>rem(p.id)} style={{background:"none",border:"none",cursor:"pointer",color:BRAND.muted,fontSize:16,paddingTop:4}}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PasoPreview({ productos, setProductos, onPublicar }){
  const [loadingTexto,setLoadingTexto]=useState({});
  const [loadingImg,setLoadingImg]=useState({});
  const [aprobados,setAprobados]=useState({});
  const [resultado,setResultado]=useState(null);
  const textosGenerados=useRef({});

  const generarTexto=useCallback(async(p)=>{
    if(textosGenerados.current[p.id]) return;
    textosGenerados.current[p.id]=true;
    setLoadingTexto(l=>Object.assign({},l,{[p.id]:true}));
    const precio=precioMin(p.precioMayorista);
    const prompt="Sos community manager de ZINGARA, marca de indumentaria argentina. Tono: moderno, místico, con actitud, elegante. Lenguaje argentino natural.\nProducto: "+p.nombre+" | Desc: "+p.descripcion+" | Colores: "+(p.color||"n/a")+" | Talles: "+(p.talle||"n/a")+" | Precio: "+(precio?"$ "+precio.toLocaleString("es-AR"):"consultar")+" | Género: "+p.genero+"\nDevolvé SOLO JSON sin backticks:\n{\"gancho\":\"frase impactante max 8 palabras\",\"cuerpo\":\"2-3 oraciones atractivas\",\"info\":\"colores talles precio con emojis\",\"cta\":\"llamada a la acción estilo ZINGARA\",\"hashtags\":\"15 hashtags relevantes\"}";
    try{
      const data=await callClaude({model:"claude-sonnet-4-20250514",max_tokens:10,messages:[{role:"user",content:[...imgs,{type:"text",text:prompt}]}]});
      if(data.error) throw new Error(data.error.message);
      const post=JSON.parse((data.content&&data.content.find(b=>b.type==="text")&&data.content.find(b=>b.type==="text").text||"").replace(/```json|```/g,"").trim());
      const txt=post.gancho+"\n\n"+post.cuerpo+"\n\n"+post.info+"\n\n"+post.cta+"\n\n"+post.hashtags;
      setProductos(ps=>ps.map(q=>q.id===p.id?Object.assign({},q,{postTexto:txt}):q));
    }catch(e){
      textosGenerados.current[p.id]=false;
      setProductos(ps=>ps.map(q=>q.id===p.id?Object.assign({},q,{postTexto:"Error: "+e.message}):q));
    }
    setLoadingTexto(l=>Object.assign({},l,{[p.id]:false}));
  },[]);

  const generarImg=useCallback(async(p)=>{
    setLoadingImg(l=>Object.assign({},l,{[p.id]:true}));
    const imgs=await generarImagenProducto(p);
    if(imgs){ setProductos(ps=>ps.map(q=>q.id===p.id?Object.assign({},q,{imagenPost:imgs.feed,imagenStory:imgs.story}):q)); }
    setLoadingImg(l=>Object.assign({},l,{[p.id]:false}));
  },[]);

  useEffect(()=>{
    productos.forEach(p=>{
      if(!p.postTexto) generarTexto(p);
      if(!p.imagenPost) generarImg(p);
    });
  },[]);

  const toggleAp=(id)=>setAprobados(a=>Object.assign({},a,{[id]:!a[id]}));
  const aprobarTodos=()=>setAprobados(Object.fromEntries(productos.filter(p=>p.postTexto).map(p=>[p.id,true])));
  const updTxt=(id,val)=>setProductos(ps=>ps.map(p=>p.id===id?Object.assign({},p,{postTexto:val}):p));
  const cant=productos.filter(p=>aprobados[p.id]).length;
  const listos=productos.filter(p=>p.postTexto).length;

  const handlePublicar=()=>{
    const sel=productos.filter(p=>aprobados[p.id]);
    setResultado({exitosos:sel.filter(p=>p.postTexto&&p.imagenPost),fallidos:sel.filter(p=>!p.postTexto||!p.imagenPost)});
  };

  if(resultado) return(
    <div style={S.page}>
      <div style={S.card}>
        {resultado.exitosos.length>0&&(
          <div>
            <div style={{textAlign:"center",marginBottom:28}}>
              <div style={{color:BRAND.primary,fontSize:32,marginBottom:8}}>✦</div>
              <div style={{color:BRAND.primary,fontSize:16,fontWeight:600,marginBottom:6}}>{resultado.exitosos.length} producto{resultado.exitosos.length!==1?"s":""} listo{resultado.exitosos.length!==1?"s":""}</div>
              <div style={{color:BRAND.muted,fontSize:13}}>Instagram se conecta en el próximo paso. Descargá las imágenes para WhatsApp.</div>
            </div>
            <div style={{background:BRAND.surface2,borderRadius:10,padding:"16px 20px",marginBottom:24}}>
              <div style={{fontSize:13,fontWeight:600,color:BRAND.light,marginBottom:4}}>📲 Estados de WhatsApp</div>
              <div style={{fontSize:12,color:BRAND.muted,marginBottom:14}}>Una imagen por prenda, lista para subir como estado.</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
                {resultado.exitosos.map(p=>{
                  const src=p.imagenStory||p.imagenPost||p.fotos&&p.fotos[0];
                  return(
                    <div key={p.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      {src&&<img src={src} alt="" style={{height:72,width:40,objectFit:"cover",borderRadius:4,border:"1px solid "+BRAND.borderLight,display:"block"}}/>}
                      <span style={{fontSize:9,color:BRAND.muted,maxWidth:42,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"center"}}>{p.nombre}</span>
                    </div>
                  );
                })}
              </div>
              <button onClick={()=>{ resultado.exitosos.forEach((p,i)=>{ const src=p.imagenStory||p.imagenPost; if(!src) return; setTimeout(()=>{ const a=document.createElement("a"); a.href=src; a.download="zingara-estado-"+(p.nombre||"prenda").replace(/\s+/g,"-")+".jpg"; document.body.appendChild(a); a.click(); document.body.removeChild(a); },i*400); }); }} style={Object.assign({},S.btn("primary"),{fontSize:12,padding:"8px 18px"})}>
                ↓ Descargar {resultado.exitosos.length} imagen{resultado.exitosos.length!==1?"es":""} para WhatsApp
              </button>
            </div>
          </div>
        )}
        {resultado.fallidos.length>0&&(
          <div style={{marginBottom:20}}>
            <div style={{color:"#F87171",fontSize:13,fontWeight:600,marginBottom:8}}>{resultado.fallidos.length} producto{resultado.fallidos.length!==1?"s":""} no se pudo{resultado.fallidos.length!==1?"ron":""} publicar</div>
            {resultado.fallidos.map(p=>(
              <div key={p.id} style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:8,padding:"8px 14px",marginBottom:6,fontSize:12,color:"#F87171"}}>
                <strong>{p.nombre}</strong> — {!p.postTexto?"falta texto":!p.imagenPost?"falta imagen":"error"}
              </div>
            ))}
          </div>
        )}
        <div style={{textAlign:"center",marginTop:8}}>
          <button onClick={()=>onPublicar(resultado.exitosos)} style={Object.assign({},S.btn("ghost"),{fontSize:13,padding:"9px 28px"})}>Continuar →</button>
        </div>
      </div>
    </div>
  );

  return(
    <div style={S.page}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div style={S.title}>✦ Preview y aprobación</div>
          <div style={S.sub}>{listos}/{productos.length} posts generados.</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {productos.length>1&&listos>0&&cant<listos&&<button onClick={aprobarTodos} style={Object.assign({},S.btn("ghost"),{fontSize:12,padding:"6px 14px"})}>Aprobar todos</button>}
          <button onClick={handlePublicar} disabled={!cant} style={Object.assign({},S.btn("primary"),{opacity:cant?1:0.4})}>Publicar aprobados ({cant})</button>
        </div>
      </div>
      {!productos.length&&<div style={{textAlign:"center",color:BRAND.muted,padding:"60px 0"}}>Seleccioná prendas en Revisar primero.</div>}
      {productos.map(p=>(
        <div key={p.id} style={Object.assign({},S.card,{border:"1px solid "+(aprobados[p.id]?BRAND.primary:BRAND.border)})}>
          <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:20}}>
            <div>
              <label style={Object.assign({},S.label,{marginBottom:8})}>Imagen del post</label>
              {loadingImg[p.id]?<Placeholder msg="Generando imagen..."/>
                :p.imagenPost?<div>
                  <img src={p.imagenPost} alt="" style={{width:"100%",aspectRatio:"1/1",objectFit:"cover",borderRadius:8,display:"block"}}/>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                    <a href={p.imagenPost} download={(p.nombre||"prenda").replace(/\s+/g,"-")+"-feed.jpg"} style={{fontSize:11,color:BRAND.primary,textDecoration:"none"}}>↓ Feed</a>
                    {p.imagenStory&&<a href={p.imagenStory} download={(p.nombre||"prenda").replace(/\s+/g,"-")+"-story.jpg"} style={{fontSize:11,color:BRAND.primary,textDecoration:"none"}}>↓ Story</a>}
                    <button onClick={()=>{ setProductos(ps=>ps.map(q=>q.id===p.id?Object.assign({},q,{imagenPost:null,imagenStory:null}):q)); setTimeout(()=>generarImg(p),50); }} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:BRAND.muted,padding:0}}>↺ Regenerar</button>
                  </div>
                </div>:<Placeholder msg="Generando imagen..."/>
              }
            </div>
            <div style={{display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div>
                  <span style={{fontSize:13,fontWeight:600,color:BRAND.light}}>{p.nombre}</span>
                  <span style={{fontSize:11,color:BRAND.muted,marginLeft:10}}>{p.genero} · {p.talle}</span>
                  {precioMin(p.precioMayorista)&&<span style={{fontSize:13,color:BRAND.primary,fontWeight:700,marginLeft:10}}>$ {precioMin(p.precioMayorista).toLocaleString("es-AR")}</span>}
                </div>
                <button onClick={()=>{textosGenerados.current[p.id]=false; generarTexto(p);}} disabled={loadingTexto[p.id]} style={Object.assign({},S.btn("ghost"),{fontSize:11,padding:"4px 10px"})}>
                  {loadingTexto[p.id]?"...":"Regenerar texto"}
                </button>
              </div>
              {loadingTexto[p.id]?<div style={{color:BRAND.muted,fontSize:13,padding:"16px 0",flex:1}}>Generando texto...</div>
                :<textarea value={p.postTexto||""} onChange={e=>updTxt(p.id,e.target.value)} rows={9} style={Object.assign({},S.textarea,{fontSize:12,lineHeight:1.7,flex:1})} placeholder="Generando..."/>
              }
              <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
                {p.postTexto&&<button onClick={()=>toggleAp(p.id)} style={Object.assign({},S.btn(aprobados[p.id]?"primary":"ghost"),{fontSize:12,padding:"5px 16px"})}>{aprobados[p.id]?"✓ Aprobado":"Aprobar"}</button>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PasoHistorial({ publicados }){
  const [busqueda,setBusqueda]=useState("");
  const filtrados=publicados.filter(p=>{
    const q=busqueda.toLowerCase();
    return !q||p.nombre&&p.nombre.toLowerCase().includes(q)||p.color&&p.color.toLowerCase().includes(q)||p.talle&&p.talle.toLowerCase().includes(q)||p.genero&&p.genero.toLowerCase().includes(q)||p.fechaCarga&&p.fechaCarga.includes(q);
  });
  const grupos=agruparPorMes(filtrados);
  return(
    <div style={S.page}>
      <div style={S.title}>✦ Historial de publicaciones</div>
      <div style={S.sub}>{publicados.length} productos publicados en total.</div>
      {publicados.length>0&&(
        <div style={{marginBottom:16,position:"relative"}}>
          <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar por nombre, color, talle, género o fecha..." style={Object.assign({},S.input,{paddingLeft:36})}/>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:BRAND.muted,fontSize:14}}>⌕</span>
          {busqueda&&<button onClick={()=>setBusqueda("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:BRAND.muted,fontSize:14}}>✕</button>}
        </div>
      )}
      {busqueda&&<div style={{fontSize:12,color:BRAND.muted,marginBottom:12}}>{filtrados.length} resultado{filtrados.length!==1?"s":""} para "{busqueda}"</div>}
      {!publicados.length&&<div style={Object.assign({},S.card,{textAlign:"center",padding:"48px 20px",color:BRAND.muted})}>Todavía no hay publicaciones.</div>}
      {publicados.length>0&&filtrados.length===0&&<div style={Object.assign({},S.card,{textAlign:"center",padding:"32px 20px",color:BRAND.muted})}>No se encontraron prendas para "{busqueda}".</div>}
      {Object.entries(grupos).map(function(entry){ return <AcordeonMes key={entry[0]} label={entry[0]} items={entry[1]}/>; })}
    </div>
  );
}

export default function App(){
  const [tab,setTab]=useState("carga");
  const [loteActual,setLoteActual]=useState([]);
  const [productos,setProductos]=useState([]);
  const [resetKey,setResetKey]=useState(0);
  const [previewKey,setPreviewKey]=useState(0);
  const [publicados,setPublicados]=useState(()=>{
    try{ const g=localStorage.getItem("zingara_historial"); return g?JSON.parse(g):[]; }catch{ return []; }
  });
  useEffect(()=>{
    try{ localStorage.setItem("zingara_historial",JSON.stringify(publicados)); }catch(e){}
  },[publicados]);

  const onProductosCargados=(nuevos)=>{ setLoteActual(ps=>[...ps,...nuevos]); setTab("planilla_edicion"); };
  const onGenerar=(sel)=>{ setProductos(sel); setPreviewKey(k=>k+1); setTab("preview"); };
  const onPublicar=(aprobados)=>{
    const ahora=new Date().toLocaleString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
    setPublicados(prev=>[...prev,...aprobados.map(p=>Object.assign({},p,{fechaCarga:ahora}))]);
    setLoteActual([]); setProductos([]); setResetKey(k=>k+1); setPreviewKey(k=>k+1); setTab("carga");
  };

  const tabs=[{id:"carga",label:"Cargar"},{id:"planilla_edicion",label:"Revisar"},{id:"preview",label:"Preview"},{id:"historial",label:"Historial"},{id:"guia",label:"Guía"}];

  return(
    <div style={S.app}>
      <div style={S.header}>
        <div style={S.logo}>✦ ZINGARA</div>
        <nav style={{display:"flex",gap:4}}>{tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={S.navBtn(tab===t.id)}>{t.label}</button>)}</nav>
      </div>
      <div style={{display:tab==="carga"?"block":"none"}}><PasoCarga onProductosCargados={onProductosCargados} resetKey={resetKey}/></div>
      <div style={{display:tab==="planilla_edicion"?"block":"none"}}><PasoPlanilla productos={loteActual} setProductos={setLoteActual} onGenerar={onGenerar}/></div>
      <div style={{display:tab==="preview"?"block":"none"}}><PasoPreview key={previewKey} productos={productos} setProductos={setProductos} onPublicar={onPublicar}/></div>
      <div style={{display:tab==="historial"?"block":"none"}}><PasoHistorial publicados={publicados}/></div>
      <div style={{display:tab==="guia"?"block":"none"}}><PasoGuia/></div>
    </div>
  );
}