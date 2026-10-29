// Kept inline in the document head: works even when the application bundle fails.
export function bootMonitoringScript(url: string | undefined, key: string | undefined) {
  const config = JSON.stringify({ url: url ? `${url.replace(/\/+$/, "")}/rest/v1/website_reliability_events` : "", key: key || "" }).replace(/</g, "\\u003c");
  return `
(function(){
  var config=${config};
  var store='td-reliability-v1', queue=[], seen={}, sending=false, recovered=false;
  var started=performance.now(), maxAge=7*86400000;
  function save(){try{localStorage.setItem(store,JSON.stringify(queue));}catch(e){}}
  try{
    var saved=JSON.parse(localStorage.getItem(store)||'[]');
    if(Array.isArray(saved)) queue=saved.filter(function(x){return x&&x.savedAt>Date.now()-maxAge&&x.row;}).slice(-12);
  }catch(e){}
  function flush(){
    if(sending||!queue.length||!config.url||!config.key) return;
    sending=true;
    var item=queue[0];
    fetch(config.url,{
      method:'POST',keepalive:true,credentials:'omit',
      headers:{'Content-Type':'application/json','apikey':config.key,'Prefer':'return=minimal'},
      body:JSON.stringify(item.row)
    }).then(function(response){
      if(response.ok||response.status===409){queue=queue.filter(function(x){return x.row.id!==item.row.id;});save();}
      else throw new Error('delivery deferred');
      sending=false;flush();
    }).catch(function(){sending=false;});
  }
  function page(){
    var path=location.pathname.replace(/\\/+$/,'')||'/';
    var pages={'/':'home','/privacy':'privacy','/guides/ai-dubbing-guide':'guide','/guides':'guide','/pricing':'pricing','/docs':'docs','/changelog':'changelog'};
    return pages[path]||'other';
  }
  window.__tdRecordReliability=function(type,kind){
    kind=kind||'none';
    if(['retry_shown','load_failure','retry_clicked','load_recovered'].indexOf(type)<0) return;
    if(type==='load_failure'?['script','stylesheet','runtime','boundary'].indexOf(kind)<0:kind!=='none') return;
    var dedup=type+':'+kind;
    if(seen[dedup]) return;
    seen[dedup]=true;
    if(type==='retry_shown'||type==='load_failure') recovered=true;
    try{
      queue.push({savedAt:Date.now(),row:{id:crypto.randomUUID(),event_type:type,page:page(),elapsed_ms:Math.min(3600000,Math.max(0,Math.round(performance.now()-started))),failure_kind:kind}});
      queue=queue.slice(-12);save();flush();
    }catch(e){}
  };
  window.__tdBootReady=function(){
    window.__tdBooted=true;
    clearTimeout(window.__tdBootTimer);
    if(recovered) window.__tdRecordReliability('load_recovered');
    flush();
  };
  window.__tdBootTimer=setTimeout(function(){
    var el=document.getElementById('td-boot');
    if(el&&!window.__tdBooted){el.classList.add('td-boot-slow');window.__tdRecordReliability('retry_shown');}
  },12000);
  window.addEventListener('error',function(e){
    if(window.__tdBooted) return;
    var t=e.target;
    if(t&&t.tagName==='SCRIPT') window.__tdRecordReliability('load_failure','script');
    else if(t&&t.tagName==='LINK'&&t.rel==='stylesheet') window.__tdRecordReliability('load_failure','stylesheet');
    else if(t===window) window.__tdRecordReliability('load_failure','runtime');
  },true);
  window.addEventListener('unhandledrejection',function(){
    if(!window.__tdBooted) window.__tdRecordReliability('load_failure','runtime');
  });
  window.addEventListener('online',flush);
  document.addEventListener('click',function(e){
    if(e.target&&e.target.id==='td-boot-reload'){
      window.__tdRecordReliability('retry_clicked');flush();window.location.reload();
    }
  });
  flush();
})();
`;
}

type MonitoredWindow = Window & {
  __tdBootReady?: () => void;
  __tdRecordReliability?: (type: string, kind?: string) => void;
};

export function recordPageBoundaryFailure() {
  (window as MonitoredWindow).__tdRecordReliability?.("load_failure", "boundary");
}

export function markBootReady() {
  (window as MonitoredWindow).__tdBootReady?.();
}