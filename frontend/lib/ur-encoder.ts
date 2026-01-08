/**
 * Uniform Resource (UR) Encoder/Decoder
 * Handles splitting large JSON objects into chunked strings for Animated QR transfer
 * Format: UR:CURRENT_INDEX/TOTAL_CHUNKS:PAYLOAD
 */

const HEADER_PREFIX = 'UR'
const SEPARATOR = ':'

interface ChunkedData {
  current: number
  total: number
  payload: string
}

export const encodeDataToFrames = (data: any, maxChunkSize: number = 150): string[] => {
  const jsonString = JSON.stringify(data)
  const totalLength = jsonString.length
  const totalChunks = Math.ceil(totalLength / maxChunkSize)
  
  const frames: string[] = []

  for (let i = 0; i < totalChunks; i++) {
    const start = i * maxChunkSize
    const end = Math.min(start + maxChunkSize, totalLength)
    const chunkPayload = jsonString.substring(start, end)
    
    // Format: UR:1/5:{"id":...
    // Note: Using 1-based indexing for display friendliness
    const frame = `${HEADER_PREFIX}${SEPARATOR}${i + 1}/${totalChunks}${SEPARATOR}${chunkPayload}`
    frames.push(frame)
  }

  return frames
}

export const parseFrame = (frameString: string): ChunkedData | null => {
  if (!frameString.startsWith(HEADER_PREFIX)) return null

  try {
    const parts = frameString.split(SEPARATOR)
    // parts[0] = UR
    // parts[1] = 1/5
    // parts[2...] = payload (re-join in case payload contained colon)

    if (parts.length < 3) return null

    const counts = parts[1].split('/')
    const current = parseInt(counts[0])
    const total = parseInt(counts[1])
    
    // Re-assemble payload if it contained colons
    const payload = parts.slice(2).join(SEPARATOR)

    return { current, total, payload }
  } catch (e) {
    console.error("Frame parse error", e)
    return null
  }
}

export class URDecoder {
  private chunks: Map<number, string>
  private totalChunks: number
  private isComplete: boolean

  constructor() {
    this.chunks = new Map()
    this.totalChunks = 0
    this.isComplete = false
  }

  public receiveFrame(frameString: string): { progress: number, complete: boolean, data: any | null } {
    const parsed = parseFrame(frameString)
    
    // Handle non-UR data (simple static QR)
    if (!parsed) {
        try {
            // Try treating as pure JSON
            const data = JSON.parse(frameString)
            return { progress: 100, complete: true, data }
        } catch {
            return { progress: 0, complete: false, data: null }
        }
    }

    if (this.totalChunks === 0) {
      this.totalChunks = parsed.total
    } else if (this.totalChunks !== parsed.total) {
      // Reset if we detect a different stream size (new scan started)
      this.reset()
      this.totalChunks = parsed.total
    }

    this.chunks.set(parsed.current, parsed.payload)

    const progress = Math.round((this.chunks.size / this.totalChunks) * 100)

    if (this.chunks.size === this.totalChunks) {
      this.isComplete = true
      try {
        // Reassemble in order (1 to Total)
        let fullString = ''
        for (let i = 1; i <= this.totalChunks; i++) {
            fullString += this.chunks.get(i) || ''
        }
        const data = JSON.parse(fullString)
        return { progress: 100, complete: true, data }
      } catch (e) {
        console.error("Reassembly JSON parse error", e)
        return { progress: 100, complete: false, data: null } // Corrupt data
      }
    }

    return { progress, complete: false, data: null }
  }

  public reset() {
    this.chunks.clear()
    this.totalChunks = 0
    this.isComplete = false
  }
}
