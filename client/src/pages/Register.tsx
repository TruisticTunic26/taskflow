import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');

    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', {
                name: username,
                email: email,
                password: password,
            });
            localStorage.setItem('token', response.data.token);
            navigate('/dashboard');
        } catch (error) {
            console.log('Registration failed');
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'left', gap: '10px', width: '40%' }}>

                <h1>Register</h1>
                <p>Create a new account</p>

                <p> Username: </p>
                <input type="text" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} />

                <p>Email: </p>
                <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />

                <p>Password: </p>
                <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />

                <button type="submit">Register</button>
                <button type="button" onClick={() => navigate('/login')}>Already have an account? Login</button>
            </div>
        </form>
    );
}

export default Register;