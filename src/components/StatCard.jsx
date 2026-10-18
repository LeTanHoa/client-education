import {ArrowUpRight}from'lucide-react';
export default function StatCard({icon,title,value,note,tone='blue'}){return <article className="stat-card"><span className={'stat-icon '+tone}>{icon}</span><p>{title}</p><strong>{value}</strong><small>{note&&<><ArrowUpRight size={13}/>{note}</>}</small></article>}
