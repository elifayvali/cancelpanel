export function diffLabel(channelPrice, ccsPrice) {
  const channel = Number(channelPrice ?? 0)
  const ccs = Number(ccsPrice ?? 0)
  const diff = channel - ccs
  if (diff === 0) return { text: '—', tone: 'match' }
  return { text: `${Math.abs(diff)} TL`, tone: 'high' }
}
