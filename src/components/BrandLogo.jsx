// TokLink logo. Generated from one source: mark geometry and Inter Bold outlined wordmark.
import { useId } from 'react'

const COIN_FULL = 'M14.24 49.76A15 15 0 0 1 35.46 28.54L29.8 34.2A7 7 0 0 0 19.9 44.1ZM35.46 28.54A15 15 0 0 1 14.24 49.76L19.9 44.1A7 7 0 0 0 29.8 34.2Z'
const COIN_FRONT = 'M35.46 28.54A15 15 0 0 1 14.24 49.76L19.9 44.1A7 7 0 0 0 29.8 34.2Z'
const LINK_PATH = 'M35.81 41.62L46.42 31.02A9.5 9.5 0 0 0 32.98 17.58L22.38 28.19A9.5 9.5 0 0 0 35.81 41.62ZM31.57 37.38L42.17 26.78A3.5 3.5 0 0 0 37.22 21.83L26.62 32.43A3.5 3.5 0 0 0 31.57 37.38Z'
const WORDMARK_PATH = 'M42.93 15.44L38.70 15.44L38.70 13.09L49.99 13.09L49.99 15.44L45.77 15.44L45.77 26.91L42.93 26.91L42.93 15.44ZM56.32 27.12L56.32 27.12Q54.76 27.12 53.62 26.44Q52.48 25.77 51.86 24.57Q51.24 23.37 51.24 21.77L51.24 21.77Q51.24 20.16 51.86 18.96Q52.48 17.75 53.62 17.08Q54.76 16.41 56.32 16.41L56.32 16.41Q57.89 16.41 59.02 17.08Q60.16 17.75 60.78 18.96Q61.39 20.16 61.39 21.77L61.39 21.77Q61.39 23.37 60.78 24.57Q60.16 25.77 59.02 26.44Q57.89 27.12 56.32 27.12ZM56.32 24.93L56.32 24.93Q57.06 24.93 57.56 24.51Q58.06 24.10 58.31 23.38Q58.56 22.66 58.56 21.76L58.56 21.76Q58.56 20.84 58.31 20.13Q58.06 19.42 57.56 19.01Q57.06 18.60 56.32 18.60L56.32 18.60Q55.58 18.60 55.08 19.01Q54.58 19.42 54.33 20.13Q54.08 20.84 54.08 21.76L54.08 21.76Q54.08 22.66 54.33 23.38Q54.58 24.10 55.08 24.51Q55.58 24.93 56.32 24.93ZM65.93 26.91L63.14 26.91L63.14 13.09L65.93 13.09L65.93 20.53L66.08 20.53L69.48 16.54L72.70 16.54L68.82 21.05L72.89 26.91L69.62 26.91L66.72 22.69L65.93 23.58L65.93 26.91ZM82.83 26.91L74.04 26.91L74.04 13.09L76.87 13.09L76.87 24.56L82.83 24.56L82.83 26.91ZM87.31 26.91L84.53 26.91L84.53 16.54L87.31 16.54L87.31 26.91ZM85.92 15.19L85.92 15.19Q85.29 15.19 84.84 14.77Q84.40 14.35 84.40 13.76L84.40 13.76Q84.40 13.16 84.84 12.75Q85.29 12.33 85.92 12.33L85.92 12.33Q86.55 12.33 87.00 12.74Q87.45 13.15 87.45 13.76L87.45 13.76Q87.45 14.35 87.00 14.77Q86.55 15.19 85.92 15.19ZM92.27 20.91L92.27 20.91L92.27 26.91L89.49 26.91L89.49 16.54L92.11 16.54L92.15 18.68Q92.55 17.70 93.23 17.11L93.23 17.11Q94.06 16.41 95.38 16.41L95.38 16.41Q96.45 16.41 97.26 16.88Q98.06 17.35 98.50 18.22Q98.94 19.10 98.94 20.32L98.94 20.32L98.94 26.91L96.16 26.91L96.16 20.80Q96.16 19.83 95.66 19.29Q95.16 18.74 94.28 18.74L94.28 18.74Q93.70 18.74 93.24 18.99Q92.78 19.25 92.52 19.73Q92.27 20.21 92.27 20.91ZM103.91 26.91L101.12 26.91L101.12 13.09L103.91 13.09L103.91 20.53L104.07 20.53L107.46 16.54L110.68 16.54L106.80 21.05L110.87 26.91L107.60 26.91L104.71 22.69L103.91 23.58L103.91 26.91Z'

const MASK_BOX = { x: 4.85, y: 9.8, width: 49.35, height: 49.35 }

function MarkPaths({ inverse }) {
  const id = useId().replaceAll(':', '')
  const coin = inverse ? '#ffffff' : '#3c80ff'
  return (
    <>
      <defs>
        <mask id={`${id}-c`} maskUnits="userSpaceOnUse" {...MASK_BOX}>
          <rect {...MASK_BOX} fill="#fff" />
          <path d={LINK_PATH} fillRule="evenodd" fill="#000" stroke="#000" strokeWidth="3.2" />
        </mask>
        <mask id={`${id}-l`} maskUnits="userSpaceOnUse" {...MASK_BOX}>
          <rect {...MASK_BOX} fill="#fff" />
          <path d={COIN_FRONT} fill="#000" stroke="#000" strokeWidth="3.2" />
        </mask>
      </defs>
      <path fill={coin} d={COIN_FULL} mask={`url(#${id}-c)`} />
      <path fill="#003185" fillRule="evenodd" d={LINK_PATH} mask={`url(#${id}-l)`} />
      <path fill={coin} d={COIN_FRONT} />
    </>
  )
}

export function TokLinkMark({ className = '', inverse = false }) {
  return (
    <svg className={className} viewBox="9.85 14.8 39.35 39.35" aria-hidden="true" focusable="false">
      <MarkPaths inverse={inverse} />
    </svg>
  )
}

export function BrandLogo({ inverse = false }) {
  return (
    <a
      className={`inline-flex min-h-11 items-center whitespace-nowrap ${inverse ? 'text-white' : 'text-[#15181a]'}`}
      href="/"
      aria-label="TokLink home"
    >
      <svg className="h-9 w-auto sm:h-10" viewBox="0 0 112 40" aria-hidden="true" focusable="false">
        <g transform="translate(-7.51 -6.28) scale(0.76)">
          <MarkPaths inverse={inverse} />
        </g>
        <path fill="currentColor" d={WORDMARK_PATH} />
      </svg>
    </a>
  )
}
