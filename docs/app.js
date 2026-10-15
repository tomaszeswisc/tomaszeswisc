const $=s=>document.querySelector(s);
let snapshot;
function render(data,live=false){
  const u=data.user,rs=data.repositories;
  $('#repos').textContent=u.public_repos;$('#followers').textContent=u.followers;$('#following').textContent=u.following;
  $('#stars').textContent=rs.reduce((a,r)=>a+r.stargazers_count,0);
  const counts={};rs.forEach(r=>{const lang=r.language||'Não identificada';counts[lang]=(counts[lang]||0)+1});
  $('#languages').replaceChildren(...Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([name,count])=>{
    const row=document.createElement('div');row.className='language';const text=document.createElement('span');text.textContent=name;
    const meter=document.createElement('meter');meter.min=0;meter.max=rs.length;meter.value=count;meter.setAttribute('aria-label',name);
    const total=document.createElement('span');total.textContent=`${count} repo${count===1?'':'s'}`;row.append(text,meter,total);return row;
  }));
  $('#status').textContent=`${live?'Atualizado agora':'Consulta salva'} · ${new Date(data.fetched_at).toLocaleString('pt-BR')} · API pública GitHub.`;
}
fetch('data.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{snapshot=d;render(d)}).catch(()=>{$('#status').textContent='Dados da consulta original exibidos. A atualização está disponível no botão acima.'});
$('#refresh').addEventListener('click',async()=>{
 const button=$('#refresh');button.disabled=true;$('#status').textContent='Consultando o GitHub…';
 try{
  const get=async path=>{const r=await fetch(`https://api.github.com/${path}`);if(!r.ok)throw Error();return r.json()};
  const user=await get('users/tomaszeswisc'),repositories=[];
  for(let page=1;;page++){const chunk=await get(`users/tomaszeswisc/repos?per_page=100&page=${page}`);repositories.push(...chunk);if(chunk.length<100)break}
  render({user,repositories,fetched_at:new Date().toISOString()},true);
 }catch{$('#status').textContent='GitHub indisponível ou limite de consultas atingido. Mantida a última consulta; tente novamente mais tarde.'}finally{button.disabled=false}
});
$('#search').addEventListener('input',e=>{let count=0;document.querySelectorAll('.project').forEach(c=>{c.hidden=!c.dataset.search.includes(e.target.value.toLowerCase().trim());if(!c.hidden)count++});$('#empty').hidden=count>0});
$('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText('tomaszeswisc@gmail.com');$('#copy-status').textContent='E-mail copiado!'}catch{$('#copy-status').textContent='Copie: tomaszeswisc@gmail.com'}});
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){document.querySelectorAll('nav a').forEach(a=>{const active=a.hash===`#${e.target.id}`;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}})},{rootMargin:'-15% 0px -55% 0px'});document.querySelectorAll('main section').forEach(s=>observer.observe(s));

fetch('contributions.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{const days=data.days.slice(-140);const grid=document.querySelector('#heatmap');grid.replaceChildren(...days.map(d=>{const cell=document.createElement('i');cell.dataset.level=d.level;cell.title=`${d.date}: intensidade ${d.level}/4`;return cell}));document.querySelector('#heatmap-period').textContent=`${days[0].date} — ${days.at(-1).date} · GitHub`}).catch(()=>{document.querySelector('#heatmap').textContent='Consulte as contribuições no GitHub.'});
