// OWNER: Valeriia
// Shared component: a single in-app notification
// TODO: see the A2 plan.

export default function Notification({ message, time, unread }){
  return(
    <div className={`note ${unread ? 'unread' : ''}`}>
      <p>{message}</p>
      <div className="faint">{time}</div>
    </div>
  )
}
