export default function ProgressBar({value,color='green'}){return <div className="progress-line"><i className={color} style={{width:`${value}%`}}/></div>}
