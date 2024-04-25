interact('#draggable')
 .draggable({
    inertia: true,
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: 'parent',
        endOnly: true
      })
    ],
    autoScroll: true,
    onmove: dragMoveListener,
    onend: function (event) {
      var textEl = event.target.querySelector('p');
      textEl && (textEl.textContent =
        'moved a distance of ' +
        (Math.sqrt(event.dx * event.dx +
                   event.dy * event.dy)|0) + 'px');
    }
 });

function dragMoveListener (event) {
 var target = event.target,
      // keep the dragged position in the data-x/data-y attributes
      x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
      y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

 // translate the element
 target.style.webkitTransform =
 target.style.transform =
    'translate(' + x + 'px, ' + y + 'px)';

 // update the position attributes
 target.setAttribute('data-x', x);
 target.setAttribute('data-y', y);
}
