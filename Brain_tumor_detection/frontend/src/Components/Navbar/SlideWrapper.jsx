import { MdOutlineKeyboardArrowLeft } from 'react-icons/md'
import { useState } from 'react'

const PANEL_W = 500

const SlideWrapper = ({ children }) => {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="flex h-screen"
      style={{ '--panel-w': open ? `${PANEL_W}px` : '0px' }}
    >
      <div
        className={[
          'shrink-0 overflow-hidden',
          'w-[var(--panel-w)] transition-[width] duration-500 ease-in-out',
          '[will-change:width]',
        ].join(' ')}
        aria-hidden={!open}
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="shrink-0 w-[30px] h-full bg-black flex items-center justify-center cursor-pointer focus:outline-none"
        aria-pressed={open}
        aria-label={open ? 'Close panel' : 'Open panel'}
      >
        <MdOutlineKeyboardArrowLeft
          size={60}
          className={[
            'text-gray-500 transition-transform duration-300 hover:text-gray-300 hover:scale-[1.2]',
            open ? '' : 'rotate-180',
          ].join(' ')}
        />
      </button>
    </div>
  )
}

export default SlideWrapper
