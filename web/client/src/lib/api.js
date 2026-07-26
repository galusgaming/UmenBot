import React from 'react'

export function useMe() {
  const [data, setData] = React.useState({ user: null, loading: true })
  React.useEffect(() => {
    fetch('/api/me')
      .then(r => {
        if (r.status === 401 || r.status === 403) return { user: null }
        return r.json()
      })
      .then(j => setData({ user: j.user || null, loading: false }))
      .catch(() => setData({ user: null, loading: false }))
  }, [])
  return data
}

export function usePublicInfo() {
  const [data, setData] = React.useState({ info: null, loading: true })
  React.useEffect(() => {
    fetch('/api/public-info')
      .then(r => r.json())
      .then(j => setData({ info: j, loading: false }))
      .catch(() => setData({ info: null, loading: false }))
  }, [])
  return data
}

export function avatarUrl(user) {
  if (!user) return null
  if (!user.avatar) {
    const idx = Number(user.discriminator || 0) % 5
    return `https://cdn.discordapp.com/embed/avatars/${idx}.png`
  }
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
}
