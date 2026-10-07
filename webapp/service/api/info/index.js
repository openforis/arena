import axios from 'axios'

export const fetchInfo = async () => {
  const [{ data }, { data: extraConfig }] = await Promise.all([axios.get('/api/info'), axios.get('/api/info/config')])
  return { ...data, config: { ...data.config, ...extraConfig } }
}
