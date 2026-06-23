import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { io } from 'socket.io-client';

function Workspace() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [workspaceName, setWorkspaceName] = useState('');
    const { id } = useParams();
    const [ownerId, setOwnerId] = useState('');
    const [currentUserId, setCurrentUserId] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [dueDate, setDueDate] = useState('');
    const [taskAssignedTo, setTaskAssignedTo] = useState('');
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [inviteEmail, setInviteEmail] = useState('');

    const handleEditClick = (task: any) => {
        setEditingTaskId(task._id);
        setEditForm({
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: task.status,
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
            assignedTo: task.assignedTo?._id || ''
        });
    };

    const handleDeleteTask = async (task: any) => {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:5000/api/tasks/${task._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('deleted', task._id);
            setTasks((prev) => prev.filter((t) => t._id !== task._id));
        } catch (error) {
            console.log(error);
        }
    };

    const handleInviteUser = async () => {
        const token = localStorage.getItem('token');
        try {
            await axios.post(`http://localhost:5000/api/workspaces/${id}/invite`,
                { email: inviteEmail },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setInviteEmail('');
        } catch (error) {
            console.log(error);
        }
    };

    const handleSaveEdit = async (taskId: string) => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.put(`http://localhost:5000/api/tasks/${taskId}`, editForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks((prev) => prev.map((t) => (t._id === taskId ? response.data : t)));
            setEditingTaskId(null);
        } catch (error) {
            console.log(error);
        }
    };

    const handleSubmitTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        console.log('Submitting task with data:', { title, description, priority, dueDate, taskAssignedTo, workspace: id });
        const body = { title, description, priority, dueDate, assignedTo: taskAssignedTo, workspace: id };

        try {
            const response = await axios.post('http://localhost:5000/api/tasks', body, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks([...tasks, response.data]);
            setShowForm(false);
            setTitle('');
            setDescription('');
            setDueDate('');
            setTaskAssignedTo('');
        } catch (error) {
            console.log(error);
        }
    };

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
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTasks(response.data);

                const workspaceResponse = await axios.get(`http://localhost:5000/api/workspaces/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setWorkspaceName(workspaceResponse.data.name);
                setMembers(workspaceResponse.data.members);
                setOwnerId(workspaceResponse.data.owner);

            } catch (error) {
                console.log(error);
            }
        };

        fetchTasks();

        const socket = io('http://localhost:5000');
        socket.emit('joinWorkspace', id);

        socket.on('taskUpdated', (updatedTask: any) => {
            setTasks((prevTasks) => prevTasks.map((task) =>
                task._id === updatedTask._id ? updatedTask : task
            ));
        });

        socket.on('taskCreated', (newTask: any) => {
            setTasks((prevTasks) => [...prevTasks, newTask]);
        });

        socket.on('taskDeleted', (deletedTaskId: string) => {
            setTasks((prevTasks) => prevTasks.filter((task) => task._id !== deletedTaskId));
        });

        return () => {
            socket.disconnect();
        };
    }, [id]);

    return (
        <div>
            <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>

            <h1>{workspaceName}</h1>
            <button onClick={() => { setEditingTaskId(null); setShowForm(true); }}>Create Task</button>

            {showForm && (
                <form onSubmit={handleSubmitTask} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
                    <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

                    <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>

                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

                    <select value={taskAssignedTo} onChange={(e) => setTaskAssignedTo(e.target.value)}>
                        <option value="">Assign to</option>
                        {members.map((member: any) => (
                            <option key={member._id} value={member._id}>{member.name}</option>
                        ))}
                    </select>

                    <button type="submit">Submit</button>
                    <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                </form>
            )}

            <div style={{ flexDirection: 'row', display: 'flex', gap: '20px', marginTop: '20px' }}>
                <label> Invite user: </label>
                <input type="email" placeholder="Enter user email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                <button onClick={handleInviteUser}>Invite</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
                {tasks.map((task: any) => {
                    const canEdit = currentUserId === ownerId ||
                        (task.assignedTo && task.assignedTo._id === currentUserId);
                    console.log('ownerId:', ownerId);
                    console.log('currentUserId:', currentUserId);
                    return (
                        <div key={task._id} style={{ width: '40%', border: '3px solid black', padding: '10px', flexDirection: 'column', display: 'flex', gap: '10px' }}>

                            {editingTaskId === task._id ? (
                                <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                            ) : (
                                <p style={{ fontSize: '24px', margin: 0 }}>{task.title}</p>
                            )}

                            {editingTaskId === task._id ? (
                                <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                            ) : (
                                <p style={{ margin: 0 }}>{task.description}</p>
                            )}

                            {editingTaskId === task._id ? (
                                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                                    <option value="To-Do">To-Do</option>
                                    <option value="In-Progress">In-Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            ) : (
                                <p style={{ margin: 0 }}>Status: {task.status}</p>
                            )}

                            {editingTaskId === task._id ? (
                                <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            ) : (
                                <p style={{ margin: 0 }}>Priority: {task.priority}</p>
                            )}

                            {editingTaskId === task._id ? (
                                <input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} />
                            ) : (
                                <p style={{ margin: 0 }}>Due Date: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}</p>
                            )}

                            {editingTaskId === task._id ? (
                                <select value={editForm.assignedTo} onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}>
                                    <option value="">Assign to</option>
                                    {members.map((member: any) => (
                                        <option key={member._id} value={member._id}>{member.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <p style={{ margin: 0 }}>Assigned to: {task.assignedTo ? task.assignedTo.name : 'Not assigned'}</p>
                            )}

                            {editingTaskId === task._id ? (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button onClick={() => handleSaveEdit(task._id)}>Save</button>
                                    <button onClick={() => setEditingTaskId(null)}>Cancel</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexDirection: 'row' }}>
                                    {canEdit && (
                                        <>
                                            <button onClick={() => handleEditClick(task)}>Edit task</button>
                                            <button onClick={() => handleDeleteTask(task)}>Delete task</button>
                                        </>
                                    )}
                                </div>
                            )}

                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Workspace;