import './editor.less';
import Canvas from './canvas2';

export default function () {
  return (
    <div className="editor-container">
      <div className="editor-header">Header</div>
      <div className="editor-content">
        {/* <div className="left-bar">Left Bar</div> */}
        <div className="center-content">
          <div className="main-content">
            <Canvas />
          </div>
        </div>
      </div>
    </div>
  );
}
