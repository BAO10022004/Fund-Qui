import React from "react";
import "../assets/AddPerson.css";

function AddPerson({ editingPerson, formData, setFormData, setShowModal, handleSubmit }: {
  editingPerson: { name: string; code: string } | null;
  formData: { name: string; code: string };
  setFormData: React.Dispatch<React.SetStateAction<{ name: string; code: string }>>;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleSubmit: () => void;
}) {
    // Prevent body scroll when modal is open
    React.useEffect(() => {
      document.body.classList.add('modal-open');
      return () => {
        document.body.classList.remove('modal-open');
      };
    }, []);

    return (
        <div className="modal-overlay-centered" onClick={() => setShowModal(false)}>
          <div className="modal-content-centered" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-centered" onClick={() => setShowModal(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="modal-header-centered">
              <div className="modal-icon-edit">
                🖊️
              </div>
              <h2 className="modal-title-centered">
                {editingPerson ? 'Sửa người' : 'Thêm người mới'}
              </h2>
            </div>

            <div className="modal-body-centered">
              <div className="form-group-centered">
                <label className="form-label-centered">Tên</label>
                <input
                  className="form-input-centered"
                  type="text"
                  placeholder="Nhập tên..."
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="form-group-centered">
                <label className="form-label-centered">Mã</label>
                <input
                  className="form-input-centered"
                  type="text"
                  placeholder="Nhập mã (VD: NVA001)..."
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div className="modal-footer-centered">
              <button 
                className="btn-cancel-centered" 
                onClick={() => setShowModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn-submit-centered" 
                onClick={handleSubmit}
              >
                {editingPerson ? 'Cập nhật' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
    );
}

export default AddPerson;