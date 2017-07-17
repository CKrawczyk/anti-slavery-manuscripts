import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import SVGImage from '../components/SVGImage';
import { Utility } from '../lib/Utility';

import {
  setRotation, setScaling, setTranslation,
  setViewerState, SUBJECTVIEWER_STATES,
} from '../ducks/subject-viewer';

const INPUT_STATE = {
  IDLE: 0,
  ACTIVE: 1,
}

class SubjectViewer extends React.Component {
  constructor(props) {
    super(props);
    
    //HTML element refs.
    this.section = undefined;
    this.svg = undefined;
    
    //Events!
    this.updateSize = this.updateSize.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.onWheel = this.onWheel.bind(this);
    
    //Other functions
    this.getPointerXY = this.getPointerXY.bind(this);
    this.getBoundingBox = this.getBoundingBox.bind(this);
    
    //Mouse or touch pointer
    this.pointer = {
      start: { x: 0, y: 0 },
      now: { x: 0, y: 0 },
      state: INPUT_STATE.IDLE,
    };
    
    //Misc
    this.tmpTransform = null;
  }
  
  //----------------------------------------------------------------
  
  render() {
    const transform = `scale(${this.props.scaling}) translate(${this.props.translationX}, ${this.props.translationY}) rotate(${this.props.rotation}) `;
    
    return (
      <section className="subject-viewer" ref={(c)=>{this.section=c}}>
        <svg
          ref={(c)=>{this.svg=c}}
          viewBox="0 0 100 100"
          onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
          onMouseMove={this.onMouseMove}
          onMouseLeave={this.onMouseLeave}
          onWheel={this.onWheel}
        >
          <g transform={transform}>
            <SVGImage src="https://panoptes-uploads.zooniverse.org/production/subject_location/97af440c-15d2-4fb1-bc18-167c9151050a.jpeg" />
          </g>
          <g className="developer-grid" transform={transform}>
            {(()=>{
              const MIN_VAL = -1000;
              const MAX_VAL = 1000;
              const STEP_VAL = 100;
              const STYLE = { stroke: '#fff', strokeWidth: 2 };
              const STYLE_ORIGIN = { stroke: '#c33', strokeWidth: 2 };
              const STYLE_TEXT = { fill: '#c33', fontSize: '32px' }
              const STYLE_TEXT_SHADOW = { fill: '#fff', fontSize: '32px' }
              const arr = []
              for (let v = MIN_VAL; v <= MAX_VAL; v += STEP_VAL) {
                arr.push(<line x1={v} y1={MIN_VAL} x2={v} y2={MAX_VAL} style={STYLE} />);
                arr.push(<line x1={MIN_VAL} y1={v} x2={MAX_VAL} y2={v} style={STYLE} />);
              }
              arr.push(<line x1={-STEP_VAL} y1={0} x2={STEP_VAL} y2={0} style={STYLE_ORIGIN} />);
              arr.push(<line x1={0} y1={-STEP_VAL} x2={0} y2={STEP_VAL} style={STYLE_ORIGIN} />);
              arr.push(<text x={2} y={0} style={STYLE_TEXT_SHADOW}>(0,0)</text>);
              arr.push(<text x={-2} y={0} style={STYLE_TEXT_SHADOW}>(0,0)</text>);
              arr.push(<text x={0} y={0} style={STYLE_TEXT}>(0,0)</text>);
              return arr;
            })()}
          </g>
        </svg>
      </section>
    );
  }
  
  //----------------------------------------------------------------
  
  componentDidMount() {
    //Make sure we monitor visible size of Subject Viewer.
    window.addEventListener('resize', this.updateSize);
    this.updateSize();
  }
  
  componentWillUnmount() {
    //Cleanup
    window.removeEventListener('resize', this.updateSize);
  }
  
  //----------------------------------------------------------------
  
  /*  Update the size of the SVG element; this requires manual tweaking.
   */
  updateSize() {
    if (!this.section || !this.svg) return;
    
    const ARBITRARY_OFFSET = 2;
    const w = this.section.offsetWidth - ARBITRARY_OFFSET;
    const h = this.section.offsetHeight - ARBITRARY_OFFSET;
    
    //Note: if .offsetWidth/.offsetHeight gives problems, use
    //.getBoundingClientRect() or .clientHeight/.clientWidth .
    
    //Use the SVG viewbox to fit the 'canvas' to the <section> container, then
    //center the view on coordinates 0, 0.
    this.svg.setAttribute('viewBox', `${-w/2} ${(-h/2)} ${w} ${h}`);
    this.svg.style.width = w + 'px';
    this.svg.style.height = h + 'px';
  }
  
  //----------------------------------------------------------------
  
  onMouseDown(e) {
    if (this.props.viewerState === SUBJECTVIEWER_STATES.NAVIGATING) {
      const pointerXY = this.getPointerXY(e);
      this.pointer.state = INPUT_STATE.ACTIVE;
      this.pointer.start = { x: pointerXY.x, y: pointerXY.y };
      this.pointer.now = { x: pointerXY.x, y: pointerXY.y };    
      this.tmpTransform = {
        scale: this.props.scaling,
        translateX: this.props.translationX,
        translateY: this.props.translationY,
      };
      return Utility.stopEvent(e);
    }
  }
  
  onMouseUp(e) {
    if (this.props.viewerState === SUBJECTVIEWER_STATES.NAVIGATING) {
      const pointerXY = this.getPointerXY(e);
      this.pointer.state = INPUT_STATE.IDLE;
      this.pointer.now = { x: pointerXY.x, y: pointerXY.y };
      this.tmpTransform = false;
      return Utility.stopEvent(e);
    }
  }
  
  onMouseMove(e) {
    if (this.props.viewerState === SUBJECTVIEWER_STATES.NAVIGATING) {
      const pointerXY = this.getPointerXY(e);
      this.pointer.now = { x: pointerXY.x, y: pointerXY.y };
      if (this.pointer.state === INPUT_STATE.ACTIVE && this.tmpTransform) {
        const pointerDelta = {
          x: this.pointer.now.x - this.pointer.start.x,
          y: this.pointer.now.y - this.pointer.start.y
        };
        this.props.dispatch(setTranslation(
          this.tmpTransform.translateX + pointerDelta.x / this.tmpTransform.scale,
          this.tmpTransform.translateY + pointerDelta.y / this.tmpTransform.scale,
        ));
      }
      return Utility.stopEvent(e);
    }
  }
  
  onMouseLeave(e) {
    if (this.props.viewerState === SUBJECTVIEWER_STATES.NAVIGATING) {
      this.pointer.state = INPUT_STATE.IDLE;
      return Utility.stopEvent(e);
    }
  }
    
  onWheel(e) {
    if (this.props.viewerState === SUBJECTVIEWER_STATES.NAVIGATING) {
      const MIN_SCALE = 0.1;
      const SCALE_STEP = 0.1;      
      if (e.deltaY > 0) {
        this.props.dispatch(setScaling(Math.max(this.props.scaling - SCALE_STEP, MIN_SCALE)));
      } else if (e.deltaY < 0) {
        this.props.dispatch(setScaling(Math.max(this.props.scaling + SCALE_STEP, MIN_SCALE)));
      }
      return Utility.stopEvent(e);
    }
  }
  
  //----------------------------------------------------------------
  
  getBoundingBox() {
    const boundingBox = (this.svg && this.svg.getBoundingClientRect)
      ? this.svg.getBoundingClientRect()
      : { left: 0, top: 0, width: 1, height: 1 };
    return boundingBox;
  }
  
  getPointerXY(e) {
    //Compensate for HTML elements
    //----------------
    const boundingBox = this.getBoundingBox();
    let clientX = 0;
    let clientY = 0;
    if (e.clientX && e.clientY) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.touches && e.touches.length > 0 && e.touches[0].clientX &&
        e.touches[0].clientY) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    
    //SVG scaling: usually not an issue.
    const sizeRatioX = 1;
    const sizeRatioY = 1;

    var inputX = (clientX - boundingBox.left) * sizeRatioX;
    var inputY = (clientY - boundingBox.top) * sizeRatioY;
    //----------------
    
    return { x: inputX, y: inputY };
  }
}

SubjectViewer.propTypes = {
  rotation: PropTypes.number,
  scaling: PropTypes.number,
  translationX: PropTypes.number,
  translationY: PropTypes.number,
  viewerState: PropTypes.string,
};
SubjectViewer.defaultProps = {
  rotation: 0,
  scaling: 1,
  translationX: 0,
  translationY: 0,
  viewerState: SUBJECTVIEWER_STATES.NAVIGATING,
};
function mapStateToProps(state, ownProps) {  //Listens for changes in the Redux Store
  const store = state.subjectViewer;
  return {
    rotation: store.rotation,
    scaling: store.scaling,
    translationX: store.translationX,
    translationY: store.translationY,
    viewerState: store.viewerState,
  };
}
export default connect(mapStateToProps)(SubjectViewer);  //Connects the Component to the Redux Store
