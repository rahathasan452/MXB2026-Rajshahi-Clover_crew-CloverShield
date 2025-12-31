import React, { useState } from 'react'
import axios from 'axios'
import { useAppStore } from '@/store/useAppStore'
import { Icon } from './Icon'
import toast from 'react-hot-toast'

interface SimulationControlsProps {
  language?: 'en' | 'bn'
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  language = 'en',
}) => {
  const { 
    isSimulating, 
    setIsSimulating, 
    simulationSpeed, 
    setSimulationSpeed,
    brandTheme 
  } = useAppStore()

  const [isLoading, setIsLoading] = useState(false)
  const isBkash = brandTheme === 'bkash'
  const accentColor = isBkash ? 'text-bkash-pink' : 'text-nagad-orange'
  const bgAccent = isBkash ? 'bg-bkash-pink' : 'bg-nagad-orange'

  // Get API URL from env or default
  const API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000'

  const toggleSimulation = async () => {
    try {
      setIsLoading(true)
      const endpoint = isSimulating ? '/simulate/stop' : '/simulate/start'
      await axios.post(`${API_URL}${endpoint}`)
      setIsSimulating(!isSimulating)
      toast.success(
        isSimulating 
          ? (language === 'bn' ? 'সিমুলেশন থামানো হয়েছে' : 'Simulation Paused')
          : (language === 'bn' ? 'সিমুলেশন শুরু হয়েছে' : 'Simulation Started')
      )
    } catch (error) {
      console.error('Simulation control error:', error)
      toast.error('Failed to control simulation')
    } finally {
      setIsLoading(false)
    }
  }

  const resetSimulation = async () => {
    try {
      setIsLoading(true)
      await axios.post(`${API_URL}/simulate/reset`)
      setIsSimulating(false)
      toast.success(language === 'bn' ? 'সিমুলেশন রিসেট হয়েছে' : 'Simulation Reset')
    } catch (error) {
      toast.error('Failed to reset simulation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSpeedChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseFloat(e.target.value)
    setSimulationSpeed(newSpeed)
    // Debounce this in production, but for now update directly
    try {
      await axios.post(`${API_URL}/simulate/config`, { speed: newSpeed })
    } catch (error) {
      console.error('Speed update failed', error)
    }
  }

  return (
    <div className="hud-card p-4 border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="scanline" />
      
      {/* Title */}
      <div className="flex items-center gap-2 relative z-10">
        <div className={`p-2 rounded-lg bg-white/5 border border-white/10 ${accentColor}`}>
          <Icon name="movie_filter" size={24} />
        </div>
        <div>
          <h3 className="font-bold text-text-primary tracking-tight">
            {language === 'bn' ? 'লাইভ স্ট্রিম কন্ট্রোল' : 'LIVE STREAM CONTROL'}
          </h3>
          <p className="text-[10px] text-text-secondary font-mono uppercase tracking-widest">
            {isSimulating 
              ? (language === 'bn' ? 'সিস্টেম সক্রিয়' : 'SYSTEM_ACTIVE') 
              : (language === 'bn' ? 'সিস্টেম নিষ্ক্রিয়' : 'SYSTEM_IDLE')}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
        {/* Speed Slider */}
        <div className="flex items-center gap-3 flex-1 md:flex-initial">
          <Icon name="speed" size={20} className="text-text-secondary" />
          <div className="flex flex-col w-32">
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={simulationSpeed}
              onChange={handleSpeedChange}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-text-secondary mt-1">
              <span>0.5x</span>
              <span className={accentColor}>{simulationSpeed}x</span>
              <span>10x</span>
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-white/10 hidden md:block"></div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={toggleSimulation}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-xl ${
              isSimulating
                ? 'bg-danger text-white hover:bg-danger/90'
                : 'bg-success text-dark-bg hover:bg-success/90'
            }`}
          >
            <Icon name={isSimulating ? "pause" : "play_arrow"} size={20} />
            {isSimulating 
              ? (language === 'bn' ? 'বিরতি' : 'PAUSE')
              : (language === 'bn' ? 'শুরু করুন' : 'START')
            }
          </button>
          
          <button
            onClick={resetSimulation}
            disabled={isLoading}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-text-secondary hover:text-white hover:bg-white/10 transition-colors"
            title={language === 'bn' ? 'রিসেট' : 'Reset'}
          >
            <Icon name="replay" size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
