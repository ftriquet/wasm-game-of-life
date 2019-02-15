import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Modal from "@material-ui/core/Modal";
import Button from "@material-ui/core/Button";

function getModalStyle() {
  const top = 50;
  const left = 50;

  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-${top}%, -${left}%)`
  };
}

const styles = theme => {
  console.log(theme);
  return {
    paper: {
      position: "absolute",
      // width: theme.spacing.unit * 50,
      backgroundColor: theme.palette.background.paper,
      boxShadow: theme.shadows[5],
      padding: theme.spacing.unit * 4
      // outline: "none"
    }
  };
};

class LoadModal extends React.Component {
  constructor(props) {
    super(props);
    this.textareaRef = React.createRef();
  }

  handleSubmit() {
    this.props.onSubmit(this.textareaRef.current.value);
  }

  render() {
    const { classes } = this.props;

    return (
      <div>
        <Modal
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
          open={true}
          onClose={this.props.onClose}
        >
          <div style={getModalStyle()} className={classes.paper}>
            <textarea
              ref={this.textareaRef}
              style={{ resize: "none", width: "600px", height: "300px" }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                flexDirection: "column"
              }}
            >
              <Button
                color="primary"
                variant="contained"
                size="small"
                style={{ position: "relative", marginTop: "15px" }}
                onClick={this.handleSubmit.bind(this)}
              >
                Load
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

// We need an intermediary variable for handling the recursive nesting.
const LoadModalWrapped = withStyles(styles)(LoadModal);

export default LoadModalWrapped;
