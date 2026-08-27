interface AvatarProps {
  name: string;
  className?: string;
  tone?: 'emerald' | 'slate' | 'amber' | 'blue' | 'red';
}

const tones: Record<NonNullable<AvatarProps['tone']>, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200/70',
  slate: 'bg-slate-100 text-slate-600 border-slate-200/80',
  amber: 'bg-amber-100 text-amber-700 border-amber-200/70',
  blue: 'bg-blue-100 text-blue-700 border-blue-200/70',
  red: 'bg-red-100 text-red-700 border-red-200/70',
};

export default function Avatar({
  name,
  className = 'w-10 h-10 text-sm',
  tone = 'emerald',
}: AvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div
      aria-hidden="true"
      className={`shrink-0 rounded-xl flex items-center justify-center font-semibold border ${tones[tone]} ${className}`}
    >
      {initials || '?'}
    </div>
  );
}
