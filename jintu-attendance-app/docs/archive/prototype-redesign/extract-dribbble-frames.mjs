import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const VIDEO_URL = 'https://cdn.dribbble.com/userupload/45105234/file/f27a295212c43fbd59726972e60a2363.mp4'
const OUTPUT_DIR = path.resolve(process.cwd(), 'public/prototype-frames')

const FRAMES = [
  { name: 'signup', time: 1.0 },
  { name: 'menu', time: 5.0 },
  { name: 'leaderboard', time: 10.0 },
]

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function extractFrame(page, time) {
  return await page.evaluate(async ({ url, time }) => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    const video = document.querySelector('video')
    const canvas = document.querySelector('canvas')
    if (!video || !canvas) throw new Error('video/canvas missing')

    if (video.src !== url) {
      video.src = url
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => resolve(true)
        video.onerror = () => reject(new Error('video load error'))
      })
    }

    await new Promise((resolve) => {
      video.currentTime = time
      video.onseeked = () => resolve(true)
    })

    await wait(80)

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas context missing')
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)

    return {
      width: video.videoWidth,
      height: video.videoHeight,
      dataUrl: canvas.toDataURL('image/png'),
    }
  }, { url: VIDEO_URL, time })
}

async function main() {
  await ensureDir(OUTPUT_DIR)

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } })

  await page.setContent(`
    <!doctype html>
    <html>
      <body style="margin:0;background:#111;display:grid;place-items:center;min-height:100vh;">
        <video crossorigin="anonymous" muted playsinline style="max-width:100%;max-height:100%;"></video>
        <canvas style="display:none"></canvas>
      </body>
    </html>
  `)

  for (const frame of FRAMES) {
    const { dataUrl, width, height } = await extractFrame(page, frame.time)
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
    const target = path.join(OUTPUT_DIR, `${frame.name}.png`)
    await fs.writeFile(target, Buffer.from(base64, 'base64'))
    console.log(`saved ${frame.name}.png (${width}x${height})`)
  }

  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
