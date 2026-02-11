import { Info } from "lucide-react";

export default function InfoBanner({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center shadow-sm mb-4">
      <Info className="w-6 h-6 text-slate-500 shrink-0" />
      <div className="ml-4">
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{message}</p>
      </div>
    </div>
  );
}
