const NoCaseNotice = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-base-100">
      <div className="text-center px-8 max-w-md">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-20 h-20 text-cyan-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-semibold text-base-content mb-3">
          No chat selected
        </h2>

        {/* Description */}
        <p className="text-base-content/60 mb-8">
          Select a chat from the sidebar or create a new case.
        </p>

        {/* Action Button */}
        {/* <button
          className="btn btn-primary bg-cyan-500 hover:bg-cyan-600 border-cyan-500 hover:border-cyan-600 text-white"
          onClick={handleCreateCase}
        >
          Create New Case
        </button> */}
      </div>
    </div>
  )
}
export default NoCaseNotice
