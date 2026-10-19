// OWNER: Valeriia
import { findService } from '../data/store.js';

export function estimateWait(peopleAhead, serviceId){
  const service = findService(serviceId);

  if(!service){
    return 0;
  }

  return peopleAhead * service.expectedDuration;
}

export function formatWait(minutes){
  if(minutes <= 0){
    return 'Next up';
  }

  if(minutes < 60){
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if(remainingMinutes === 0){
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}