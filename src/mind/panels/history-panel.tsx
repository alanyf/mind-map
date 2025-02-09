import { Button } from "antd";
import { useEditor } from "../use-editor";

export function HistoryPanel() {
  const { history } = useEditor();
  return (
    <>
      <Button size="small" onClick={() => history.undo()}>撤销</Button>
      <Button size="small" onClick={() => history.redo()}>重做</Button>
    </>
  );
}