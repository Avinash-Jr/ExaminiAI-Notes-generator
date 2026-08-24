import {motion} from 'motion/react'

function Navbar () {
  return (
    <motion.div
    initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5 }}

        className='relative z-20 mt-6 mx-6 rounded-2xl bg-linear-to-br from-black/90 to-black/90 backdrop-blur-2xl border border-white/10 shadow-[0_22px_55px_rgba(0,0,0,0.75)] flex items-centre justify-between px-8 py-4'>
            <div></div>
            
            <div></div>

        </motion.div>
  )
}

export default Navbar