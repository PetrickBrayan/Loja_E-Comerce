// Um patamar por execução (para registrar p95, vazão e falhas por nível, como pede a aula).
// Uso: k6 run -e VUS=10 --summary-export=resultado-10.json tests/carga/patamar.js
// ATENÇÃO: este arquivo NÃO foi executado por mim (k6 indisponível no meu ambiente). Confira ao rodar.
import http from 'k6/http';
import {check,sleep} from 'k6';
const VUS = Number(__ENV.VUS || 10);
export const options = {
  stages:[{duration:'5s',target:VUS},{duration:'55s',target:VUS}],
  thresholds:{http_req_failed:['rate<0.05'],http_req_duration:['p(95)<1000'],checks:['rate>0.95']}
};
export default function () {
  const r=http.get('http://127.0.0.1:3000/api/products');
  check(r,{'HTTP 200':x=>x.status===200});sleep(0.5);
}
