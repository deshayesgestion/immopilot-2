/**
 * UserStatusBadge — Affiche le statut d'un utilisateur
 * Statuts: actif, inactif, invite
 */
export default function UserStatusBadge({ status = "actif" }) {
  const configs = {
    actif: { bg: "bg-green-100", text: "text-green-700", label: "Actif", dot: "bg-green-500" },
    inactif: { bg: "bg-gray-100", text: "text-gray-700", label: "Inactif", dot: "bg-gray-400" },
    invite: { bg: "bg-amber-100", text: "text-amber-700", label: "Invitation en attente", dot: "bg-amber-500" },
  };

  const config = configs[status] || configs.inactif;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </div>
  );
}