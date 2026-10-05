window.__ig="pending";(async function(){
  var code = location.pathname.split('/reel/')[1].replace('/','');
  var A='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'; var id=0n; for (var ch of code) id = id*64n + BigInt(A.indexOf(ch));
  var r = await fetch('/api/v1/media/'+id+'/info/', {headers:{'x-ig-app-id':'936619743392459'}, credentials:'include'});
  if(!r.ok) return 'HTTP '+r.status;
  var j = await r.json(); var it = j.items && j.items[0]; if(!it) return 'no item';
  var vv = (it.video_versions||[]).sort(function(a,b){return b.width-a.width;});
  return JSON.stringify({pk: String(it.pk), url: vv[0]&&vv[0].url, dur: it.video_duration, likes: it.like_count, comments: it.comment_count, plays: it.play_count||it.ig_play_count||it.view_count, taken: it.taken_at, caption: it.caption&&it.caption.text});
})().then(function(x){window.__ig=x;}).catch(function(e){window.__ig="ERR "+e;}); "started"
