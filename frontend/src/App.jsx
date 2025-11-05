import React, { useState, useEffect } from 'react'
import './App.css';
import axios from 'axios'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Marketplace from './pages/Marketplace'
import Requests from './pages/Requests'

const API = import.meta.env.VITE_API || 'http://localhost:4000/api';

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [page, setPage] = useState('dashboard');

  axios.defaults.baseURL = API;
  axios.interceptors.request.use(cfg=>{
    if(token) cfg.headers.Authorization = 'Bearer '+token;
    return cfg;
  });

  useEffect(()=>{
    if(token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  },[token]);

  if(!token) return <Auth onLogin={(t)=>{setToken(t); setPage('dashboard')}} />;

  return (
    <div className="app">
      <header>
        <h1>Slot Swap</h1>
        <nav>
          <button onClick={()=>setPage('dashboard')}>My Calendar</button>
          <button onClick={()=>setPage('market')}>Marketplace</button>
          <button onClick={()=>setPage('requests')}>Requests</button>
          <button onClick={()=>{ setToken(null); }}>Logout</button>
        </nav>
      </header>
      <main>
        {page==='dashboard' && <Dashboard />}
        {page==='market' && <Marketplace />}
        {page==='requests' && <Requests />}
      </main>
    </div>
  );
}
