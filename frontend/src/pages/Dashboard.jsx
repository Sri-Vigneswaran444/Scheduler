import React, {useEffect, useState} from 'react';
import axios from 'axios';

export default function Dashboard(){
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({title:'', startTime:'', endTime:''});

  async function load(){ const res = await axios.get('/events'); setEvents(res.data); }

  useEffect(()=>{ load(); },[]);

  async function create(e){
    e.preventDefault();
    await axios.post('/events', form);
    setForm({title:'', startTime:'', endTime:''});
    load();
  }

  async function toggleSwappable(ev){
    const newStatus = ev.status==='SWAPPABLE' ? 'BUSY' : 'SWAPPABLE';
    await axios.put('/events/'+ev.id, { status: newStatus });
    load();
  }

  return (<div>
    <h2>My Events</h2>
    <form onSubmit={create} className="card">
      <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
      <input placeholder="startTime" value={form.startTime} onChange={e=>setForm({...form,startTime:e.target.value})} />
      <input placeholder="endTime" value={form.endTime} onChange={e=>setForm({...form,endTime:e.target.value})} />
      <button>Create</button>
    </form>
    {events.map(ev=>(
      <div key={ev.id} className="card row">
        <div style={{flex:1}}>
          <strong>{ev.title}</strong><div>{ev.startTime} → {ev.endTime}</div>
          <div>Status: {ev.status}</div>
        </div>
        <div>
          <button onClick={()=>toggleSwappable(ev)}>{ev.status==='SWAPPABLE' ? 'Make Busy' : 'Make Swappable'}</button>
        </div>
      </div>
    ))}
  </div>);
}
