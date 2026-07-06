interface Props {
  message: string;
  onUndo: () => void;
}

export function UndoToast({ message, onUndo }: Props) {
  return (
    <div className="undo-toast" role="status">
      <span>{message}</span>
      <button onClick={onUndo}>Undo</button>
    </div>
  );
}
