import React, {useEffect, useState} from 'react';
import axios from 'axios';

export default function Requests(){
  const [incoming,setIncoming]=useState([]);
  const [outgoing,setOutgoing]=useState([]);

  async function load(){ const res = await axios.get('/swaps'); setIncoming(res.data.incoming); setOutgoing(res.data.outgoing); }

  useEffect(()=>{ load(); },[]);

  async function respond(id, accept){
    await axios.post('/swap-response/'+id, { accept });
    load();
  }

  return (<div>
    <h2>Requests</h2>
    <div className="card">
      <h3>Incoming</h3>
      {incoming.map(s=>(
        <div key={s.id} className="card row">
          <div style={{flex:1}}>From: {s.fromUserId} • MySlot: {s.mySlotId} • TheirSlot: {s.theirSlotId} • Status: {s.status}</div>
          <div>
            <button onClick={()=>respond(s.id,true)}>Accept</button>
            <button onClick={()=>respond(s.id,false)} style={{marginLeft:6}}>Reject</button>
          </div>
        </div>
      ))}
    </div>
    <div className="card">
      <h3>Outgoing</h3>
      {outgoing.map(s=>(
        <div key={s.id} className="card">
          To: {s.toUserId} • TheirSlot: {s.theirSlotId} • Status: {s.status}
        </div>
      ))}
    </div>
  </div>);
}
