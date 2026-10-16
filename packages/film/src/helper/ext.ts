export function getFileExt(url: string): string {
    if (!url) return ''

    if (url.startsWith('data:')) {
        const head = url.slice(5, url.indexOf(','))
        const slash = head.indexOf('/')
        const semi = head.indexOf(';')
        return slash > -1
            ? head.slice(slash + 1, semi > -1 ? semi : undefined).toLowerCase()
            : ''
    }

    let end = url.length
    const q = url.indexOf('?')
    const h = url.indexOf('#')
    if (q > -1 && q < end) end = q
    if (h > -1 && h < end) end = h

    const dot = url.lastIndexOf('.', end)
    const slash = url.lastIndexOf('/', end)

    return dot > slash ? url.slice(dot + 1, end).toLowerCase() : ''
}