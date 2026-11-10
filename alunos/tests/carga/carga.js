import http from 'k6/http';
import {check,sleep} from 'k6';
export const options = {vus:5,duration:'30s',thresholds:{
  http_req_failed:['rate<0.01'],http_req_duration:['p(95)<500'],checks:['rate>0.99']
}};
export default function () {
  const r=http.get('http://127.0.0.1:3000/api/products');
  check(r,{'HTTP 200':x=>x.status===200,'lista não vazia':x=>{
    try {const dados=x.json();return Array.isArray(dados) && dados.length>0;}
    catch {return false;}
  }});
  sleep(1);
}
