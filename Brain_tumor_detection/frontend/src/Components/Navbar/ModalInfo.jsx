import { TbUserFilled } from "react-icons/tb";
import { IoMdClose } from "react-icons/io";
import { FaUserDoctor } from "react-icons/fa6";
import { IoDocumentTextOutline } from "react-icons/io5";
import { FaCalendarAlt } from "react-icons/fa";

export default function ModalInfo({ onClose, onSubmit, interactChat}) {

    const handleExport = () => {
        const dataStr = JSON.stringify(interactChat, null, 2); // pretty print
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${interactChat.topic.replace(/\s+/g, "_") || "chat"}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          {/* Modal */}
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <TbUserFilled size={24} className="text-blue-600"/>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Patient Information</h3>
                    <p className="text-blue-100 text-sm">Medical Record Details</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white rounded-lg p-2 cursor-pointer"
                >
                  <IoMdClose size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Patient Information Section */}
              <div className="bg-slate-50 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TbUserFilled size={20} className="text-blue-600" />
                  <h4 className="text-lg font-semibold text-slate-800">Patient Details</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">First Name</label>
                    <p className="text-slate-800 font-medium mt-1">{interactChat.content.patientFirstName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Last Name</label>
                    <p className="text-slate-800 font-medium mt-1">{interactChat.content.patientLastName}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-slate-600">Patient ID</label>
                    <p className="text-slate-800 font-medium mt-1">{interactChat.content.patientId}</p>
                  </div>
                </div>
              </div>

              {/* Doctor Information Section */}
              <div className="bg-slate-50 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FaUserDoctor size={20} className="text-indigo-600" />
                  <h4 className="text-lg font-semibold text-slate-800">Attending Physician</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">First Name</label>
                    <p className="text-slate-800 font-medium mt-1">Dr. {interactChat.content.doctorFirstName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Last Name</label>
                    <p className="text-slate-800 font-medium mt-1">{interactChat.content.doctorLastName}</p>
                  </div>
                </div>
              </div>

              {/* Test Information Section */}
              <div className="bg-slate-50 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FaCalendarAlt size={20} className="text-green-600" />
                  <h4 className="text-lg font-semibold text-slate-800">Test Information</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Sample Collection Date</label>
                    <p className="text-slate-800 font-medium mt-1">{new Date(interactChat.content.sampleCollectionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                      <IoDocumentTextOutline size={16} />
                      Test Indication
                    </label>
                    <p className="text-slate-800 mt-1 leading-relaxed">{interactChat.content.testIndication}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 p-6 bg-slate-50 rounded-b-xl">

              <button
                onClick={(e) => {
                e.preventDefault(); // prevent navigation if inside Link
                e.stopPropagation(); // stop event bubbling (optional)
                handleExport();
                }}
                className="w-full px-6 py-3 my-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Save Chat
              </button>
                <br />
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
    )
}
