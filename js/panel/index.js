import React from "react";
import Button from '@material-ui/core/Button';
import Toolbar from '@material-ui/core/Toolbar';
import Faster from '@material-ui/icons/FastForward';
import Slower from '@material-ui/icons/FastRewind';


class Panel extends React.Component {
  playPause() {
    if (this.props.playing) {
      return 'Pause';
    } else {
      return 'Play';
    }
  }

  render() {
    // <div style={{ textAlign: "center" }}>{this.props.tickDelay}</div>
    return (
      <div className="panel">
          <Button size="small" onClick={this.props.playPause}>{this.playPause()}</Button>
          <Button size="small" onClick={this.props.step}>Step</Button>
          <Button size="small" onClick={this.props.faster}>Speed +</Button>
          <Button size="small" onClick={this.props.slower}>Speed -</Button>
      </div>
    );
  }
}

module.exports = Panel;
