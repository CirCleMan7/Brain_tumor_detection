import { MdOutlineKeyboardArrowLeft } from 'react-icons/md'
import { useState } from 'react'

const SlideWrapper = ({ children }) => {
  const [open, setOpen] = useState(true)

  const handleToggle = () => {
    setOpen(!open)
  }

  return (
    <div className={['flex items-center h-screen relative'].join(' ')}>
      <div
        className={[
          'transition-[max-width] duration-500 ease-in-out overflow-hidden min-w-0',
          open ? 'max-w-[800px]' : 'max-w-0 opacity-80 pointer-events-none',
        ].join(' ')}
      >
        {children}
      </div>
      {/* <MdOutlineKeyboardArrowLeft
        size={60}
        className={[
          'text-gray-500 hover:text-black hover:scale-120 transition-transform duration-200 cursor-pointer',
          open ? '-translate-x-[60px]' : 'rotate-180 ',
        ].join(' ')}
        onClick={handleToggle}
      /> */}
      <div
        className={[
          'bg-black w-[30px] h-full z-0 flex items-center cursor-pointer',
          'transition-transform duration-500 ease-in-out ',
          open ? '' : 'translate-x-[0px]',
        ].join(' ')}
        onClick={handleToggle}
      >
        <MdOutlineKeyboardArrowLeft
          size={60}
          className={[
            'z-10 text-gray-500 hover:text-black hover:scale-120 transition-transform duration-200 ',
            open ? '' : 'rotate-180 ',
            'hover:text-gray-300',
          ].join(' ')}
        />
      </div>
    </div>
  )
}
export default SlideWrapper
