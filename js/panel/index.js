import React from "react";
import Button from "@material-ui/core/Button";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Faster from "@material-ui/icons/FastForward";
import Slower from "@material-ui/icons/FastRewind";

class Panel extends React.Component {
  playPause() {
    if (this.props.playing) {
      return "Pause";
    } else {
      return "Play";
    }
  }

  render() {
    return (
      <div className="panel">
        <AppBar color="secondary">
          <Toolbar variant="dense">
            <Button color="inherit" size="small" onClick={this.props.playPause}>
              {this.playPause()}
            </Button>
            <Button color="inherit" size="small" onClick={this.props.step}>
              Step
            </Button>
            <Button color="inherit" size="small" onClick={this.props.faster}>
              Speed +
            </Button>
            <Button color="inherit" size="small" onClick={this.props.slower}>
              Speed -
            </Button>
          </Toolbar>
        </AppBar>
      </div>
    );
  }
}

module.exports = Panel;
