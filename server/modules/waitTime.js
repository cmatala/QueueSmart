// OWNER: Valeriia

import { findService } from '../data/store.js';

export function estimateWait(peopleAhead, serviceId){
  const service = findService(serviceId);
  if(!service) return 0;

  const ahead = Number(peopleAhead);
  if(!Number.isFinite(ahead) || ahead <= 0) return 0;

  return ahead * service.expectedDuration;
}

export function formatWait(minutes){
  const total = Number(minutes);
  if(!Number.isFinite(total) || total <= 0) return 'Next up';

  if(total < 60) return `${total} min`;

  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}