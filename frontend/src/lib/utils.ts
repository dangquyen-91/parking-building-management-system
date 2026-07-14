import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const FLOOR_GROUP_ORDER = ['B', 'A']

export function compareFloorCode(a: string, b: string): number {
  const key = (code: string): [number, number, string] => {
    const raw = String(code).trim().toUpperCase()
    const m = /^([A-Za-z]+)?(\d+)?/.exec(raw)
    const letter = m?.[1] ?? ''
    const num = m?.[2] ? parseInt(m[2], 10) : 0
    const groupIdx = FLOOR_GROUP_ORDER.indexOf(letter)
    return [groupIdx === -1 ? 99 : groupIdx, num, raw]
  }
  const ka = key(a)
  const kb = key(b)
  return ka[0] - kb[0] || ka[1] - kb[1] || ka[2].localeCompare(kb[2])
}
