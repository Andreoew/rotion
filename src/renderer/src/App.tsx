import './styles/global.css'

import { Routes } from './Routes'
import { queryClient } from './lib/react-query'
import { QueryClientProvider } from '@tanstack/react-query'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes />
    </QueryClientProvider>
  )
}
