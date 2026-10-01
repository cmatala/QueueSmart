// OWNER: Valeriia
// Shared component: waiting / almost ready / served pill
// TODO: see the A2 plan.

export default function StatusBadge({ status }){
  const labels = {
    waiting: "Waiting",
    "almost ready": "Almost Ready",
    served: "Served",
    left: "Left",
    "no-show": "No-show",
  }

  const classNames = {
    waiting: "badge-waiting",
    "almost ready": "badge-medium",
    served: "badge-served",
    left: "badge-closed",
    "no-show": "badge-closed",
  }

  return(
    <span className={`badge ${classNames[status] || ""}`}>
      {labels[status] || status}
    </span>
  )
}
