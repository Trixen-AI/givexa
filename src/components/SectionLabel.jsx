export function SectionLabel({ children, light = false }) {
  return <p className={`section-label ${light ? 'section-label--light' : ''}`}><span />{children}</p>
}
