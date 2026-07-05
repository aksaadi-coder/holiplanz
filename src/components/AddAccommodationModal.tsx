interface Props {
  loading: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

export function AddAccommodationModal({ loading, onSubmit, onClose }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <h3>Add accommodation</h3>
        <p className="subtitle">
          We'll suggest 3 accommodation options (budget, mid-range, boutique/luxury) covering your stay.
        </p>
        <div className="add-accommodation-form">
          <button onClick={onSubmit} disabled={loading}>
            {loading ? "Updating your trip..." : "Suggest accommodation"}
          </button>
        </div>
      </div>
    </div>
  );
}
