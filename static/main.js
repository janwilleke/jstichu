//import {decodeCard} from './DecodeCard.js'

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
	console.log(msg);
	const elem = document.getElementById("card" + msg.num);
	elem.style.transform = 'translate(' + msg.x + 'px, ' + msg.y + 'px)';
	// update the posiion attributes
	elem.setAttribute('data-x', msg.x);
	elem.setAttribute('data-y', msg.y);
	if (cb)
	    cb();
    });

    socket.on('remove', function(msg, cb) {
	console.log(msg);
	const elem = document.getElementById(msg.id);
	elem.remove();
	if (cb)
	    cb();
    });

    socket.on('addcard', function(msg, cb) {
	console.log(msg);
	let cardnum = msg.num
	const { suit, rank, color_style } = decodeCard(cardnum)
	let div = document.createElement('div');
	div.id = "card" + cardnum;
	div.className = 'card';
	div.textContent = rank + " " + suit;
	div.classList.add(color_style); // lockup inside css
	document.body.appendChild(div);
	if (cb)
	    cb();
    });

    console.log("started");

    const height = window.innerHeight;
    const width = window.innerWidth;
    console.log(height, width); // 711 1440
}


// target elements with the "draggable" class
interact('.card').on('tap', function (event) {
    console.log("on tap");
    	  const pos = {card: event.target.id,
		       x: event.target.getAttribute('data-x'),
		       y: event.target.getAttribute('data-y')};
	  socket.emit('pressed', pos);

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
