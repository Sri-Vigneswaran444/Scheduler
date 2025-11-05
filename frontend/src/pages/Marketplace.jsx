import React, {useEffect, useState} from 'react';
import axios from 'axios';

export default function Marketplace(){
  const [slots,setSlots]=useState([]);
  const [mySwappables,setMySwappables]=useState([]);
  const [selectedTheir, setSelectedTheir] = useState(null);
  const [selectedMy, setSelectedMy] = useState(null);

  async function load(){
    const res = await axios.get('/swappable-slots');
    setSlots(res.data);
    const mine = (await axios.get('/events')).data.filter(e=>e.status==='SWAPPABLE');
    setMySwappables(mine);
  }

  useEffect(()=>{ load(); },[]);

  async function requestSwap(){
    if(!selectedMy||!selectedTheir) return alert('choose both');
    await axios.post('/swap-request', { mySlotId: selectedMy, theirSlotId: selectedTheir });
    alert('Requested');
    load();
  }

  return (<div>
    <h2>Marketplace</h2>
    <div className="card">
      <strong>Available slots</strong>
      {slots.map(s=>(
        <div key={s.id} className="card row">
          <div style={{flex:1}}>{s.title} • {s.startTime} → {s.endTime} • Owner: {s.ownerId}</div>
          <div><button onClick={()=>setSelectedTheir(s.id)}>Request swap</button></div>
        </div>
      ))}
    </div>

    <div className="card">
      <strong>Your swappable slots</strong>
      {mySwappables.map(m=>(
        <div key={m.id} className="row">
          <div style={{flex:1}}>{m.title} • {m.startTime}</div>
          <div><input type="radio" name="my" onChange={()=>setSelectedMy(m.id)} /></div>
        </div>
      ))}
      <div style={{marginTop:8}}>
        <button onClick={requestSwap}>Send Swap Request</button>
      </div>
    </div>
  </div>);
}
