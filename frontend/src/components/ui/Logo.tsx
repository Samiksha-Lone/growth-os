import logoUrl from '../../../assets/growthos-logo.svg';

export function Logo() {
  return (
    <img
      src={logoUrl}
      width={44}
      height={44}
      alt="GrowthOS logo"
      className="app-logo"
    />
  );
}
