import http from 'k6/http';
import {check,sleep} from 'k6';
export const options = {stages:[
  {duration:'20s',target:5},{duration:'20s',target:15},
  {duration:'20s',target:30},{duration:'20s',target:5},{duration:'10s',target:0}
],thresholds:{http_req_failed:['rate<0.05'],http_req_duration:['p(95)<1000'],checks:['rate>0.95']}};
export default function () {
  const r=http.get('http://127.0.0.1:3000/api/products');
  check(r,{'HTTP 200':x=>x.status===200});sleep(0.5);
}
