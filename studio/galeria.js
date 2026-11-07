/* Lexxo Studio: clicar numa imagem abre ela ampliada (Esc ou clique fecha). Sem JavaScript, o link abre a imagem inteira. */
(function () {
  'use strict';
  var box = null;
  function fecha() { if (box) { box.remove(); box = null; document.removeEventListener('keydown', tecla); } }
  function tecla(e) { if (e.key === 'Escape') { fecha(); } }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a.zoom') : null;
    if (!a) { return; }
    e.preventDefault();
    fecha();
    box = document.createElement('div');
    box.className = 'lb';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Imagem ampliada');
    var img = document.createElement('img'); img.src = a.getAttribute('href'); img.alt = a.getAttribute('data-leg') || '';
    var leg = document.createElement('p'); leg.textContent = a.getAttribute('data-leg') || '';
    var x = document.createElement('button'); x.type = 'button'; x.textContent = 'Fechar'; x.className = 'lb-x';
    box.appendChild(x); box.appendChild(img); box.appendChild(leg);
    box.addEventListener('click', fecha);
    document.body.appendChild(box);
    document.addEventListener('keydown', tecla);
    x.focus();
  });
})();
