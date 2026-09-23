import { Hero } from './components/Hero'
import { AwisGrid } from './components/AwisGrid'
import { AiEngines } from './components/AiEngines'
import { Workflow } from './components/Workflow'
import { Footer } from './components/Footer'
import { CustomCursor } from './components/CustomCursor'

function App() {
  return (
    <div className="bg-[--color-page-bg] min-h-screen w-full px-2 py-2 md:px-6 md:py-6 overflow-hidden transition-colors duration-500">
      <CustomCursor />
      
      {/* FULL APP CONTAINER */}
      <div className="bg-[--color-bg-base] rounded-[2.5rem] md:rounded-[3rem] mx-auto max-w-[1600px] shadow-[0_30px_60px_rgba(0,0,0,0.15)] overflow-hidden relative transition-colors duration-500">
        
        {/* GLOBAL AMBIENT BACKGROUNDS (Consistent across whole page below hero) */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[40%] right-[-10%] w-[50vw] h-[50vw] md:w-[600px] md:h-[600px] bg-[--color-accent-cyan] rounded-full blur-[150px] opacity-[0.03] dark:opacity-[0.02]" />
          <div className="absolute bottom-[20%] left-[-10%] w-[50vw] h-[50vw] md:w-[600px] md:h-[600px] bg-[--color-accent-lime] rounded-full blur-[150px] opacity-[0.03] dark:opacity-[0.01]" />
        </div>
        <Hero />
        <AwisGrid />
        <AiEngines />
        <Workflow />
        <Footer />
      </div>
    </div>
  )
}

export default App
