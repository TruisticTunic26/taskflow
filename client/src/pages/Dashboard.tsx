import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function Dashboard() {
    const navigate = useNavigate();
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    useEffect(() => {
        const fetchWorkspaces = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await axios.get('http://localhost:5000/api/workspaces', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setWorkspaces(response.data);
            } catch (error) {
                console.log(error);
            }
        };

        fetchWorkspaces();
    }, []);

    const createWorkspace = async (workspaceName: string) => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/workspaces', { name: workspaceName }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setWorkspaces([...workspaces, response.data]);
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'left', gap: '20px', width: '40%' }}>
            <h1>Dashboard</h1>

            <div style={{ display: 'flex', gap: '20px', flexDirection: 'row', width: '100%' }}>
                <label> Create new workspace</label>
                <input type="text" placeholder="Workspace name" id="workspaceName" />
                <button onClick={async () => {
                    const workspaceName = (document.getElementById('workspaceName') as HTMLInputElement).value;
                    await createWorkspace(workspaceName);
                }}> Create </button>
            </div>

            {workspaces.map((workspace: any) => (
                <div key={workspace._id} style={{ border: '1px solid black', padding: '10px', margin: '10px', width: '90%' }}>
                    <h2>{workspace.name}</h2>
                    <button onClick={() => navigate(`/workspace/${workspace._id}`)}> Enter workspace </button>
                </div>
            ))}
        </div>
    );
}

export default Dashboard;