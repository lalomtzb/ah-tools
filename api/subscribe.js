// Vercel Serverless Function — Culture Check
// 1) Da de alta el correo como contacto en Brevo (lista BREVO_LIST_ID, por defecto 3).
// 2) Envía por correo el REPORTE COMPLETO del diagnóstico (Brevo transactional, smtp/email).
// La API key vive SOLO aquí en el servidor (env BREVO_API_KEY), nunca en el navegador.
//
// Env vars (Vercel):
//   BREVO_API_KEY        (obligatoria)  -> Brevo > SMTP & API > API Keys
//   BREVO_LIST_ID        (opcional)     -> ID de la lista de contactos (default 3)
//   REPORT_SENDER_EMAIL  (opcional)     -> remitente (default info@absurdlyhuman.com; debe estar verificado en Brevo)
//
// Seguridad: el servidor arma el HTML desde datos validados (no reenvía HTML del cliente).
// Los links del CTA se restringen al dominio absurdlyhuman.com y todo texto se escapa.
// Nota anti-abuso: endpoint anónimo. Si se detecta abuso, agregar rate-limit (p.ej. Upstash/Vercel KV).

const SENDER_EMAIL = process.env.REPORT_SENDER_EMAIL || 'info@absurdlyhuman.com';
const SENDER_NAME = 'Absurdly Human';
const LOGO_URL = 'https://pulse.absurdlyhuman.com/ah-lockup-white.png';
const TOOLKITS_URL = 'https://www.absurdlyhuman.com/toolkits-1';

function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function num(v){var n=Number(v);if(!isFinite(n))n=0;if(n<0)n=0;if(n>5)n=5;return n;}
function fnum(v){return num(v).toFixed(2);}
function hex(v){return /^#[0-9a-fA-F]{3,8}$/.test(v)?v:'#1E4D8C';}
function short(v,max){return String(v==null?'':v).slice(0,max||200);}
function safeLink(v){var s=String(v==null?'':v);return /^https:\/\/([a-z0-9-]+\.)*absurdlyhuman\.com\//i.test(s)?s:'';}

function buildReportEmail(p){
  var en=(p.lang==='en');
  var L = en ? {
    subject:'Your Culture Check report · Absurdly Human',
    title:'Your Culture Check report',
    intro:"Here's your team's culture read across 5 dimensions — and where we'd start.",
    overall:'Overall index', dims:'Your 5 dimensions', focus:'Where to start',
    also:'Also worth a look', free:'Try this now (free):',
    footer:"This report is a self-assessment. Your answers aren't shared with anyone.",
    cta_default:'Learn more'
  } : {
    subject:'Tu reporte de Culture Check · Absurdly Human',
    title:'Tu reporte de Culture Check',
    intro:'Aquí está la lectura del clima de tu equipo en 5 dimensiones — y por dónde empezaríamos.',
    overall:'Índice general', dims:'Tus 5 dimensiones', focus:'Por dónde empezar',
    also:'También conviene mirar', free:'Prueba esto ahora (gratis):',
    footer:'Este reporte es un autodiagnóstico. Tus respuestas no se comparten con nadie.',
    cta_default:'Conocer más'
  };
  var NAVY='#0D1B3D', INK='#0D1B3D', MUTED='#5b6577', LINE='#e4e8f0', BG='#f4f5f7';

  var dims = Array.isArray(p.dims)?p.dims.slice(0,8):[];
  var rows = dims.map(function(d){
    var w=Math.max(Math.round((num(d.score)-1)/4*100),4);
    return '<tr>'
      +'<td style="padding:8px 0;font:600 14px Arial,Helvetica,sans-serif;color:'+INK+';white-space:nowrap">'
        +'<span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:'+hex(d.color)+';margin-right:8px"></span>'+esc(short(d.name,80))
      +'</td>'
      +'<td style="padding:8px 0 8px 12px;width:60%">'
        +'<div style="background:'+LINE+';border-radius:6px;height:10px"><div style="background:'+hex(d.hex)+';height:10px;border-radius:6px;width:'+w+'%"></div></div>'
      +'</td>'
      +'<td style="padding:8px 0 8px 12px;text-align:right;white-space:nowrap">'
        +'<span style="display:inline-block;background:'+hex(d.hex)+';color:#fff;font:700 12px Arial,Helvetica,sans-serif;padding:3px 8px;border-radius:20px">'+esc(short(d.band,40))+' · '+fnum(d.score)+'</span>'
      +'</td></tr>';
  }).join('');

  var pr=p.primary||{};
  var link=TOOLKITS_URL;
  var ctaTxt=esc(short(String(pr.recCta||'').replace(/\s*→\s*$/,''),60))||esc(L.cta_default);
  var ctaHtml=link?'<a href="'+link+'" style="display:inline-block;background:'+NAVY+';color:#fff;text-decoration:none;font:700 15px Arial,Helvetica,sans-serif;padding:12px 22px;border-radius:8px">'+ctaTxt+' →</a>':'';
  var freeHtml=pr.free?'<div style="background:#eef2fb;border-radius:8px;padding:12px 14px;margin:10px 0;font:14px Arial,Helvetica,sans-serif;color:'+INK+'"><b>'+esc(L.free)+'</b><br>'+esc(short(pr.free,400))+'</div>':'';

  var overallHtml='';
  if(p.overall){
    overallHtml='<div style="text-align:center;margin:6px 0 18px">'
      +'<span style="display:inline-block;background:'+hex(p.overall.hex)+';color:#fff;font:700 13px Arial,Helvetica,sans-serif;padding:5px 12px;border-radius:20px">'+esc(short(p.overall.band,40))+'</span>'
      +'<div style="font:700 15px Arial,Helvetica,sans-serif;color:'+MUTED+';margin-top:8px">'+esc(L.overall)+': '+fnum(p.overall.score)+' / 5</div></div>';
  }

  var sec=p.secondary||{};
  var secLink=TOOLKITS_URL;
  var secHtml=sec.name?'<div style="border-top:1px solid '+LINE+';margin-top:18px;padding-top:14px;font:14px Arial,Helvetica,sans-serif;color:'+MUTED+'">'
      +'<b style="color:'+INK+'">'+esc(L.also)+':</b> '+esc(short(sec.name,80))+' ('+esc(short(sec.band,40))+' · '+fnum(sec.score)+') — '
      +(secLink?'<a href="'+secLink+'" style="color:#1E4D8C">'+esc(short(sec.recName,80))+'</a>':esc(short(sec.recName,80)))+'</div>':'';

  var focusHtml=pr.name?'<div style="background:#f7f9fc;border:1px solid '+LINE+';border-radius:12px;padding:18px;margin-top:14px">'
      +'<div style="font:700 12px Arial,Helvetica,sans-serif;letter-spacing:.5px;color:#1E4D8C;text-transform:uppercase">'+esc(L.focus)+'</div>'
      +'<div style="font:700 19px Arial,Helvetica,sans-serif;color:'+INK+';margin:6px 0 2px">'+esc(short(pr.name,80))+' · '+esc(short(pr.band,40))+' ('+fnum(pr.score)+')</div>'
      +(pr.note?'<p style="font:14px Arial,Helvetica,sans-serif;color:'+MUTED+';margin:6px 0 10px">'+esc(short(pr.note,400))+'</p>':'')
      +freeHtml
      +(pr.recName?'<div style="font:600 16px Arial,Helvetica,sans-serif;color:'+INK+';margin-top:6px">'+esc(short(pr.recName,80))+'</div>':'')
      +(pr.recDesc?'<p style="font:14px Arial,Helvetica,sans-serif;color:'+MUTED+';margin:4px 0 12px">'+esc(short(pr.recDesc,400))+'</p>':'')
      +ctaHtml+'</div>':'';

  var dimsHtml=rows?'<div style="font:700 16px Arial,Helvetica,sans-serif;color:'+INK+';margin:18px 0 6px">'+esc(L.dims)+'</div>'
      +'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">'+rows+'</table>':'';

  var html='<!doctype html><html><body style="margin:0;background:'+BG+';padding:24px 0">'
    +'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:'+BG+'"><tr><td align="center">'
    +'<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:14px;overflow:hidden">'
    +'<tr><td style="background:'+NAVY+';padding:22px 26px">'
      +'<a href="https://www.absurdlyhuman.com" style="text-decoration:none"><img src="'+LOGO_URL+'" alt="Absurdly Human" width="200" style="display:block;width:200px;max-width:62%;height:auto;border:0"></a>'
      +'<div style="font:700 12px Arial,Helvetica,sans-serif;letter-spacing:1px;color:#9fb0d6;text-transform:uppercase;margin-top:12px">Culture Check</div></td></tr>'
    +'<tr><td style="padding:26px">'
      +'<h1 style="font:800 22px Arial,Helvetica,sans-serif;color:'+INK+';margin:0 0 6px">'+esc(L.title)+'</h1>'
      +'<p style="font:15px Arial,Helvetica,sans-serif;color:'+MUTED+';margin:0 0 14px">'+esc(L.intro)+'</p>'
      +overallHtml+dimsHtml+focusHtml+secHtml+'</td></tr>'
    +'<tr><td style="padding:16px 26px 26px">'
      +'<div style="border-top:1px solid '+LINE+';padding-top:14px;font:12px Arial,Helvetica,sans-serif;color:'+MUTED+'">'+esc(L.footer)+'</div>'
      +'<div style="font:700 13px Arial,Helvetica,sans-serif;color:'+INK+';margin-top:8px">Corporate Life. Human Reactions.</div></td></tr>'
    +'</table></td></tr></table></body></html>';

  var text=L.title+'\n\n'+L.intro+'\n';
  if(p.overall) text+='\n'+L.overall+': '+fnum(p.overall.score)+'/5 ('+short(p.overall.band,40)+')\n';
  if(dims.length){text+='\n'+L.dims+':\n';dims.forEach(function(d){text+='- '+short(d.name,80)+': '+fnum(d.score)+'/5 ('+short(d.band,40)+')\n';});}
  if(pr.name){text+='\n'+L.focus+': '+short(pr.name,80)+' ('+short(pr.band,40)+' '+fnum(pr.score)+')\n';if(pr.recName)text+=short(pr.recName,80)+(link?' — '+link:'')+'\n';}
  text+='\nCorporate Life. Human Reactions.';

  return {subject:L.subject, html:html, text:text, hasReport:dims.length>=3};
}

async function addContact(KEY, email, source, focus){
  var LIST_ID=Number(process.env.BREVO_LIST_ID||3);
  var send=function(payload){return fetch('https://api.brevo.com/v3/contacts',{method:'POST',headers:{'api-key':KEY,'Content-Type':'application/json','accept':'application/json'},body:JSON.stringify(payload)});};
  var withAttrs={email:email,listIds:[LIST_ID],updateEnabled:true,attributes:{SOURCE:source,FOCUS:focus}};
  var base={email:email,listIds:[LIST_ID],updateEnabled:true};
  try{ var r=await send(withAttrs); if(r.status===400){ r=await send(base); } return (r.ok||r.status===204); }
  catch(e){ return false; }
}

async function sendReport(KEY, email, subject, html, text){
  var r=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':KEY,'Content-Type':'application/json','accept':'application/json'},
    body:JSON.stringify({sender:{name:SENDER_NAME,email:SENDER_EMAIL},to:[{email:email}],subject:subject,htmlContent:html,textContent:text})});
  if(r.ok) return {ok:true};
  var detail=''; try{ detail=await r.text(); }catch(e){}
  return {ok:false, status:r.status, detail:String(detail).slice(0,300)};
}

export default async function handler(req,res){
  if(req.method!=='POST'){ res.status(405).json({error:'Method not allowed'}); return; }
  var body=req.body;
  if(typeof body==='string'){ try{ body=JSON.parse(body); }catch(e){ body={}; } }
  body=body||{};
  var email=String(body.email||'').trim();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ res.status(400).json({error:'invalid email'}); return; }
  var KEY=process.env.BREVO_API_KEY;
  if(!KEY){ res.status(500).json({error:'server not configured (missing BREVO_API_KEY)'}); return; }

  var source=String(body.source||'').slice(0,60);
  var focus=String(body.focus||'').slice(0,120);

  var contactOk=await addContact(KEY, email, source, focus);

  var mail=buildReportEmail({
    lang:(body.lang==='en'?'en':'es'),
    overall:body.overall||null,
    dims:body.dims||[],
    primary:body.primary||{},
    secondary:body.secondary||{}
  });

  if(!mail.hasReport){ res.status(200).json({ok:true, contact:contactOk, report:false}); return; }

  var sent=await sendReport(KEY, email, mail.subject, mail.html, mail.text);
  if(sent.ok){ res.status(200).json({ok:true, contact:contactOk, report:true}); return; }
  res.status(502).json({ok:false, error:'brevo-email', status:sent.status, detail:sent.detail});
}

export { buildReportEmail };
