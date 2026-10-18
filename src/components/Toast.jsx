import{useEffect,useState}from'react';
import{AlertCircle,CheckCircle2,Info,X}from'lucide-react';

export const toast={success:message=>emit('success',message),error:message=>emit('error',message),info:message=>emit('info',message)};
function emit(type,message){if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('hoc-vui-toast',{detail:{type,message:String(message||'')}}))}

export default function ToastContainer(){const[items,setItems]=useState([]);useEffect(()=>{const add=event=>{const id=Date.now()+Math.random(),item={...event.detail,id};setItems(current=>[...current,item]);setTimeout(()=>setItems(current=>current.filter(value=>value.id!==id)),4200)};window.addEventListener('hoc-vui-toast',add);return()=>window.removeEventListener('hoc-vui-toast',add)},[]);const close=id=>setItems(current=>current.filter(item=>item.id!==id));return <div className="toast-stack" aria-live="polite" aria-atomic="false">{items.map(item=><div className={'toast toast-'+item.type} role={item.type==='error'?'alert':'status'} key={item.id}>{item.type==='success'?<CheckCircle2 size={19}/>:item.type==='error'?<AlertCircle size={19}/>:<Info size={19}/>}<span>{item.message}</span><button aria-label="Đóng thông báo" onClick={()=>close(item.id)}><X size={16}/></button></div>)}</div>}
