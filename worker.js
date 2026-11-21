const cors = {
 "Access-Control-Allow-Origin":"https://gitoldor.github.io",
 "Access-Control-Allow-Methods":"GET, OPTIONS",
 "Access-Control-Allow-Headers":"Content-Type",
 "Access-Control-Max-Age":"86400",
 "Vary":"Origin"
};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8",...cors,"Cache-Control":"no-store"}});
export default {
 async fetch(request,env){
  const origin=request.headers.get("Origin")||"";
  const allowed=origin==="https://gitoldor.github.io"||origin.startsWith("http://localhost:")||origin.startsWith("http://127.0.0.1:")||origin==="http://localhost"||origin==="http://127.0.0.1";
  const headers={...cors,"Access-Control-Allow-Origin":allowed?origin:"https://gitoldor.github.io"};
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers});
  if(request.method!=="GET")return reply({error:"Method not allowed"},405);
  const path=new URL(request.url).pathname;
  try{
   if(path==="/api/health"){const row=await env.DB.prepare("SELECT COUNT(*) AS total FROM posts").first();return reply({ok:true,database:"connected",posts:row?.total??0});}
   if(path==="/api/categories"){const {results=[]}=await env.DB.prepare("SELECT id,name,slug FROM categories ORDER BY name").all();return reply({categories:results});}
   if(path==="/api/posts"){
    const {results=[]}=await env.DB.prepare("SELECT p.id,p.title,p.description,p.location_name,p.area,p.latitude,p.longitude,p.plan,p.created_at,c.name AS category,u.display_name AS contributor,p.is_demo FROM posts p JOIN categories c ON c.id=p.category_id JOIN users u ON u.id=p.user_id WHERE p.status='published' ORDER BY p.created_at DESC LIMIT 200").all();
    return reply({posts:results});
   }
   return reply({error:"Not found"},404);
  }catch(error){return reply({error:"Database query failed",detail:String(error?.message||error)},500);}
 }
};