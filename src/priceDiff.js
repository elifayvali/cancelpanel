export function optionHasPriceDiff(item) {
  if (item?.priceDiff != null) return Number(item.priceDiff) !== 0
  return Number(item?.channelPrice ?? 0) !== Number(item?.ccsPrice ?? 0)
}

export function diffLabel(channelPrice, ccsPrice, { priceDiff, highlightOnly } = {}) {
  if (priceDiff != null) {
    const diff = Number(priceDiff)
    if (diff === 0) {
      return highlightOnly ? { text: '—', tone: 'high' } : { text: '—', tone: 'match' }
    }
    const sign = diff > 0 ? '+' : '−'
    return { text: `${sign}${Math.abs(diff)} TL`, tone: 'high' }
  }

  const channel = Number(channelPrice ?? 0)
  const ccs = Number(ccsPrice ?? 0)
  const diff = channel - ccs
  if (diff === 0) {
    return highlightOnly ? { text: '—', tone: 'high' } : { text: '—', tone: 'match' }
  }
  const sign = diff > 0 ? '+' : '−'
  return { text: `${sign}${Math.abs(diff)} TL`, tone: 'high' }
}
