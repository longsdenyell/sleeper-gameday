import React,{useState,useEffect,useRef} from "react";

// utils
const nf1=new Intl.NumberFormat(undefined,{minimumFractionDigits:1,maximumFractionDigits:1});
const cls=(...x)=>x.filter(Boolean).join(" ");
const POS_COLORS={QB:"bg-orange-500 text-black",RB:"bg-emerald-500 text-black",WR:"bg-sky-500 text-black",TE:"bg-violet-500 text-black",K:"bg-yellow-400 text-black",DEF:"bg-gray-400 text-black",DST:"bg-gray-400 text-black"};
const SLOT_ACCEPTS={QB:["QB"],RB:["RB"],WR:["WR"],TE:["TE"],K:["K"],DEF:["DEF","DST"],DST:["DEF","DST"],FLEX:["RB","WR","TE"],REC_FLEX:["WR","TE"],SUPER_FLEX:["QB","RB","WR","TE"],IDP_FLEX:["DL","LB","DB"],DL:["DL"],LB:["LB"],DB:["DB"]};
const NON_START=new Set(["BN","BENCH","TAXI","IR","RESERVE"]);
const buildSlots=l=>(l?.roster_positions||[]).filter(x=>!NON_START.has(String(x).toUpperCase()));

// external API keys
const CONFIG={
  ODDS:"cfe873cc67910e5d0133cb8266d0cfee",
  WX:"c18e2b2874475ad111873f1fafa40e32"
};

// ---------- MiniCard ----------
function MiniCard({id,league,data,playerName,playerPos,scoreFlash,tileFlash,onPromote}){
  return(
    <div className={cls("mb-2 cursor-pointer rounded-lg border p-2 text-xs hover:bg-gray-800",tileFlash&&"tile-flash")} onClick={()=>onPromote&&onPromote(id)}>
      <div className="flex justify-between">
        <span className="font-semibold">{league.name}</span>
        <span className={cls("tabular-nums",scoreFlash&&"score-flash")}>{nf1.format(data?.points_me||0)}-{nf1.format(data?.points_opp||0)}</span>
      </div>
    </div>
  );
}

// ---------- LineupCard ----------
function LineupCard({league,data,players,playerName,playerPos}){
  const slots=buildSlots(league),starters=data?.starters_me||[],bench=data?.bench_me||[],pts=data?.players_points_me||{};
  const [odds,setOdds]=useState({}),[wx,setWx]=useState({});
  const norm=s=>String(s||"").toUpperCase().replace(/[^A-Z0-9]/g,""); const team=pid=>norm(players?.[pid]?.team||"");
  useEffect(()=>{(async()=>{
    try{
      const sb=await fetch("https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard").then(r=>r.json());
      const evs=sb.events||[];
      // odds
      try{
        const arr=await fetch(`https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds?regions=us&markets=spreads,totals&apiKey=${CONFIG.ODDS}`).then(r=>r.json());
        const map={}; for(const g of arr){const N=n=>norm(n);const h=N(g.home_team),a=N(g.away_team);let tot=null,sp=null;
          for(const m of g.bookmakers?.[0]?.markets||[]){if(m.key==="totals")tot=m.outcomes?.[0]?.point; if(m.key==="spreads"){const o=m.outcomes?.find(o=>N(o.name)===h);if(o)sp=o.point}}
          if(tot){if(sp!=null){map[h]={it:tot/2-sp/2};map[a]={it:tot/2+sp/2}}else{map[h]=map[a]={it:tot/2}}}
        } setOdds(map);
      }catch(e){console.error("odds err",e);}
      // weather
      const wmap={}; for(const ev of evs){const c=ev.competitions?.[0],v=c?.venue,lat=v?.address?.latitude||v?.latitude,lon=v?.address?.longitude||v?.longitude;if(!lat||!lon)continue;
        try{const cur=(await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&appid=${CONFIG.WX}`).then(r=>r.json()))?.current||{};
          const sum={t:cur.temp,w:cur.wind_speed,d:cur.weather?.[0]?.description}; for(const tm of c.competitors){wmap[norm(tm.team?.displayName||tm.team?.abbreviation)]=sum;}
        }catch(e){console.error("wx err",e);}
      } setWx(wmap);
    }catch(e){console.error("ext err",e);}
  })()},[]);
  const posCls=p=>POS_COLORS[p]||"bg-gray-600 text-white";
  return(
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4 rounded-lg bg-[#0e1116] p-3">
        <div className="text-[11px] uppercase tracking-wide text-gray-400">Quick score</div>
        <div className="text-right font-semibold text-white">{nf1.format(data?.points_me||0)} <span className="text-gray-500">vs</span> {nf1.format(data?.points_opp||0)}</div>
      </div>
      {slots.map((slot,i)=>{const accepts=SLOT_ACCEPTS[slot]||[slot],sid=starters[i],spos=sid?playerPos(sid):"",sname=sid?playerName(sid):null,spts=sid?pts[sid]||0:0,benchE=bench.filter(pid=>accepts.includes(playerPos(pid)));
        const t=team(sid),v=odds[t],w=wx[t];
        return(
          <div key={i} className="rounded-xl border border-gray-800 bg-[#0e1116] p-3">
            <div className="mb-2 flex justify-between text-xs text-gray-400"><span>{slot}</span><span>{accepts.join("/")}</span></div>
            <div className="mb-2 rounded-lg border border-gray-800 bg-[#0d1014] p-2">
              {sid?<>
                <div className="flex justify-between"><div className="flex min-w-0 items-center gap-2">
                  <span className={cls("h-6 rounded-md px-2 text-[11px] font-bold flex items-center",posCls(spos))}>{spos||"--"}</span>
                  <span className="truncate text-sm">{sname}</span></div>
                  <span className="font-semibold">{nf1.format(spts)}</span></div>
                <div className="mt-1 grid grid-cols-3 gap-2 text-[10px] text-gray-400">
                  <div>Vegas: {v?nf1.format(v.it):"—"}</div>
                  <div>Wx: {w?`${Math.round(w.t)}°C ${Math.round(w.w)}m/s`:"—"}</div>
                  <div>{w?.d||"—"}</div>
                </div>
              </>:<div className="text-sm text-gray-500">— No starter</div>}
            </div>
            <div className="mb-1 text-[12px] text-gray-300">Bench</div>
            <ul className="space-y-1">{benchE.length?benchE.slice(0,5).map(pid=>
              <li key={pid} className="flex justify-between text-[13px]">
                <div className="flex min-w-0 items-center gap-2"><span className="rounded bg-gray-700 px-1.5 py-0.5 text-[10px]">{playerPos(pid)}</span><span className="truncate">{playerName(pid)}</span></div>
                <span className="text-xs text-gray-300">{nf1.format(pts[pid]||0)}</span>
              </li>):<li className="text-[13px] text-gray-500">—</li>}</ul>
          </div>
        );})}
    </div>);
}

// ---------- Main App ----------
export default function App(){
  const [view,setView]=useState("board");
  const [featured,setFeatured]=useState([]),[lineup,setLineup]=useState([]);
  const [leagues,setLeagues]=useState([]),[matchups,setMatchups]=useState({}),[players,setPlayers]=useState({});
  const playerName=id=>players?.[id]?.full_name||id,playerPos=id=>players?.[id]?.position||"";
  // TODO: implement fetch from Sleeper user/leagues/matchups/players like before
  // For brevity, assume leagues/matchups/players are already set
  
  return(
    <div className="min-h-screen bg-black text-white p-4">
      <div className="mb-4 flex gap-2">
        <button onClick={()=>setView("board")} className={cls("px-3 py-1 rounded",view==="board"?"bg-blue-600":"bg-gray-700")}>Board</button>
        <button onClick={()=>setView("lineup")} className={cls("px-3 py-1 rounded",view==="lineup"?"bg-blue-600":"bg-gray-700")}>Lineup</button>
      </div>
      {view==="board"?
        <div>Board view here (focus tiles + minicards)</div>:
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            {lineup[0]?<LineupCard league={leagues.find(l=>l.league_id===lineup[0])} data={matchups[lineup[0]]} players={players} playerName={playerName} playerPos={playerPos}/>:
              <div className="p-6 text-center text-gray-500 border rounded">Drag a league here</div>}
          </div>
          <div>{leagues.map(l=><MiniCard key={l.league_id} id={l.league_id} league={l} data={matchups[l.league_id]} playerName={playerName} playerPos={playerPos} onPromote={id=>setLineup([id])}/>)}</div>
        </div>}
    </div>);
}
