import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';


function Workspace() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [workspaceName, setWorkspaceName] = useState('');
    const { id } = useParams();
    const [ownerId, setOwnerId] = useState('');
    const [currentUserId, setCurrentUserId] = useState('');

    useEffect(() => {
        const fetchTasks = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const decoded: any = jwtDecode(token);
            setCurrentUserId(decoded.id);

            try {
                const response = await axios.get(`http://localhost:5000/api/tasks?workspaceId=${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setTasks(response.data);

                const workspaceResponse = await axios.get(`http://localhost:5000/api/workspaces/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setWorkspaceName(workspaceResponse.data.name);
                setMembers(workspaceResponse.data.members);
                setOwnerId(workspaceResponse.data.owner);

            } catch (error) {
                console.log(error);
            }
        };

        fetchTasks();
    }, [id]);

    const handleAssignTask = async (taskId: string, userId: string) => {
        try {
            const token = localStorage.getItem('token');
            const updatedTask = await axios.put(
                `http://localhost:5000/api/tasks/${taskId}`,
                { assignedTo: userId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setTasks((prevTasks) => prevTasks.map((task) => (task._id === taskId ? updatedTask.data : task)));
            // Refresh the tasks list or update the specific task
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div>
            <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            <h1>{workspaceName}</h1>
            <ul>
                {tasks.map((task: any) => (
                    <div key={task._id} style={{ alignItems: 'left', width: '40%', height: "250px", border: "3px solid black" }}>
                        <p style={{ margin: '10px', fontSize: '24px' }}>{task.title}</p>
                        <p style={{ margin: '10px', fontSize: '16px' }}> Assigned to: {task.assignedTo.name}</p>

                        {currentUserId === ownerId && (
                            <select onChange={(e) => handleAssignTask(task._id, e.target.value)} style={{ margin: '10px' }}>
                                <option value="">Select a user</option>
                                {members.map((member: any) => (
                                    <option key={member._id} value={member._id}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        <p style={{ margin: '10px', fontSize: '16px', width: '90%', height: '40%', border: '1px solid black', textAlign: 'left' }}> {task.description}</p>
                    </div>
                ))}
            </ul>
        </div>
    );
}

export default Workspace;