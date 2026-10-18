import Sidebar from'../components/Sidebar';import TopBar from'../components/TopBar';
export default function WorkspaceLayout({role,active,navigate,onLogout,children}){return <div className={`workspace ${role}`}><Sidebar role={role} active={active} navigate={navigate} onLogout={onLogout}/><div className="workspace-page"><TopBar/>{children}</div></div>}
