const cors=o=>({"Access-Control-Allow-Origin":o==="https://gitoldor.github.io"||/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)?o:"https://gitoldor.github.io","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Access-Control-Max-Age":"86400","Vary":"Origin"});
const out=(d,s,o)=>new Response(JSON.stringify(d),{status:s,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Store-API":"1",...cors(o)}});
const clean=(v,n=240)=>String(v??"").trim().slice(0,n);
const arr=v=>{try{const a=JSON.parse(v||"[]");return Array.isArray(a)?a:[]}catch{return[]}};
export default{async fetch(req,env){
 const origin=req.headers.get("Origin")||"";if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
 const u=new URL(req.url);
 try{
  if(!env.DB)throw Error("D1 binding DB is missing");
  if(req.method==="GET"&&u.pathname==="/api/health"){
   const [p,c,o]=await Promise.all([env.DB.prepare("SELECT COUNT(*) n FROM products WHERE active=1").first(),env.DB.prepare("SELECT COUNT(*) n FROM categories").first(),env.DB.prepare("SELECT COUNT(*) n FROM orders").first()]);
   return out({ok:true,database:"connected",products:p.n,categories:c.n,orders:o.n,store:"FORME"},200,origin)
  }
  if(req.method==="GET"&&u.pathname==="/api/categories"){
   const {results=[]}=await env.DB.prepare("SELECT id,name,slug FROM categories ORDER BY sort_order,name").all();return out({categories:results},200,origin)
  }
  if(req.method==="GET"&&u.pathname==="/api/products"){
   const w=["p.active=1"],b=[],cat=clean(u.searchParams.get("category"),40),q=clean(u.searchParams.get("q"),80);
   if(cat&&cat!=="all"){w.push("c.slug=?");b.push(cat)}if(q){w.push("(p.name LIKE ? OR p.description LIKE ?)");b.push("%"+q+"%","%"+q+"%")}
   const {results=[]}=await env.DB.prepare("SELECT p.id,p.slug,p.name,p.description,p.price,p.compare_at_price,p.image_url,p.sizes_json,p.colors_json,p.stock,p.featured,c.name category,c.slug category_slug FROM products p JOIN categories c ON c.id=p.category_id WHERE "+w.join(" AND ")+" ORDER BY p.featured DESC,p.id").bind(...b).all();
   return out({products:results.map(p=>({...p,sizes:arr(p.sizes_json),colors:arr(p.colors_json),sizes_json:undefined,colors_json:undefined}))},200,origin)
  }
  if(req.method==="POST"&&u.pathname==="/api/orders"){
   const x=await req.json(),name=clean(x.name,90),phone=clean(x.phone,20).replace(/[^0-9+]/g,""),email=clean(x.email,120),address=clean(x.address,500),notes=clean(x.notes,500),items=Array.isArray(x.items)?x.items.slice(0,12):[];
   if(name.length<2||phone.replace(/\D/g,"").length<10||address.length<8||!items.length)return out({error:"Enter your name, valid phone, delivery address and at least one item."},400,origin);
   const lines=[];let subtotal=0;
   for(const i of items){const id=clean(i.productId,40),qty=Math.max(1,Math.min(5,parseInt(i.quantity,10)||1)),size=clean(i.size,24),color=clean(i.color,32),p=await env.DB.prepare("SELECT id,name,price,stock,sizes_json,colors_json FROM products WHERE id=? AND active=1").bind(id).first();
    if(!p)return out({error:"A selected product is unavailable. Refresh and try again."},409,origin);
    if(p.stock<qty)return out({error:p.name+" has only "+p.stock+" left."},409,origin);
    if((arr(p.sizes_json).length&&!arr(p.sizes_json).includes(size))||(arr(p.colors_json).length&&!arr(p.colors_json).includes(color)))return out({error:"Choose a valid size and colour for "+p.name+"."},400,origin);
    const line=p.price*qty;subtotal+=line;lines.push({...p,size,color,qty,line})
   }
   const shipping=subtotal>=1999?0:99,total=subtotal+shipping,old=await env.DB.prepare("SELECT id FROM customers WHERE phone=?").bind(phone).first(),customer=old?.id||crypto.randomUUID(),order=crypto.randomUUID(),number="FM"+Date.now().toString().slice(-8)+Math.floor(Math.random()*90+10);
   const batch=[env.DB.prepare("INSERT INTO customers(id,name,phone,email) VALUES(?,?,?,?) ON CONFLICT(phone) DO UPDATE SET name=excluded.name,email=excluded.email").bind(customer,name,phone,email||null),env.DB.prepare("INSERT INTO orders(id,order_number,customer_id,address,notes,subtotal,shipping,total,status) VALUES(?,?,?,?,?,?,?,?, 'pending')").bind(order,number,customer,address,notes||null,subtotal,shipping,total)];
   for(const l of lines){batch.push(env.DB.prepare("UPDATE products SET stock=stock-? WHERE id=?").bind(l.qty,l.id));batch.push(env.DB.prepare("INSERT INTO order_items(id,order_id,product_id,product_name,size,color,quantity,unit_price,line_total) VALUES(?,?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(),order,l.id,l.name,l.size,l.color,l.qty,l.price,l.line))}
   await env.DB.batch(batch);return out({ok:true,orderNumber:number,subtotal,shipping,total,status:"pending"},201,origin)
  }
  return out({error:"Not found"},404,origin)
 }catch(e){const m=String(e?.message||e),s=/stock/i.test(m)?409:500;return out({error:s===409?"Stock changed. Refresh and retry.":"Store API error",detail:m},s,origin)}
}};