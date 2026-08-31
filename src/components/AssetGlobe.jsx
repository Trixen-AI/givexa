import { useEffect, useMemo, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

const assetSymbols = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'SPY', 'QQQ', 'GLD']

const spherePoints = Array.from({ length: 1150 }, (_, index) => {
  const offset = 2 / 1150
  const y = index * offset - 1 + offset / 2
  const radius = Math.sqrt(1 - y * y)
  const angle = index * Math.PI * (3 - Math.sqrt(5))
  return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius }
})

const anchorPoints = assetSymbols.map((_, index) => {
  const y = 1 - ((index + 0.65) / assetSymbols.length) * 2
  const radius = Math.sqrt(1 - y * y)
  const angle = index * Math.PI * (3 - Math.sqrt(5)) + 0.45
  return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius }
})

const links = [[0, 3], [0, 6], [1, 4], [1, 7], [2, 5], [2, 8], [3, 9], [4, 7], [5, 8], [6, 9], [0, 8], [2, 7]]

function rotatePoint(point, rotationX, rotationY) {
  const cosY = Math.cos(rotationY)
  const sinY = Math.sin(rotationY)
  const x1 = point.x * cosY + point.z * sinY
  const z1 = -point.x * sinY + point.z * cosY
  const cosX = Math.cos(rotationX)
  const sinX = Math.sin(rotationX)
  return { x: x1, y: point.y * cosX - z1 * sinX, z: point.y * sinX + z1 * cosX }
}

export function AssetGlobe({ interactive = false, background = false }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const nodeRefs = useRef([])
  const reduceMotion = useReducedMotion()
  const label = interactive
    ? 'Interactive globe showing ten supported assets. Drag with a mouse to rotate.'
    : 'Rotating globe representing the Givexa asset network.'

  const nodes = useMemo(() => assetSymbols.map((symbol, index) => ({ symbol, point: anchorPoints[index] })), [])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return undefined

    const context = canvas.getContext('2d', { alpha: true })
    const pointer = { active: false, x: 0, y: 0 }
    const rotation = { x: -0.2, y: 0.15, velocityX: 0, velocityY: 0 }
    let frame = 0
    let width = 0
    let height = 0
    let lastTime = performance.now()

    const resize = () => {
      const bounds = container.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(1, bounds.width)
      height = Math.max(1, bounds.height)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const project = (point, radius, centerX, centerY) => {
      const rotated = rotatePoint(point, rotation.x, rotation.y)
      const perspective = 0.82 + (rotated.z + 1) * 0.12
      return {
        x: centerX + rotated.x * radius * perspective,
        y: centerY + rotated.y * radius * perspective,
        z: rotated.z,
        scale: perspective,
      }
    }

    const render = (time) => {
      const delta = Math.min((time - lastTime) / 1000, 0.05)
      lastTime = time

      if (!pointer.active) {
        if (!reduceMotion) rotation.y += delta * (background ? 0.12 : 0.09)
        rotation.x += rotation.velocityX
        rotation.y += rotation.velocityY
        rotation.velocityX *= 0.94
        rotation.velocityY *= 0.94
      }
      rotation.x = Math.max(-0.8, Math.min(0.8, rotation.x))

      context.clearRect(0, 0, width, height)
      const radius = Math.min(width, height) * (background ? 0.49 : 0.44)
      const centerX = width / 2
      const centerY = height * (background ? 0.54 : 0.57)
      const projectedNodes = nodes.map(({ point }) => project(point, radius, centerX, centerY))

      context.save()
      const glow = context.createRadialGradient(centerX, centerY, radius * 0.08, centerX, centerY, radius * 1.08)
      glow.addColorStop(0, background ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.16)')
      glow.addColorStop(0.72, 'rgba(255,255,255,.025)')
      glow.addColorStop(1, 'rgba(255,255,255,0)')
      context.fillStyle = glow
      context.beginPath()
      context.arc(centerX, centerY, radius * 1.08, 0, Math.PI * 2)
      context.fill()

      context.lineWidth = 1
      links.forEach(([from, to]) => {
        const a = projectedNodes[from]
        const b = projectedNodes[to]
        const visibility = Math.max(0, Math.min(1, (a.z + b.z + 1.2) / 2.2))
        if (visibility < 0.08) return
        context.strokeStyle = `rgba(255,255,255,${(background ? 0.08 : 0.18) * visibility})`
        context.beginPath()
        context.moveTo(a.x, a.y)
        const lift = Math.max(18, Math.hypot(b.x - a.x, b.y - a.y) * 0.18)
        context.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - lift, b.x, b.y)
        context.stroke()
      })

      spherePoints.forEach((point) => {
        const projected = project(point, radius, centerX, centerY)
        const visibility = Math.max(0.05, (projected.z + 1) / 2)
        const size = (background ? 1.15 : 1.45) * projected.scale
        context.fillStyle = `rgba(255,255,255,${(background ? 0.16 : 0.62) * visibility})`
        context.beginPath()
        context.arc(projected.x, projected.y, size, 0, Math.PI * 2)
        context.fill()
      })

      context.strokeStyle = background ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.22)'
      context.lineWidth = 1
      context.beginPath()
      context.ellipse(centerX, centerY, radius, radius * 0.36, rotation.x * 0.55, 0, Math.PI * 2)
      context.stroke()
      context.restore()

      projectedNodes.forEach((projected, index) => {
        const element = nodeRefs.current[index]
        if (!element) return
        const visibility = Math.max(0, Math.min(1, (projected.z + 0.45) / 1.1))
        const nodeScale = 0.68 + visibility * 0.42
        element.style.opacity = String((background ? 0.18 : 0.45 + visibility * 0.55))
        element.style.zIndex = String(Math.round((projected.z + 1) * 10))
        element.style.transform = `translate3d(${projected.x}px, ${projected.y}px, 0) translate(-50%, -50%) scale(${nodeScale})`
      })

      frame = window.requestAnimationFrame(render)
    }

    const onPointerDown = (event) => {
      if (!interactive || event.pointerType === 'touch') return
      pointer.active = true
      pointer.x = event.clientX
      pointer.y = event.clientY
      rotation.velocityX = 0
      rotation.velocityY = 0
      canvas.setPointerCapture(event.pointerId)
      canvas.style.cursor = 'grabbing'
    }
    const onPointerMove = (event) => {
      if (!pointer.active) return
      const dx = event.clientX - pointer.x
      const dy = event.clientY - pointer.y
      pointer.x = event.clientX
      pointer.y = event.clientY
      rotation.velocityY = dx * 0.0045
      rotation.velocityX = dy * 0.0035
      rotation.y += rotation.velocityY
      rotation.x += rotation.velocityX
    }
    const onPointerUp = (event) => {
      if (!pointer.active) return
      pointer.active = false
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      canvas.style.cursor = interactive ? 'grab' : 'default'
    }

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    frame = window.requestAnimationFrame(render)

    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(frame)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
    }
  }, [background, interactive, nodes, reduceMotion])

  return (
    <div
      ref={containerRef}
      className={`asset-globe ${background ? 'asset-globe--background' : ''}`}
      role="img"
      aria-label={label}
    >
      <canvas ref={canvasRef} className={interactive ? 'asset-globe__canvas asset-globe__canvas--interactive' : 'asset-globe__canvas'} aria-hidden="true" />
      <img className="asset-globe__brand" src="/brand/givexa-logo.png" alt="" aria-hidden="true" />
      {nodes.map(({ symbol }, index) => (
        <span className="asset-globe__node" ref={(element) => { nodeRefs.current[index] = element }} key={symbol} aria-hidden="true">
          <img src={`/stocks/${symbol}.webp`} alt="" width="40" height="40" />
        </span>
      ))}
      {interactive && <span className="asset-globe__hint" aria-hidden="true">Drag to rotate</span>}
    </div>
  )
}
