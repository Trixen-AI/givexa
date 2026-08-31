export function BrandLogo({ inverse = false }) {
  return (
    <a
      className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap ${inverse ? 'text-white' : 'text-[#0c0b10]'}`}
      href="/"
      aria-label="Givexa home"
    >
      <img
        className="h-9 w-9 object-contain sm:h-10 sm:w-10"
        src="/brand/givexa-logo.png"
        alt=""
        width="40"
        height="40"
      />
      <span className="text-[13px] font-bold tracking-[0.24em] sm:text-[14px]">GIVEXA</span>
    </a>
  )
}
