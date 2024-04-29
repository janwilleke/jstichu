//import {decodeCard} from './DecodeCard.js'

var socket
var outSocket
function startFunction() {
    // Connect to the Socket.IO server.
    // The connection URL has the following format, relative to the current page:
    //     http[s]://<domain>:<port>[/<namespace>]

    socket = io();
    socket.on('connect', function() {
        socket.emit('startweb');
    });

    socket.on('move', function(msg, cb) {
	//console.log(msg);
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
	//console.log(msg);
	let cardnum = msg.num

	if (document.getElementById("card" + cardnum) || false) {
	    //console.log("exists");
	} else {
	    let cardcode = String.fromCharCode(cardnum + 0x30)
	    const { suit, rank, color_style } = decodeCard(cardnum)
	    let div = document.createElement('div');
	    div.id = "card" + cardnum;
	    div.className = 'card';
	    div.setAttribute('cardcode', cardcode);
	    div.textContent = rank + " " + suit;
	    div.classList.add(color_style); // lockup inside css
	    document.body.appendChild(div);
	}
	if (cb)
	    cb();
    });

    console.log("started");

    const height = window.innerHeight;
    const width = window.innerWidth;
    console.log(height, width); // 711 1440
    // das muss wohl als option raus
    outSocket = new WebSocket("ws://192.168.178.152:9292/connect?game_id=TESTI&player_id=Y4AP9");

    outSocket.onmessage = (event) => {
	socket.emit('client', event.data);
	parseincome(event.data);
    };

    var bottext = document.getElementById("bottext");

    $('form#rw').submit(function(event) {
	console.log("button" + $('#bottext').val());
	outSocket.send($('#bottext').val());
	return false;
    });

    socket.on('bottext', function(msg, cb) {
	bottext.value = msg.text;
    });
}

interact('.card').draggable({
    // enable inertial throwing
    inertia: true,
    // keep the element within the area of it's parent
    modifiers: [
	interact.modifiers.restrictRect({
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
            // Send the position to the Flask backend
	}
    }
})

interact('.dropzone').on('tap',function (event) {
    console.log("on tap drop zone");
    const collection = document.getElementsByClassName("in-drop");
    let s = "";
    for (let i = 0; i < collection.length; i++) {
	s = s + collection[i].getAttribute("cardcode");
	collection[i].remove();
    }
    var message = {
	"command": "play",
	"cards": s,
	"wish_rank": null
    };
    console.log(message)
    outSocket.send(JSON.stringify(message));
});

interact('.dropzone').dropzone({
    // Require a 75% element overlap for a drop to be possible
    overlap: 0.75,

    // listen for drop related events:

    ondragenter: function (event) {
	var draggableElement = event.relatedTarget
	var dropzoneElement = event.target
	draggableElement.classList.add('in-drop')
    },
    ondragleave: function (event) {
	event.relatedTarget.classList.remove('in-drop')
    },

    ondrop: function (event) {
	//console.log("reingelegt");
    }
})

function parseincome(data) {
    console.log(data);
}

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
