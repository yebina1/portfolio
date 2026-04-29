import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

// BoxGeometry 면 순서: +X, -X, +Y, -Y, +Z, -Z
function makeMaterials(cx: number, cy: number, cz: number): THREE.MeshLambertMaterial[] {
  const _ = 0x1a1a1a // 내부 면 (검정)
  return [
    new THREE.MeshLambertMaterial({ color: cx ===  1 ? 0x009b48 : _ }), // +X 오른쪽: 초록
    new THREE.MeshLambertMaterial({ color: cx === -1 ? 0x0046ad : _ }), // -X 왼쪽: 파랑
    new THREE.MeshLambertMaterial({ color: cy ===  1 ? 0xc41230 : _ }), // +Y 위: 빨강
    new THREE.MeshLambertMaterial({ color: cy === -1 ? 0xff5800 : _ }), // -Y 아래: 주황
    new THREE.MeshLambertMaterial({ color: cz ===  1 ? 0xe8e8e8 : _ }), // +Z 앞: 흰색
    new THREE.MeshLambertMaterial({ color: cz === -1 ? 0xffd600 : _ }), // -Z 뒤: 노랑
  ]
}

export default function CubeHero() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current!

    // ── 씬 ──
    const scene = new THREE.Scene()

    // ── 카메라: 앞-오른쪽-위에서 내려다보는 각도 (흰색/초록/빨강 면이 보임) ──
    const camera = new THREE.PerspectiveCamera(38, el.clientWidth / el.clientHeight, 0.1, 100)
    camera.position.set(6, 5, 8)
    camera.lookAt(0, 0.3, 0)

    // ── 렌더러 ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(el.clientWidth, el.clientHeight)
    el.appendChild(renderer.domElement)

    // ── 조명 (입체감 핵심) ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.45))

    const sun = new THREE.DirectionalLight(0xffffff, 1.0)
    sun.position.set(6, 10, 8)
    scene.add(sun)

    // 반대편 약한 보조광 (그림자 부분이 완전히 검지 않게)
    const fill = new THREE.DirectionalLight(0x8899bb, 0.25)
    fill.position.set(-4, -3, -5)
    scene.add(fill)

    // ── 큐브 그룹 ──
    const group = new THREE.Group()
    scene.add(group)

    const GEO = new THREE.BoxGeometry(0.93, 0.93, 0.93)
    const SPACING = 1.04  // 조각 간 간격 (0.11 단위 틈새 → 검정 홈)
    const SCATTER = 7     // 흩어지는 거리

    type CD = { mesh: THREE.Mesh; from: THREE.Vector3; to: THREE.Vector3; delay: number }
    const cubelets: CD[] = []
    let idx = 0

    // cz 순서로 정렬 → 뒤쪽(노란 면) 조각부터 먼저 조립
    for (let cz = -1; cz <= 1; cz++) {
      for (let cx = -1; cx <= 1; cx++) {
        for (let cy = -1; cy <= 1; cy++) {
          if (cx === 0 && cy === 0 && cz === 0) continue // 중심부 제외 (안 보임)

          const mesh = new THREE.Mesh(GEO, makeMaterials(cx, cy, cz))
          const to   = new THREE.Vector3(cx * SPACING, cy * SPACING, cz * SPACING)
          const from = new THREE.Vector3(cx * SCATTER, cy * SCATTER, cz * SCATTER)

          mesh.position.copy(from)
          group.add(mesh)
          cubelets.push({ mesh, from, to, delay: (idx++ / 25) * 480 })
        }
      }
    }

    // ── 애니메이션 타이밍 ──
    const DELAY    = 350   // 첫 조각이 움직이기 전 대기 (ms)
    const DURATION = 1100  // 조각당 이동 시간 (ms)
    const SPIN_AT  = DELAY + 480 + DURATION + 500  // 모든 조각 조립 완료 후 회전 시작 (~2430ms)

    const t0 = performance.now()
    let raf: number

    function tick() {
      raf = requestAnimationFrame(tick)
      const elapsed = performance.now() - t0

      // 각 조각 위치 보간
      for (const { mesh, from, to, delay } of cubelets) {
        const p = Math.min(Math.max((elapsed - DELAY - delay) / DURATION, 0), 1)
        mesh.position.lerpVectors(from, to, easeOutCubic(p))
      }

      // 조립 완료 후 천천히 회전
      if (elapsed > SPIN_AT) {
        group.rotation.y += 0.005
      }

      renderer.render(scene, camera)
    }
    tick()

    // ── 리사이즈 대응 ──
    function onResize() {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      GEO.dispose()
      cubelets.forEach(({ mesh }) =>
        (mesh.material as THREE.MeshLambertMaterial[]).forEach(m => m.dispose())
      )
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={containerRef} className="cube-hero" />
}
