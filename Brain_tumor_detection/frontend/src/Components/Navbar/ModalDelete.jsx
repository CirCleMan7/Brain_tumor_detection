import { CgDanger } from "react-icons/cg";

export default function ModalDelete({ onClose, onSubmit, interactChat }) {
    return (
        // This is the backdrop overlay (dark background)
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          {/* This is the actual modal */}
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <CgDanger size={32} className="text-red-600" />
              </div>
            </div>

            {/* Content */}
            <h3 className="text-2xl font-bold text-slate-800 text-center mb-2">
              Are you sure?
            </h3>
            <p className="text-slate-600 text-center mb-6">
              Do you really want to delete patientId <span className="font-semibold">"{interactChat.topic}"</span>? 
              This action cannot be undone.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
    )   
}