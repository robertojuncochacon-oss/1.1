// KBLLB Plus for Kino TV — apiVersion 6, ES module.
const SEARCH = "https://html.duckduckgo.com/html/";
const SOURCES = [
  ["ZoeChip","https://zoechip.bz/","movies"],
  ["Cinebros","https://cinebros.net/","movies"],
  ["Zenox","https://zenox.lol/","movies"],
  ["RedFlix","https://redflix.one/","movies"],
  ["Nexa","https://nexa.mov/","movies"],
  ["Flixer","https://flixer.gd/","movies"],
  ["BoredFlix","https://boredflix.to/","movies"],
  ["LeonFlix","https://leonflix.net/","movies"],
  ["AniChi","https://anichi.to/","anime"],
  ["AnimeSalt","https://animesalt.to/","anime"],
  ["AniHQ","https://anihq.org/","anime"],
  ["Mirrors","https://mirrors.st/","movies"],
  ["TheTVApp","https://thetvapp.st/","live"],
  ["AuraSports","https://aurasports.xyz/","live"],
  ["DamiTV","https://damitv.st/","live"],
  ["Footballia","https://footballia.net/","live"],
  ["MLBLive","https://mlblive.net/","live"],
  ["TimeSoccerTV","https://timesoccertv.com/","live"],
  ["WCOStream","https://wcostream.org/","anime"],
  ["KissCartoon","https://kisscartoon.nz/","anime"],
  ["KimCartoon","https://kimcartoon.li/","anime"]
];

function safeText(s) {
  return String(s || "").replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ").trim();
}
function attr(tag, name) {
  const m = String(tag || "").match(new RegExp(name + '=["\\']([^"\\']+)["\\']', "i"));
  return m ? m[1].replace(/&amp;/g, "&") : "";
}
function sourceKind(query) {
  const q = String(query || "").toLowerCase();
  if (/anime|manga|cartoon|dibujos/.test(q)) return "anime";
  if (/deporte|fútbol|futbol|nba|mlb|tv en directo|live|partido/.test(q)) return "live";
  if (/serie|temporada|episodio/.test(q)) return "series";
  return "movies";
}
export async function home() {
  return [
    { id:"kbllb-movies", title:"Películas y series", items:SOURCES.filter(s=>s[2]==="movies").map((s,i)=>({id:"src-"+i,title:s[0],kind:"movie",url:s[1],ref:s[1],overview:"Abrir fuente externa"})) },
    { id:"kbllb-anime", title:"Anime y dibujos", items:SOURCES.filter(s=>s[2]==="anime").map((s,i)=>({id:"anime-"+i,title:s[0],kind:"series",url:s[1],ref:s[1],overview:"Abrir fuente externa"})) },
    { id:"kbllb-live", title:"Deportes y TV en directo", items:SOURCES.filter(s=>s[2]==="live").map((s,i)=>({id:"live-"+i,title:s[0],kind:"movie",url:s[1],ref:s[1],overview:"Abrir fuente externa"})) }
  ];
}
export async function browse(category) {
  const c = String(category && (category.id || category.category || category) || "").toLowerCase();
  const selected = c.includes("anime") ? "anime" : (c.includes("live") || c.includes("deport")) ? "live" : "movies";
  return SOURCES.filter(s=>s[2]===selected).map((s,i)=>({id:selected+"-"+i,title:s[0],kind:selected==="anime"?"series":"movie",url:s[1],ref:s[1],overview:"Abrir fuente externa"}));
}
export async function search(input) {
  const q = String(input && (input.q || input.query) || "").trim();
  if (!q) return [];
  const category = sourceKind(q);
  const tasks = SOURCES.filter(s=>s[2]===category).slice(0,12).map(async (source, index) => {
    const searchUrl = SEARCH + "?q=" + encodeURIComponent("site:"+source[1].replace(/^https?:\\/\\//, "").split("/")[0]+" "+q);
    try {
      const response = await kino.fetch(searchUrl,{headers:{Accept:"text/html"}});
      if (!response.ok) return [];
      const html = await response.text();
      const results = [];
      const re = /<a[^>]*class=["'][^"']*result__a[^"']*["'][^>]*>[\s\S]*?<\/a>/gi;
      let match;
      while ((match = re.exec(html)) && results.length < 4) {
        const tag = match[0];
        const href = attr(tag,"href");
        const title = safeText(tag.replace(/^[\s\S]*?>/,"").replace(/<\/a>[\s\S]*$/,""));
        if (!href || !title) continue;
        let decoded = href;
        const uddg = href.match(/[?&]uddg=([^&]+)/);
        if (uddg) { try { decoded = decodeURIComponent(uddg[1]); } catch (_) {} }
        if (!/^https?:\/\//i.test(decoded)) continue;
        results.push({id:"kbllb-"+index+"-"+results.length,title,kind:category==="anime"?"series":"movie",url:decoded,ref:decoded,overview:"Resultado web · "+source[0]});
      }
      return results;
    } catch (_) { return []; }
  });
  const groups = await Promise.all(tasks);
  const flattened = groups.flat();
  return flattened.slice(0,40);
}
export async function resolve(ref) {
  const target = String(ref || "");
  if (!/^https?:\/\//i.test(target)) throw kino.error("unavailable","El enlace no es válido.");
  // Keep playback within the provider's own page; do not pretend an embed page is a direct media stream.
  return { url:target, mime:"text/html", label:"Abrir proveedor externo", browser:true };
}
