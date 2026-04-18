import logoUrl from '../../../assets/growthos-logo.svg';

export function Logo() {
  return (
    <img
      src={logoUrl}
      alt="GrowthOS logo"
      className="w-full h-full object-contain p-1.5"
    />
  );
}
