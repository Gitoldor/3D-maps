const cors = {
 "Access-Control-Allow-Methods":"GET, OPTIONS",
 "Access-Control-Allow-Headers":"Content-Type",
 "Access-Control-Max-Age":"86400",
 "Vary":"Origin"
};
function response(data,status,origin){
 const allowed=origin==="https://gitoldor.github.io"||origin.startsWith("http://localhost:")||origin.startsWith("http://127.0.0.1:")||origin==="http://localhost"||origin==="http://127.0.0.1";
 const headers={
  "Content-Type":"application/json; charset=utf-8",
  "Cache-Control":"no-store",
  "X-Sho1re1-API":"v2",
  ...cors,
  "Access-Control-Allow-Origin":allowed?origin:"https://gitoldor.github.io"
 };
 return new Response(JSON.stringify(data),{status,headers});
}
export default {
 async fetch(request,env){
  const origin=request.headers.get("Origin")||"";
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{
   ...cors,
   "Access-Control-Allow-Origin":(origin==="https://gitoldor.github.io"||origin.startsWith("http://localhost:")||origin.startsWith("http://127.0.0.1:")||origin==="http://localhost"||origin==="http://127.0.0.1")?origin:"https://gitoldor.github.io"
  }});
  if(request.method!=="GET")return response({error:"Method not allowed"},405,origin);
  const path=new URL(request.url).pathname;
  try{
   if(!env.DB)throw new Error("D1 binding DB is missing from this Worker deployment");
   if(path==="/api/health"){
    const row=await env.DB.prepare("SELECT COUNT(*) AS total FROM posts").first();
    return response({ok:true,database:"connected",posts:row?.total??0,api:"v2"},200,origin);
   }
   if(path==="/api/categories"){
    const {results=[]}=await env.DB.prepare("SELECT id,name,slug FROM categories ORDER BY name").all();
    return response({categories:results},200,origin);
   }
   if(path==="/api/posts"){
    const {results=[]}=await env.DB.prepare("SELECT p.id,p.title,p.description,p.location_name,p.area,p.latitude,p.longitude,p.plan,p.created_at,c.name AS category,u.display_name AS contributor,p.is_demo FROM posts p JOIN categories c ON c.id=p.category_id JOIN users u ON u.id=p.user_id WHERE p.status='published' ORDER BY p.created_at DESC LIMIT 200").all();
    return response({posts:results},200,origin);
   }
   return response({error:"Not found",path},404,origin);
  }catch(error){
   return response({error:"Database query failed",detail:String(error?.message||error),api:"v2"},500,origin);
  }
 }
};