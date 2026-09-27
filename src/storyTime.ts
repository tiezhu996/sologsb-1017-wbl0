// 把场次的故事时间整理成可以互相比对的时刻。
// 能认出“第 N 天”并尽量带上当天时刻；认不出来就返回 null，由调用方跳过。

export interface StoryMoment {
  day: number
  /** 当天第几分钟；只有日期、没有具体时刻时为 null */
  minutes: number | null
}

const DAY_PATTERN = /第\s*0*(\d+)\s*[天日]|(?:day|d)\s*0*(\d+)/i
// 严格时刻：22:40 / 22：40 / 22.40 / 22时40分 / 22时 / 7点05分 / 7点
// 小时前不能紧跟数字，否则 “25:00” 会被误读成 “5:00”
const CLOCK_PATTERN = /(?:^|[^\d])([01]?\d|2[0-3])\s*[:：.]\s*([0-5]\d)(?!\d)/u
const CLOCK_CN_PATTERN = /(?:^|[^\d])([01]?\d|2[0-3])\s*[时点]\s*(?:([0-5]\d)\s*分?)?/u
// 长得像时刻但超出范围（如 25:00），视为写法认不出来
const LOOSE_TIME_PATTERN = /\d{1,2}\s*[:：.]\s*\d{1,2}|\d{1,2}\s*[时点]/u
const PM_PATTERN = /下午|傍晚|晚上|晚间|夜里|深夜|中午/u

export function parseStoryMoment(storyTime: string): StoryMoment | null {
  const text = storyTime.trim()
  if (!text) return null

  const dayMatch = text.match(DAY_PATTERN)
  if (!dayMatch) return null
  const day = Number(dayMatch[1] ?? dayMatch[2])
  if (!Number.isFinite(day) || day <= 0) return null

  const clock = text.match(CLOCK_PATTERN) ?? text.match(CLOCK_CN_PATTERN)
  if (!clock) {
    // 有类似时刻的写法却解析不了，整场跳过，而不是退化成“仅日期”
    return LOOSE_TIME_PATTERN.test(text) ? null : { day, minutes: null }
  }

  let hour = Number(clock[1])
  const minute = clock[2] === undefined || clock[2] === '' ? 0 : Number(clock[2])
  if (hour < 12 && PM_PATTERN.test(text)) hour += 12
  return { day, minutes: hour * 60 + minute }
}

/** 两个时刻是否指向同一瞬间（日期和当天时刻都一致） */
export function isSameMoment(a: StoryMoment, b: StoryMoment): boolean {
  return a.day === b.day && a.minutes === b.minutes
}

export function formatStoryMoment(moment: StoryMoment): string {
  if (moment.minutes === null) return `第 ${moment.day} 天`
  const hour = Math.floor(moment.minutes / 60)
  const minute = moment.minutes % 60
  return `第 ${moment.day} 天 ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}
