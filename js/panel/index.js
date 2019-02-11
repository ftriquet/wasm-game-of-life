import React from "react";
import Button from "@material-ui/core/Button";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Faster from "@material-ui/icons/FastForward";
import Slower from "@material-ui/icons/FastRewind";

import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ExpandMore from "@material-ui/icons/ExpandMore";

import LoadModal from "../loadModal";

class Panel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalIsOpen: false
    };
  }

  playPause() {
    if (this.props.playing) {
      return "Pause";
    } else {
      return "Play";
    }
  }

  openLoadModal() {
    this.setState({ modalIsOpen: true });
  }

  onModalSubmit(content) {
    this.props.loadRle(content);
    this.setState({ modalIsOpen: false });
  }

  onModalClose() {
    this.setState({ modalIsOpen: false });
  }

  // give array of objects to loadMenu //dropdown
  render() {
    return (
      <div className="panel">
        <AppBar color="primary" position="static">
          <Toolbar variant="dense">
            <Button color="inherit" size="small" onClick={this.props.playPause}>
              {this.playPause()}
            </Button>
            <Button color="inherit" size="small" onClick={this.props.clear}>
              Clear
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
            <Button
              color="inherit"
              size="small"
              onClick={this.openLoadModal.bind(this)}
            >
              Load
            </Button>
            {this.state.modalIsOpen && (
              <LoadModal
                onSubmit={this.onModalSubmit.bind(this)}
                onClose={this.onModalClose.bind(this)}
              />
            )}
          </Toolbar>
        </AppBar>
      </div>
    );
  }
}

module.exports = Panel;
