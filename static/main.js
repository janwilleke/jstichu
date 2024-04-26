var socket
function startFunction() {
    // Connect to the Socket.IO server.
    // The connection URL has the following format, relative to the current page:
    //     http[s]://<domain>:<port>[/<namespace>]
    socket = io();
    socket.on('connect', function() {
        socket.emit('startweb');
    });
    socket.on('move', function(msg, cb) {
	console.log(msg.data);
	const elem = document.getElementById(msg.id);
	elem.style.transform = 'translate(' + msg.x + 'px, ' + msg.y + 'px)'

	// update the posiion attributes
	elem.setAttribute('data-x', msg.x)
	elem.setAttribute('data-y', msg.y)

	if (cb)
	    cb();
    });
    console.log("started");

}


// target elements with the "draggable" class
interact('.card').on('tap', function (event) {
         console.log("on tap");
      });

interact('.card')
  .draggable({
    // enable inertial throwing
    inertia: true,
    // keep the element within the area of it's parent
    modifiers: [
      interact.modifiers.restrictRect({
//        restriction: 'parent',
        endOnly: true
      })
    ],
    // enable autoScroll
    autoScroll: true,

    listeners: {
      // call this function on every dragmove event
      move: dragMoveListener,

      // call this function on every dragend event
      end (event) {

	  const pos = {target: event.target.id,
		       x: event.target.getAttribute('data-x'),
		       y: event.target.getAttribute('data-y')};
	  socket.emit('moveele', pos);
          // Send the position to the Flask backend

      }
    }
  })

function dragMoveListener (event) {
  var target = event.target
  // keep the dragged position in the data-x/data-y attributes
  var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
  var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

  // translate the element
  target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'

  // update the posiion attributes
  target.setAttribute('data-x', x)
  target.setAttribute('data-y', y)
}

// this function is used later in the resizing and gesture demos
window.dragMoveListener = dragMoveListener
