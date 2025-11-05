import React, {useState} from 'react';
import axios from 'axios';
const API = import.meta.env.VITE_API || 'http://localhost:4000/api';

function Auth({ onLogin }){
  const [mode, setMode] = useState('login');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [name,setName] = useState('');

  async function submit(e){
    e.preventDefault();
    try{
      const url = mode==='login' ? '/auth/login' : '/auth/signup';
      const res = await axios.post(API+url, mode==='login' ? { email, password } : { name, email, password });
      onLogin(res.data.token);
    }catch(err){
      alert(err?.response?.data?.message || err.message);
    }
  }

  return (
    <div style={{maxWidth:420, margin:'40px auto'}}>
      <h2>{mode==='login' ? 'Log in' : 'Sign up'}</h2>
      <form onSubmit={submit}>
        {mode==='signup' && <div><label>Name</label><input value={name} onChange={e=>setName(e.target.value)} /></div>}
        <div><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
        <div style={{marginTop:10}}>
          <button type="submit">{mode==='login' ? 'Log in' : 'Create account'}</button>
          <button type="button" onClick={()=>setMode(mode==='login' ? 'signup' : 'login')} style={{marginLeft:8}}>
            {mode==='login' ? 'Sign up' : 'Switch to login'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Auth;
