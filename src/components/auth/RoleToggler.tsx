import { motion } from "framer-motion";
import { User, Truck } from "lucide-react";
import clsx from "clsx";

// Define UserRole if it's not imported
type UserRole = "VISITOR" | "COLLECTOR";

function RoleToggler({
  selectedRole,
  onSelect,
}: {
  selectedRole: UserRole;
  onSelect: (r: UserRole) => void;
}) {
  return (
    <div className="bg-gray-100 p-1 rounded-2xl flex relative w-full h-[48px]">
      {/* The sliding white background */}
      {/* We use layoutId or simple absolute positioning logic for the slider */}
      <div className="absolute inset-0 p-1 flex">
        <motion.div
          className="w-1/2 bg-white rounded-xl shadow-sm border border-gray-100"
          initial={false}
          animate={{
            x: selectedRole === "VISITOR" ? "0%" : "100%",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      </div>

      {/* Button: VISITOR (Заказчик) */}
      <button
        type="button"
        onClick={() => onSelect("VISITOR")}
        className={clsx(
          "flex-1 z-10 text-xs font-bold transition-colors flex items-center justify-center uppercase tracking-wide gap-2",
          selectedRole === "VISITOR" ? "text-gray-900" : "text-gray-400",
        )}
      >
        <User className="w-4 h-4" />
        Заказчик
      </button>

      {/* Button: COLLECTOR (Исполнитель) */}
      <button
        type="button"
        onClick={() => onSelect("COLLECTOR")}
        className={clsx(
          "flex-1 z-10 text-xs font-bold transition-colors flex items-center justify-center uppercase tracking-wide gap-2",
          selectedRole === "COLLECTOR" ? "text-gray-900" : "text-gray-400",
        )}
      >
        <Truck className="w-4 h-4" />
        Исполнитель
      </button>
    </div>
  );
}

export default RoleToggler;
